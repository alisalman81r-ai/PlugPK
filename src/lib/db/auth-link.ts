// src/lib/db/auth-link.ts
import 'server-only'

import { randomUUID } from 'node:crypto'

import type { User as AuthUser } from '@supabase/supabase-js'

import { prisma } from './client'

/**
 * Finds — or, failing that, makes — the website account for a Supabase user.
 *
 * Called only with a user Supabase has just vouched for (a correct password,
 * or a redeemed email link). Matched by authUserId first, then by email, so an
 * account that predates Supabase is linked rather than duplicated. A Supabase
 * user with no website row at all (made from another environment sharing the
 * same Supabase project) gets one, named from the sign-up metadata.
 *
 * `confirmed` marks the address verified. Passing it is the caller's claim
 * that Supabase has confirmed the email — never set it from anything else.
 */
export async function linkAuthUser(
  authUser: AuthUser,
  { confirmed }: { confirmed: boolean },
): Promise<{ id: string; pendingRedirect: string | null } | null> {
  const email = authUser.email?.trim().toLowerCase()
  if (!email) return null
  const verified = confirmed ? { emailVerifiedAt: new Date() } : {}

  const byAuth = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: { id: true, emailVerifiedAt: true, pendingRedirect: true },
  })
  if (byAuth) {
    if (confirmed && !byAuth.emailVerifiedAt) {
      await prisma.user.update({ where: { id: byAuth.id }, data: verified })
    }
    return { id: byAuth.id, pendingRedirect: byAuth.pendingRedirect }
  }

  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, authUserId: true, emailVerifiedAt: true, pendingRedirect: true },
  })
  if (byEmail) {
    // Linked to a different Supabase user: refuse rather than merge two people.
    if (byEmail.authUserId && byEmail.authUserId !== authUser.id) return null
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        authUserId: authUser.id,
        // Supabase holds the password now; the old hash must not stay usable.
        passwordHash: null,
        ...(confirmed && !byEmail.emailVerifiedAt ? verified : {}),
      },
    })
    return { id: byEmail.id, pendingRedirect: byEmail.pendingRedirect }
  }

  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>
  const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim().slice(0, 80) : email.split('@')[0]!
  const created = await prisma.user.create({
    data: { id: randomUUID(), email, name, authUserId: authUser.id, passwordHash: null, ...verified },
    select: { id: true },
  })
  return { id: created.id, pendingRedirect: null }
}
