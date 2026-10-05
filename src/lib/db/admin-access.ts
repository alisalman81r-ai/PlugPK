// src/lib/db/admin-access.ts
import 'server-only'

import { cookies } from 'next/headers'

import { USER_COOKIE_NAME, readUserSession } from '@/lib/user-auth'

import { prisma } from './client'
import { getSessionUserId } from './session'

/**
 * The one answer to "may this request use the admin portal?".
 *
 * Every admin server action calls assertAdmin() itself rather than trusting
 * the layout: a server action is a POST endpoint reachable by anything that
 * learns its id, and the layout guards rendering, not invocation.
 *
 * isAdmin is re-read from the database on every call, and the session itself
 * is version-checked (session.ts), so revoking the column or resetting the
 * password locks an operator out on their next request.
 */

export interface AdminActor {
  id: string
  email: string
  name: string
}

/** The signed-in operator, or null when the caller is not one. */
export async function getAdminActor(): Promise<AdminActor | null> {
  // One query, not two: the signature is checked locally, then the version
  // check and the isAdmin check read the same row. Every admin action starts
  // here, and the database is a round trip away in another region.
  const claims = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!claims) return null

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, email: true, name: true, isAdmin: true, sessionVersion: true },
  })
  if (!user?.isAdmin || user.sessionVersion !== claims.version) return null
  return { id: user.id, email: user.email, name: user.name }
}

export async function isRequestAdmin(): Promise<boolean> {
  return (await getAdminActor()) !== null
}

/** True when somebody is signed in as an account, admin or not. */
export async function hasAccountSession(): Promise<boolean> {
  return (await getSessionUserId()) !== null
}

/** Throws unless the caller is an operator; returns who they are. */
export async function assertAdmin(): Promise<AdminActor> {
  const actor = await getAdminActor()
  if (!actor) throw new Error('Not authorised')
  return actor
}
