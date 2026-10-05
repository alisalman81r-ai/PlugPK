// src/lib/db/rate-limit.ts
import 'server-only'

import { createHash } from 'node:crypto'

import { headers } from 'next/headers'

import { prisma } from './client'

/**
 * Fixed-window rate limiting backed by the RateLimit table.
 *
 * Postgres rather than memory because a serverless deployment has no shared
 * memory between invocations — an in-process counter would reset on every cold
 * start and limit nothing. One atomic upsert per check: the window either
 * restarts or the count increments, in the same statement, so two concurrent
 * requests can never both read "under the limit".
 *
 * Fails open. If the table cannot be reached the request is allowed, because a
 * database hiccup locking every user out of sign-in is worse than a few
 * unthrottled attempts.
 */

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the window resets, for a "try again in…" message. */
  retryAfterSeconds: number
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32)
}

/** The caller's IP, hashed so the table never stores a raw address. */
export function clientFingerprint(): string {
  const h = headers()
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || h.get('x-real-ip') || 'unknown'
  return hash(ip)
}

/** Hash any identifier (an email, a business id) into a key segment. */
export function keyPart(value: string): string {
  return hash(value.trim().toLowerCase())
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"
    `
    const row = rows[0]
    if (!row) return { allowed: true, retryAfterSeconds: 0 }
    const retryAfterSeconds = Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000))
    return { allowed: row.count <= limit, retryAfterSeconds }
  } catch (error) {
    console.error('[rate-limit] check failed, allowing request', error)
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

/**
 * Checks several limits and reports the first one exceeded. Every limit is
 * consumed, so hammering one email from many IPs still counts against both.
 */
export async function checkLimits(
  checks: { key: string; limit: number; windowSeconds: number }[],
): Promise<RateLimitResult> {
  const results = await Promise.all(
    checks.map((c) => consumeRateLimit(c.key, c.limit, c.windowSeconds)),
  )
  const blocked = results.filter((r) => !r.allowed)
  if (blocked.length === 0) return { allowed: true, retryAfterSeconds: 0 }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(...blocked.map((r) => r.retryAfterSeconds)),
  }
}

/** "Try again in 4 minutes." — the sentence every limited form shows. */
export function retryMessage(seconds: number, what = 'Too many attempts'): string {
  if (seconds <= 60) return `${what}. Please try again in a minute.`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${what}. Please try again in ${minutes} minutes.`
  const hours = Math.ceil(minutes / 60)
  return `${what}. Please try again in ${hours} hour${hours === 1 ? '' : 's'}.`
}

/**
 * Once-per-window de-duplication, e.g. one counted view per visitor per day.
 * Returns true the first time a key is seen in its window.
 */
export async function firstInWindow(key: string, windowSeconds: number): Promise<boolean> {
  const result = await consumeRateLimit(key, 1, windowSeconds)
  return result.allowed
}
