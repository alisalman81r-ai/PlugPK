// src/lib/db/session.ts
import 'server-only'

import { cookies } from 'next/headers'

import { LEGACY_ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import {
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
  createUserSessionValue,
  readUserSession,
} from '@/lib/user-auth'

import { prisma } from './client'

/**
 * The one way server code learns who is signed in.
 *
 * Not a 'use server' module: nothing here may be callable from a browser.
 * startSession used to be exported from session-actions.ts, which made it a
 * public endpoint that would sign the caller in as whatever user id they sent.
 */

/**
 * The signed-in account's id, or null.
 *
 * Checks the signature and expiry, then that the account still exists and the
 * cookie's version matches User.sessionVersion — so a deleted account, a
 * password change or an operator reset ends the session on the next request.
 */
export async function getSessionUserId(): Promise<string | null> {
  const claims = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!claims) return null

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { sessionVersion: true },
  })
  if (!user || user.sessionVersion !== claims.version) return null
  return claims.userId
}

/** Issues the session cookie for an account at its current version. */
export async function startSession(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  })
  if (!user) return false

  const value = createUserSessionValue(userId, user.sessionVersion)
  if (!value) return false

  cookies().set(USER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: USER_SESSION_MAX_AGE,
  })
  return true
}

/** Clears this browser's session, including the retired admin cookie. */
export function clearSession(): void {
  cookies().delete(USER_COOKIE_NAME)
  cookies().delete(LEGACY_ADMIN_COOKIE_NAME)
}

/**
 * Ends every session the account has open, everywhere. The caller re-issues a
 * cookie with startSession() if the current browser should stay signed in.
 */
export async function revokeSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  })
}
