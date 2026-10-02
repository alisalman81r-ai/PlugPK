// src/lib/db/member-actions.ts
'use server'

import { randomInt } from 'node:crypto'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { assertAdmin as requireAdminAccess, isRequestAdmin } from './admin-access'

import { hashPassword } from './auth-actions'
import { prisma } from './client'

/**
 * Administration of registered accounts.
 *
 * Reading and deleting members is admin-only, and each action re-checks the
 * session rather than trusting that the page rendered behind the login: a
 * Server Action is a POST endpoint, reachable by anything that learns its URL.
 */

export interface MemberResult {
  ok: boolean
  message?: string
}

// Delegates to the single check in admin-access.ts. This module used to
// read the shared-password cookie itself, which is how seven copies of the
// same rule came to exist.
async function assertAdmin(): Promise<void> {
  await requireAdminAccess()
}

/**
 * Removes an account and the personal data attached to it.
 *
 * Deleting a person is not one delete, and the parts differ on purpose:
 *
 * - Their reviews go. A review carries the writer's name, so leaving it
 *   published would mean deleting the profile while the person stays visible
 *   on the site — the opposite of what deleting a profile is for.
 * - Their saved listings go. Private to them and meaningless without them.
 * - Their business listings stay, unlinked. A listing is a place on the map
 *   that drivers rely on, not personal data, and the schema already allows an
 *   ownerless one for businesses an operator entered by hand. It is left for
 *   an admin to keep or remove deliberately, on the businesses page.
 *
 * Everything runs in one transaction so a failure halfway cannot leave an
 * account deleted with its reviews still standing, or the reverse.
 */
export async function deleteMember(id: string): Promise<MemberResult> {
  await assertAdmin()

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, _count: { select: { businesses: true } } },
  })
  if (!user) return { ok: false, message: 'That account no longer exists.' }

  await prisma.$transaction([
    // No relation on Review.userId, so this is a deleteMany rather than a
    // cascade. SavedStation does cascade, and is left to the row delete.
    prisma.review.deleteMany({ where: { userId: id } }),
    prisma.business.updateMany({ where: { userId: id }, data: { userId: null } }),
    prisma.user.delete({ where: { id } }),
  ])

  revalidatePath('/admin/members')
  revalidatePath('/admin')
  revalidatePath('/admin/businesses')
  // Ratings on any listing they reviewed have just changed, and the homepage
  // counts registered owners.
  revalidatePath('/')
  revalidatePath('/map')

  return {
    ok: true,
    message:
      user._count.businesses > 0
        ? `Account deleted. ${user._count.businesses} business listing${user._count.businesses === 1 ? '' : 's'} kept, now without an owner.`
        : undefined,
  }
}

/**
 * Gives a member a new, one-time password, shown to the admin once.
 *
 * The site has no email service, so "forgot password" cannot send a link. A
 * member who is locked out writes to support from the address on the account;
 * an admin sets a temporary password here and passes it on, and the member
 * changes it under Settings → Password. Only the hash is stored — the plain
 * password exists in this response and nowhere else.
 */
export async function setTemporaryPassword(id: string): Promise<MemberResult & { password?: string }> {
  await assertAdmin()

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) return { ok: false, message: 'That account no longer exists.' }

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

  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } })
  return { ok: true, password }
}
