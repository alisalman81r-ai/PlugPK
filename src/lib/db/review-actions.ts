// src/lib/db/review-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { prisma } from './client'
import { getCurrentUser } from './session-actions'

/**
 * Writing a review.
 *
 * The form behind this used to await a 1.5 second timer and then announce
 * "Review submitted!" — nothing was written, and the review vanished on
 * refresh. The same shape of bug as the business sign-up and the login screen.
 *
 * One action covers both kinds of listing. Stations are entered by an operator
 * and businesses apply through the public form, but a driver reviewing one is
 * doing the same thing either way, and a second near-identical action is how
 * the two slowly grow different rules.
 */

export type ReviewTarget = 'station' | 'business'

export interface ReviewResult {
  ok: boolean
  message?: string
  /** Set when the reason for failing was simply not being signed in. */
  needsSignIn?: boolean
}

const MAX_COMMENT = 2000

export async function submitReview(
  target: ReviewTarget,
  targetId: string,
  rating: number,
  comment: string,
  vehicle: string,
): Promise<ReviewResult> {
  const user = await getCurrentUser()
  // Required so a listing cannot be brigaded by an anonymous script, and so
  // "you have already reviewed this" means something.
  if (!user) {
    return { ok: false, needsSignIn: true, message: 'Sign in to leave a review.' }
  }

  const score = Math.round(Number(rating))
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return { ok: false, message: 'Give a rating between 1 and 5 stars.' }
  }

  const text = comment.trim()
  if (text.length < 4) return { ok: false, message: 'Write a few words about your visit.' }
  if (text.length > MAX_COMMENT) {
    return { ok: false, message: `Reviews are limited to ${MAX_COMMENT} characters.` }
  }

  if (target === 'business') {
    const business = await prisma.business.findUnique({
      where: { id: targetId },
      select: { status: true, userId: true },
    })
    if (!business || business.status !== 'approved') {
      return { ok: false, message: 'That listing is not open for reviews.' }
    }
    // Otherwise an owner could manufacture their own rating.
    if (business.userId === user.id) {
      return { ok: false, message: 'You cannot review your own listing.' }
    }
  } else {
    const station = await prisma.station.findUnique({
      where: { id: targetId },
      select: { id: true },
    })
    if (!station) return { ok: false, message: 'That station no longer exists.' }
  }

  const where =
    target === 'business'
      ? { businessId: targetId, userId: user.id }
      : { stationId: targetId, userId: user.id }

  const already = await prisma.review.findFirst({ where })
  if (already) return { ok: false, message: 'You have already reviewed this listing.' }

  await prisma.review.create({
    data: {
      id: randomUUID(),
      stationId: target === 'station' ? targetId : null,
      businessId: target === 'business' ? targetId : null,
      userId: user.id,
      userName: user.name,
      userVehicle: vehicle.trim(),
      rating: score,
      comment: text,
    },
  })

  // The listing page shows the review; the owner's page shows it arriving; the
  // map carries the rating that just moved.
  revalidatePath(`/station/${targetId}`)
  revalidatePath('/business/reviews')
  revalidatePath('/map')

  return { ok: true }
}

/**
 * Removes one of your own reviews.
 *
 * Scoped by userId in the same query as the id, so passing somebody else's
 * review id deletes nothing rather than deleting theirs.
 */
export async function deleteMyReview(reviewId: string): Promise<ReviewResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, needsSignIn: true, message: 'Sign in to manage your reviews.' }

  const result = await prisma.review.deleteMany({ where: { id: reviewId, userId: user.id } })
  if (result.count === 0) return { ok: false, message: 'That review is not yours to delete.' }

  revalidatePath('/dashboard/reviews')
  revalidatePath('/business/reviews')
  revalidatePath('/map')
  return { ok: true }
}
