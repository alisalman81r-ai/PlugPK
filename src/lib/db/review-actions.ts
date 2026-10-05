// src/lib/db/review-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { checkText } from '@/lib/validate'

import { prisma } from './client'
import { checkLimits, keyPart, retryMessage } from './rate-limit'
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
  /** Set when this account already has a review on this listing. */
  alreadyReviewed?: boolean
}

/**
 * Limits, applied here because a server action is a public POST endpoint and
 * the form's own counters are only a convenience.
 *
 * The comment cap matches the counter on the form, so a review that fits the
 * form is never refused here. The vehicle is a short label ("BYD Atto 3"),
 * not a second comment box.
 */
const MAX_REVIEW_COMMENT = 1000
const MAX_REVIEW_VEHICLE = 120

/**
 * Ten reviews a day per account. A real driver reviewing every charger on a
 * long trip stays well inside it; a script filling the map with ratings does
 * not.
 */
const REVIEWS_PER_DAY = 10

const ALREADY_REVIEWED: ReviewResult = {
  ok: false,
  alreadyReviewed: true,
  message: 'You’ve already reviewed this listing. You can remove your review from your dashboard and write a new one.',
}

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

  if (target !== 'station' && target !== 'business') {
    return { ok: false, message: 'That listing is not open for reviews.' }
  }

  const score = Math.round(Number(rating))
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return { ok: false, message: 'Give a rating between 1 and 5 stars.' }
  }

  const text = checkText(comment, 'your review', { max: MAX_REVIEW_COMMENT, required: true, min: 4 })
  if (!text.ok) return { ok: false, message: text.message }

  const car = checkText(vehicle, 'your EV', { max: MAX_REVIEW_VEHICLE })
  if (!car.ok) return { ok: false, message: car.message }

  // Where the listing's page lives, for the revalidation below. A station's
  // URL is its slug, not its id — revalidating `/station/<id>` refreshed a
  // page that does not exist and left the real one stale.
  let pagePath: string

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
    pagePath = `/station/${targetId}`
  } else {
    const station = await prisma.station.findUnique({
      where: { id: targetId },
      select: { slug: true },
    })
    if (!station) return { ok: false, message: 'That station no longer exists.' }
    pagePath = `/station/${station.slug}`
  }

  const where =
    target === 'business'
      ? { businessId: targetId, userId: user.id }
      : { stationId: targetId, userId: user.id }

  // A friendly early answer. The unique index on (userId, stationId) and
  // (userId, businessId) is what actually enforces it — see the P2002 catch.
  const already = await prisma.review.findFirst({ where, select: { id: true } })
  if (already) return ALREADY_REVIEWED

  // Counted after the cheap checks, so a typo in the form does not use up the
  // day's allowance.
  const limit = await checkLimits([
    { key: `review:user:${keyPart(user.id)}`, limit: REVIEWS_PER_DAY, windowSeconds: 24 * 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'You have posted a lot of reviews today') }
  }

  // The writer's picture is copied onto the review rather than joined at read
  // time: reviews outlive accounts here, and a deleted account should not blank
  // out an avatar on a review that is still standing.
  const author = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatar: true },
  })

  try {
    await prisma.review.create({
      data: {
        id: randomUUID(),
        stationId: target === 'station' ? targetId : null,
        businessId: target === 'business' ? targetId : null,
        userId: user.id,
        userName: user.name,
        userAvatar: author?.avatar ?? null,
        userVehicle: car.value,
        rating: score,
        comment: text.value,
      },
    })
  } catch (error) {
    // Two submits racing past the findFirst above both reach here; the
    // database lets one through and refuses the other.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return ALREADY_REVIEWED
    }
    throw error
  }

  // The listing page shows the review; the owner's page shows it arriving; the
  // map carries the rating that just moved.
  revalidatePath(pagePath)
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

  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: user.id },
    select: { businessId: true, station: { select: { slug: true } } },
  })
  const result = await prisma.review.deleteMany({ where: { id: reviewId, userId: user.id } })
  if (result.count === 0) return { ok: false, message: 'That review is not yours to delete.' }

  revalidatePath('/dashboard/reviews')
  revalidatePath('/business/reviews')
  revalidatePath('/map')
  const slug = review?.station?.slug ?? review?.businessId
  if (slug) revalidatePath(`/station/${slug}`)
  return { ok: true }
}
