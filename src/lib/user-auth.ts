// src/lib/user-auth.ts
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed session cookies for every account — drivers, business owners and
 * operators alike.
 *
 * The cookie holds `userId.version.expiry.signature`. All three values are
 * inside the signed payload, so a cookie cannot be edited to extend its life
 * or to impersonate another account.
 *
 * `version` is User.sessionVersion at the moment of sign-in. The signature
 * alone cannot be revoked, so src/lib/db/session.ts compares this number with
 * the row on every read: bumping the column (password change, operator reset,
 * "sign out everywhere") ends every session the account has open.
 *
 * Cookies minted before the version existed have three parts and read as
 * version 0, which is every account's starting value — so nobody was signed
 * out by the change.
 */

const COOKIE_NAME = 'plugpk_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export const USER_COOKIE_NAME = COOKIE_NAME
export const USER_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS

/**
 * Signing key.
 *
 * Production requires its own SESSION_SECRET and fails closed without one.
 * The fallback to ADMIN_PASSWORD is for local development only: reusing a
 * password as a signing key means anyone who learns it can forge a session for
 * any account.
 */
function getSecret(): string | null {
  const own = process.env.SESSION_SECRET
  if (own && own.length > 0) return own
  if (process.env.NODE_ENV === 'production') return null
  const fallback = process.env.ADMIN_PASSWORD
  return fallback && fallback.length > 0 ? fallback : null
}

export function getUserAuthConfigError(): string | null {
  if (getSecret()) return null
  return process.env.NODE_ENV === 'production'
    ? 'SESSION_SECRET is not set.'
    : 'Neither SESSION_SECRET nor ADMIN_PASSWORD is set.'
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function createUserSessionValue(userId: string, version: number): string | null {
  const secret = getSecret()
  if (!secret) return null
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = `${userId}.${version}.${expiresAt}`
  return `${payload}.${sign(payload, secret)}`
}

/** Constant-time compare, so a wrong value cannot be narrowed by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export interface SessionClaims {
  userId: string
  version: number
}

/**
 * The claims in a genuine, unexpired cookie, or null. Never throws.
 *
 * This proves the cookie was issued by this server; it does not prove the
 * session is still current. Use getSessionUserId() in src/lib/db/session.ts,
 * which also checks the version against the database.
 */
export function readUserSession(value: string | undefined): SessionClaims | null {
  const secret = getSecret()
  if (!secret || !value) return null

  const parts = value.split('.')

  // Legacy three-part cookie: userId.expiry.signature, signed as `id.expiry`.
  if (parts.length === 3) {
    const [userId, expiryPart, signature] = parts as [string, string, string]
    const expiresAt = Number(expiryPart)
    if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null
    return safeEqual(signature, sign(`${userId}.${expiresAt}`, secret))
      ? { userId, version: 0 }
      : null
  }

  if (parts.length !== 4) return null
  const [userId, versionPart, expiryPart, signature] = parts as [string, string, string, string]
  const version = Number(versionPart)
  const expiresAt = Number(expiryPart)
  if (!userId || !Number.isInteger(version) || !Number.isFinite(expiresAt)) return null
  if (expiresAt < Date.now()) return null

  return safeEqual(signature, sign(`${userId}.${version}.${expiresAt}`, secret))
    ? { userId, version }
    : null
}
