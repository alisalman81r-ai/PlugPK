// src/lib/db/admin-access.ts
import 'server-only'

import { cookies } from 'next/headers'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'
import { USER_COOKIE_NAME, readUserSession } from '@/lib/user-auth'

import { prisma } from './client'

/**
 * The one answer to "may this request use the admin portal?".
 *
 * ── Why it is one function and not eight ──────────────────────────────
 *
 * Seven action modules each carried their own copy of this check and the admin
 * layout carried an eighth, all of them reading the shared-password cookie
 * directly. That was survivable while there was one way in. It stopped being
 * survivable the moment accounts could be admins too: a copy that is not
 * updated is a copy that authorises the wrong people, and finding all seven is
 * exactly the kind of thing that gets missed.
 *
 * ── The order matters ─────────────────────────────────────────────────
 *
 * An account session is authoritative when present, and isAdmin is re-read from
 * the database on every call — so revoking the column locks an operator out on
 * their next request rather than whenever a cookie happens to expire.
 *
 * The shared-password cookie is the fallback and is only consulted when there
 * is no account session at all, so holding a stale operator cookie can never
 * escalate an account the database says is an ordinary driver.
 *
 * ── Why the fallback still exists after /admin/login was removed ──────
 *
 * Nothing issues that cookie to a stranger any more: the page that traded the
 * shared password for it is gone, and sign-in only mints it for an account
 * whose row already carries isAdmin. What it does is let a session that was
 * already open keep working rather than throwing "Not authorised" mid-edit on
 * deploy. It authorises nobody the account check would have refused.
 */
export async function isRequestAdmin(): Promise<boolean> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })
    return user?.isAdmin === true
  }

  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

/** True when somebody is signed in as an account, admin or not. */
export async function hasAccountSession(): Promise<boolean> {
  return readUserSession(cookies().get(USER_COOKIE_NAME)?.value) !== null
}

/**
 * Throws unless the caller may write.
 *
 * Every server action calls this itself rather than trusting the layout. A
 * server action is a POST endpoint reachable by anything that learns its id —
 * the layout guards *rendering*, not *invocation*, and skipping this would
 * leave the database writable by an unauthenticated request.
 */
export async function assertAdmin(): Promise<void> {
  if (!(await isRequestAdmin())) {
    throw new Error('Not authorised')
  }
}
