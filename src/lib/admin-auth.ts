// src/lib/admin-auth.ts
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Admin access control.
 *
 * Two independent gates, because they fail differently:
 *
 *   ENABLE_ADMIN   decides whether /admin exists at all. Enforced in
 *                  middleware, which runs before any page code, so an unset
 *                  flag means the routes 404 exactly like any unknown path —
 *                  no login form, no hint that a portal is there.
 *
 *   ADMIN_PASSWORD decides who gets in once it does exist. Checked on the
 *                  server against an HMAC-signed httpOnly cookie, so the
 *                  browser never holds anything that can be edited into a
 *                  session.
 *
 * What this is not: per-user accounts, roles, or an audit trail. It is a
 * shared credential for an operator-run portal. If more than one person needs
 * access, or you need to know who changed what, this needs replacing with
 * real user auth — not extending.
 */

const COOKIE_NAME = 'plugpk_admin'
/** Sessions are short by design; this is a standing key to the whole product. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS

export function isAdminEnabled(): boolean {
  return process.env.ENABLE_ADMIN === 'true'
}

/**
 * The configured password, with surrounding whitespace removed.
 *
 * Trimmed at both ends of the comparison — here and on the submitted value.
 * A shared credential gets pasted, and a paste picks up a trailing space or
 * newline more often than not; `safeEqual` compares lengths first, so one
 * stray space reads as a wrong password. The login form cannot say which
 * failure it was, by design, so that combination is close to undiagnosable
 * from the browser — it cost a round trip of "the password you gave me does
 * not work" to find.
 *
 * The trade is that leading and trailing whitespace can no longer be part of
 * the password. For an operator credential typed into a form that is worth
 * it; a password whose security rests on an invisible trailing space is not a
 * password worth protecting.
 */
function getSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password || password.length === 0) return null
  return password
}

/** Whether the portal is usable at all, or only misconfigured. */
export function getAdminConfigError(): string | null {
  if (!isAdminEnabled()) return 'ENABLE_ADMIN is not set to "true".'
  if (!getSecret()) return 'ADMIN_PASSWORD is not set.'
  return null
}

/**
 * Signs the session as `expiry.signature`. The expiry is inside the signed
 * payload, so a cookie cannot be edited to extend its own life — changing the
 * timestamp invalidates the signature.
 */
function sign(expiresAt: number, secret: string): string {
  return createHmac('sha256', secret).update(String(expiresAt)).digest('hex')
}

export function createSessionValue(): string | null {
  const secret = getSecret()
  if (!secret) return null
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  return `${expiresAt}.${sign(expiresAt, secret)}`
}

/** Constant-time compare, so a wrong value cannot be narrowed by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export function verifyPassword(candidate: string): boolean {
  const secret = getSecret()
  if (!secret) return false
  return safeEqual(candidate.trim(), secret)
}

export function verifySessionValue(value: string | undefined): boolean {
  const secret = getSecret()
  if (!secret || !value) return false

  const [expiryPart, signaturePart] = value.split('.')
  if (!expiryPart || !signaturePart) return false

  const expiresAt = Number(expiryPart)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  return safeEqual(signaturePart, sign(expiresAt, secret))
}
