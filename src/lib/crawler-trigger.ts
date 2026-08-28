import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * The gate on the crawler's HTTP trigger.
 *
 * ── Why there is an HTTP trigger at all ───────────────────────────────
 *
 * The crawl is a Node command, and a command needs something to run it. What
 * that something is depends on where this project is deployed, and the honest
 * answer today is that it is not deployed anywhere — see docs/CRAWLER.md. So the
 * scheduler cannot be chosen for the operator; it has to be *available* to
 * whichever one they pick.
 *
 * A command covers the hosts where a shell exists: Task Scheduler on the machine
 * this was built on, cron or a systemd timer on a VPS. This route covers the rest
 * — a hosted scheduler, an uptime monitor, a phone — by making the run something
 * any HTTP client can start. Between the two there is no plausible host with no
 * way to run this daily, which was the requirement.
 *
 * ── Two independent gates, because they fail differently ──────────────
 *
 *   CRAWLER_ENABLED         whether the route exists at all. Unset means 404,
 *                           identical to a URL that was never built. This is the
 *                           activation switch, and it is off.
 *
 *   CRAWLER_TRIGGER_SECRET  who may fire it, checked in constant time against a
 *                           bearer token.
 *
 * The same shape as the admin gate in admin-auth.ts, for the same reason: a flag
 * that hides the endpoint cannot be defeated by guessing a password, and a
 * password cannot be defeated by the flag being wrong. Either alone would be one
 * mistake away from a public endpoint that runs a crawl.
 */

/**
 * Whether unattended crawling is switched on.
 *
 * Anything other than exactly "true" is off. Not truthy-ish, not "1", not "yes":
 * a switch that turns on unattended writes to a production database should only
 * be turned on by somebody who meant that exact word.
 */
export function isCrawlerTriggerEnabled(): boolean {
  return process.env.CRAWLER_ENABLED === 'true'
}

/**
 * The shortest secret worth having.
 *
 * A trigger token sits in a third-party scheduler's configuration and is sent
 * over the wire every morning. 32 characters of base64url is 192 bits, which is
 * beyond brute force, and refusing anything shorter means the endpoint cannot be
 * protected by a password somebody chose by hand.
 */
const MIN_SECRET_LENGTH = 32

function getSecret(): string | null {
  const secret = process.env.CRAWLER_TRIGGER_SECRET?.trim()
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null
  return secret
}

/** Why the trigger cannot be used, when it cannot. Never names the secret. */
export function getTriggerConfigError(): string | null {
  if (!isCrawlerTriggerEnabled()) return 'CRAWLER_ENABLED is not set to "true".'
  if (!process.env.CRAWLER_TRIGGER_SECRET?.trim()) return 'CRAWLER_TRIGGER_SECRET is not set.'
  if (!getSecret()) {
    return `CRAWLER_TRIGGER_SECRET is shorter than ${MIN_SECRET_LENGTH} characters.`
  }
  return null
}

/**
 * Constant-time comparison of two secrets.
 *
 * Hashed before comparing rather than compared directly, because timingSafeEqual
 * throws on a length mismatch — and catching that to return false leaks the
 * length of the real secret through the difference between a throw and a
 * comparison. Two SHA-256 digests are always the same length, so every candidate
 * takes the same path and the same time.
 */
function safeEqual(candidate: string, secret: string): boolean {
  const a = createHash('sha256').update(candidate).digest()
  const b = createHash('sha256').update(secret).digest()
  return timingSafeEqual(a, b)
}

/**
 * Verifies the bearer token on a trigger request.
 *
 * Accepts `Authorization: Bearer <secret>` only. Not a query parameter: a secret
 * in a URL is written to every access log it passes through, including the
 * caller's, and those logs outlive any rotation.
 */
export function verifyTriggerAuth(authorizationHeader: string | null): boolean {
  const secret = getSecret()
  if (!secret || !authorizationHeader) return false

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim())
  if (!match?.[1]) return false

  return safeEqual(match[1].trim(), secret)
}
