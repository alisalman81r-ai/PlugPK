// src/lib/db/member-actions.ts
'use server'

import { randomBytes, randomInt } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { assertAdmin, type AdminActor } from './admin-access'
import { logAdminAction } from './audit'

import { hashPassword } from '@/lib/passwords'
import { prisma } from './client'

/**
 * Administration of registered accounts.
 *
 * Reading and changing members is admin-only, and each action re-checks the
 * session rather than trusting that the page rendered behind the login: a
 * Server Action is a POST endpoint, reachable by anything that learns its URL.
 *
 * Every action here answers with `{ ok, message }` and never throws, so the
 * control that called it can always say what happened.
 */

export interface MemberResult {
  ok: boolean
  message?: string
}

const DENIED: MemberResult = {
  ok: false,
  message: 'Your admin session has expired. Sign in again and retry.',
}

async function actor(): Promise<AdminActor | null> {
  try {
    return await assertAdmin()
  } catch {
    return null
  }
}

function unexpected(where: string, error: unknown): MemberResult {
  console.error(`[admin] ${where} failed`, error)
  return { ok: false, message: 'Something went wrong. Nothing was changed; try again.' }
}

/** Placeholder written over a member who asked to be forgotten. */
const DELETED_NAME = 'Deleted member'

/**
 * Removes an account and the personal data attached to it.
 *
 * Deleting a person is not one delete, and the parts differ on purpose:
 *
 * - Their reviews go. A review carries the writer's name, so leaving it
 *   published would mean deleting the profile while the person stays visible
 *   on the site — the opposite of what deleting a profile is for.
 * - Their community posts and comments go, for the same reason. Neither has a
 *   relation to User, so nothing would cascade and they would sit under a
 *   name that no longer belongs to an account.
 * - Their saved listings go. Private to them and meaningless without them.
 * - Their business listings stay, unlinked. A listing is a place on the map
 *   that drivers rely on, not personal data, and the schema already allows an
 *   ownerless one for businesses an operator entered by hand.
 *
 * Refused outright in three cases. Your own account (you would be signed out
 * mid-action with nobody to blame), another admin (revoke their role first, so
 * removing an operator is two deliberate steps), and anyone with a Membership
 * row: memberships cascade with the user, and they are the payment record —
 * deleting the account would delete the evidence of what was paid. Anonymise
 * keeps the record and removes the person.
 *
 * Everything runs in one transaction so a failure halfway cannot leave an
 * account deleted with its reviews still standing, or the reverse.
 */
export async function deleteMember(id: string): Promise<MemberResult> {
  const admin = await actor()
  if (!admin) return DENIED
  if (id === admin.id) {
    return { ok: false, message: 'You cannot delete your own account from here. Ask another admin.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        _count: { select: { businesses: true, memberships: true } },
      },
    })
    if (!user) return { ok: false, message: 'That account no longer exists.' }
    if (user.isAdmin) {
      return { ok: false, message: `${user.name} is an admin. Remove their admin role first, then delete the account.` }
    }
    if (user._count.memberships > 0) {
      return {
        ok: false,
        message: `${user.name} has ${user._count.memberships} membership record${user._count.memberships === 1 ? '' : 's'}, which would be deleted with the account. Anonymise them instead — that keeps the payment record and removes the person.`,
      }
    }

    const posts = await prisma.communityPost.findMany({ where: { userId: id }, select: { id: true } })
    const postIds = posts.map((post) => post.id)

    await prisma.$transaction([
      // No relation on Review.userId, so this is a deleteMany rather than a
      // cascade. SavedStation does cascade, and is left to the row delete.
      prisma.review.deleteMany({ where: { userId: id } }),
      // Their comments on other people's posts, with those posts' counts kept
      // honest. Comments on their own posts go with the posts below.
      ...(await commentCountCorrections(id, postIds)),
      prisma.comment.deleteMany({ where: { userId: id } }),
      prisma.communityPost.deleteMany({ where: { id: { in: postIds } } }),
      prisma.business.updateMany({ where: { userId: id }, data: { userId: null } }),
      prisma.user.delete({ where: { id } }),
    ])

    await logAdminAction(admin, 'member.delete', 'member', id, `${user.name} <${user.email}>`)

    revalidatePath('/admin/members')
    revalidatePath('/admin')
    revalidatePath('/admin/businesses')
    revalidatePath('/admin/community')
    // Ratings on any listing they reviewed have just changed, and the homepage
    // counts registered owners.
    revalidatePath('/')
    revalidatePath('/map')
    revalidatePath('/community')

    return {
      ok: true,
      message:
        user._count.businesses > 0
          ? `Account deleted. ${user._count.businesses} business listing${user._count.businesses === 1 ? '' : 's'} kept, now without an owner.`
          : 'Account deleted.',
    }
  } catch (error) {
    return unexpected('deleteMember', error)
  }
}

/**
 * One decrement per post the member commented on, excluding their own posts
 * (which are about to be deleted whole).
 */
async function commentCountCorrections(userId: string, ownPostIds: string[]) {
  const grouped = await prisma.comment.groupBy({
    by: ['postId'],
    where: { userId, postId: { notIn: ownPostIds } },
    _count: { _all: true },
  })
  return grouped.map((row) =>
    prisma.communityPost.update({
      where: { id: row.postId },
      data: { commentCount: { decrement: row._count._all } },
    }),
  )
}

/**
 * Removes the person and keeps the records.
 *
 * For an account that cannot simply be deleted — it holds memberships — or
 * when the posts are worth keeping for the conversation they started. The
 * account row stays so its foreign keys stay valid; everything that names or
 * identifies the person is overwritten:
 *
 * - name becomes "Deleted member", email a unique address on the reserved
 *   .invalid domain (so the unique index holds and nothing can be sent there);
 * - the password hash is replaced by one of 48 random bytes nobody has, so the
 *   account can never be signed into again;
 * - avatar, city and vehicle are cleared, and every open session ends;
 * - the copies of their name and picture on posts, comments and reviews are
 *   rewritten too, since those were denormalised onto each row.
 */
export async function anonymiseMember(id: string): Promise<MemberResult> {
  const admin = await actor()
  if (!admin) return DENIED
  if (id === admin.id) {
    return { ok: false, message: 'You cannot anonymise your own account from here.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, isAdmin: true },
    })
    if (!user) return { ok: false, message: 'That account no longer exists.' }
    if (user.isAdmin) {
      return { ok: false, message: `${user.name} is an admin. Remove their admin role first.` }
    }

    const unusable = await hashPassword(randomBytes(48).toString('base64url'))

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          name: DELETED_NAME,
          email: `deleted-${id}@deleted.invalid`,
          passwordHash: unusable,
          avatar: null,
          city: null,
          vehicle: null,
          isAdmin: false,
          mustChangePassword: false,
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.communityPost.updateMany({
        where: { userId: id },
        data: { userName: DELETED_NAME, userAvatar: null, userVehicle: null },
      }),
      prisma.comment.updateMany({
        where: { userId: id },
        data: { userName: DELETED_NAME, userAvatar: null },
      }),
      prisma.review.updateMany({
        where: { userId: id },
        data: { userName: DELETED_NAME, userAvatar: null },
      }),
    ])

    // The previous email is in the log on purpose: it is the only way to
    // answer "what happened to the account for x@y" afterwards.
    await logAdminAction(admin, 'member.anonymise', 'member', id, `was ${user.name} <${user.email}>`)

    revalidatePath('/admin/members')
    revalidatePath(`/admin/members/${id}`)
    revalidatePath('/community')
    revalidatePath('/map')

    return { ok: true, message: 'Account anonymised. Their posts and reviews now read “Deleted member”.' }
  } catch (error) {
    return unexpected('anonymiseMember', error)
  }
}

/**
 * Gives a member a new, one-time password, shown to the admin once.
 *
 * The site has no email service, so "forgot password" cannot send a link. A
 * member who is locked out writes to support from the address on the account;
 * an admin sets a temporary password here and passes it on, and the member is
 * made to change it on their next sign-in. Only the hash is stored — the plain
 * password exists in this response and nowhere else.
 *
 * The reset also ends every session the account has open. A locked-out member
 * is often a member whose account somebody else is in; leaving that session
 * running would hand the new password to the person who caused the problem.
 *
 * Not for admins, including yourself. Resetting another operator's password
 * from the portal would let one admin take over another's account; an admin
 * changes their own under Settings, and a locked-out one is recovered with the
 * CLI by whoever runs the server.
 */
export async function setTemporaryPassword(id: string): Promise<MemberResult & { password?: string }> {
  const admin = await actor()
  if (!admin) return DENIED
  if (id === admin.id) {
    return { ok: false, message: 'To change your own password, use Settings → Password.' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, isAdmin: true } })
    if (!user) return { ok: false, message: 'That account no longer exists.' }
    if (user.isAdmin) {
      return {
        ok: false,
        message: `${user.name} is an admin. Ask them to change it under Settings → Password, or reset it with the server CLI.`,
      }
    }

    // 12 characters from an alphabet without look-alikes (0/O, 1/l/I), always
    // with an upper case letter, a lower case letter and a digit.
    const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ', LOWER = 'abcdefghijkmnpqrstuvwxyz', DIGIT = '23456789'
    const ALL = UPPER + LOWER + DIGIT
    const pick = (set: string) => set[randomInt(set.length)]
    const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), ...Array.from({ length: 9 }, () => pick(ALL))]
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    const password = chars.join('')

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        sessionVersion: { increment: 1 },
      },
    })

    await logAdminAction(admin, 'member.password-reset', 'member', id, `${user.name} <${user.email}> · sessions ended`)
    revalidatePath(`/admin/members/${id}`)
    return { ok: true, password }
  } catch (error) {
    return unexpected('setTemporaryPassword', error)
  }
}

/**
 * Grants or revokes access to this portal.
 *
 * Before this, admin could only be granted from the command line and the flag
 * was not shown anywhere in the portal, so nobody could see who held it.
 *
 * Two safeguards. You cannot change your own role — granting it is
 * meaningless and revoking it is a lockout with nobody left to notice — and
 * the last admin cannot be removed, or nobody could ever grant it again
 * without shell access. Revoking also ends the target's sessions, so the
 * change takes effect on their very next request rather than whenever their
 * cookie expires; admin-access re-reads the flag regardless, this just makes
 * it certain.
 */
export async function setMemberAdmin(id: string, isAdmin: boolean): Promise<MemberResult> {
  const admin = await actor()
  if (!admin) return DENIED
  if (id === admin.id) {
    return { ok: false, message: 'You cannot change your own role. Ask another admin.' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, isAdmin: true } })
    if (!user) return { ok: false, message: 'That account no longer exists.' }
    if (user.isAdmin === isAdmin) {
      return { ok: true, message: isAdmin ? `${user.name} is already an admin.` : `${user.name} is not an admin.` }
    }
    if (user.email.endsWith('@deleted.invalid')) {
      return { ok: false, message: 'An anonymised account cannot be made an admin.' }
    }

    if (!isAdmin) {
      const admins = await prisma.user.count({ where: { isAdmin: true } })
      if (admins <= 1) return { ok: false, message: 'This is the last admin account, so the role cannot be removed.' }
    }

    await prisma.user.update({
      where: { id },
      data: isAdmin ? { isAdmin: true } : { isAdmin: false, sessionVersion: { increment: 1 } },
    })

    await logAdminAction(
      admin,
      isAdmin ? 'member.grant-admin' : 'member.revoke-admin',
      'member',
      id,
      `${user.name} <${user.email}>`,
    )
    revalidatePath('/admin/members')
    revalidatePath(`/admin/members/${id}`)
    return {
      ok: true,
      message: isAdmin ? `${user.name} is now an admin.` : `${user.name} is no longer an admin and has been signed out.`,
    }
  } catch (error) {
    return unexpected('setMemberAdmin', error)
  }
}
