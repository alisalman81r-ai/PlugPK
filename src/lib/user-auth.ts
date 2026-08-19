// src/lib/user-auth.ts
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Sessions for account holders — EV owners and business owners.
 *
 * Separate from admin-auth on purpose. That one is a single shared credential
 * for an operator portal and carries no identity; this one has to say *which*
 * account is signed in, because the business dashboard shows one owner their
 * own listing and must not show them anyone else's.
 *
 * The cookie holds `userId.expiry.signature`. Both the id and the expiry are
 * inside the signed payload, so a cookie cannot be edited to extend its life
 * or to impersonate another account — changing either invalidates the
 * signature. The browser never holds anything that grants access on its own.
 *
 * What this is not: password reset, email verification, refresh tokens, or
 * roles. It is enough to keep someone signed in and to know who they are.
 */

const COOKIE_NAME = 'plugpk_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export const USER_COOKIE_NAME = COOKIE_NAME
export const USER_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS

/**
 * Signing key.
 *
 * Falls back to ADMIN_PASSWORD only so local development works without extra
 * setup. In any real deployment SESSION_SECRET should be its own long random
 * value — reusing the admin password means one leak compromises both.
 */
function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD
  return secret && secret.length > 0 ? secret : null
}

export function getUserAuthConfigError(): string | null {
  return getSecret() ? null : 'Neither SESSION_SECRET nor ADMIN_PASSWORD is set.'
}

function sign(userId: string, expiresAt: number, secret: string): string {
  return createHmac('sha256', secret).update(`${userId}.${expiresAt}`).digest('hex')
}

export function createUserSessionValue(userId: string): string | null {
  const secret = getSecret()
  if (!secret) return null
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  return `${userId}.${expiresAt}.${sign(userId, expiresAt, secret)}`
}

/** Constant-time compare, so a wrong value cannot be narrowed by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

/** Returns the signed-in user's id, or null. Never throws on a bad cookie. */
export function readUserSession(value: string | undefined): string | null {
  const secret = getSecret()
  if (!secret || !value) return null

  // The id is a UUID and contains no dots, so splitting from the right is
  // unambiguous even if that ever changes.
  const parts = value.split('.')
  if (parts.length < 3) return null

  const signature = parts[parts.length - 1] as string
  const expiryPart = parts[parts.length - 2] as string
  const userId = parts.slice(0, parts.length - 2).join('.')
  if (!userId || !expiryPart || !signature) return null

  const expiresAt = Number(expiryPart)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null

  return safeEqual(signature, sign(userId, expiresAt, secret)) ? userId : null
}
