// src/lib/db/member-actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

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

async function assertAdmin(): Promise<void> {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error('Not authorised')
  }
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
