// src/lib/db/upload-actions.ts
'use server'

import { revalidatePath } from 'next/cache'

import { isUploadUrl } from '@/lib/upload-urls'

import { isRequestAdmin } from './admin-access'
import { prisma } from './client'
import { checkLimits, retryMessage } from './rate-limit'
import { getSessionUserId } from './session'
import { discard, store, type UploadResult } from './upload-store'

/**
 * The upload endpoints a browser may call.
 *
 * Storage itself — validation, naming, Blob vs disk, deletion — is in
 * upload-store.ts, which is server-only. Every export here is a public POST
 * endpoint, so each one checks who is calling before it touches storage, and
 * no export deletes a file it has not first proven the caller controls.
 */

export type { UploadResult }

/** Uploads per account per hour — generous for a real listing, a wall for a script. */
const UPLOADS_PER_HOUR = 60

async function uploadAllowed(userId: string): Promise<UploadResult | null> {
  const limit = await checkLimits([
    { key: `upload:user:${userId}`, limit: UPLOADS_PER_HOUR, windowSeconds: 60 * 60 },
  ])
  return limit.allowed ? null : { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many uploads') }
}

/** The signed-in account's id when it owns this listing, else null. */
async function listingOwner(businessId: string): Promise<string | null> {
  const userId = await getSessionUserId()
  if (!userId || typeof businessId !== 'string') return null

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { userId: true },
  })
  return business?.userId === userId ? userId : null
}

/**
 * Every charger photo URL any listing currently points at. A photo that is
 * referenced must never be deleted from here — removing one from a listing is
 * done by saving the listing, and saveMyChargers cleans up what it replaced.
 */
async function isReferencedByAnyListing(url: string): Promise<boolean> {
  const hit = await prisma.business.findFirst({
    where: { chargers: { contains: url } },
    select: { id: true },
  })
  return hit !== null
}

export async function uploadChargerPhoto(
  businessId: string,
  form: FormData,
): Promise<UploadResult> {
  const userId = await listingOwner(businessId)
  if (!userId) return { ok: false, message: 'That listing is not yours to edit.' }
  const limited = await uploadAllowed(userId)
  if (limited) return limited
  return store('chargers', form)
}

/**
 * Throws away a charger photo that was uploaded but never saved onto a listing,
 * e.g. when the owner picks a different file before pressing Save.
 *
 * Only unreferenced files in the chargers bucket qualify. Anything a listing
 * points at — this owner's or anyone else's — is refused, which is what stops
 * this endpoint deleting another listing's photos.
 */
export async function deleteChargerPhoto(
  businessId: string,
  url: string,
): Promise<UploadResult> {
  if (!(await listingOwner(businessId))) {
    return { ok: false, message: 'That listing is not yours to edit.' }
  }
  if (!isUploadUrl('chargers', url)) return { ok: true }
  if (await isReferencedByAnyListing(url)) return { ok: true }
  await discard('chargers', url)
  return { ok: true }
}

// ─── Profile pictures ───────────────────────────────────

/**
 * Sets the signed-in account's profile picture. Scoped to the session rather
 * than taking a user id, so it cannot change somebody else's picture.
 */
export async function uploadMyAvatar(form: FormData): Promise<UploadResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to set a profile picture.' }
  const limited = await uploadAllowed(userId)
  if (limited) return limited

  const result = await store('avatars', form)
  if (!result.ok || !result.url) return result

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  })

  await prisma.user.update({ where: { id: userId }, data: { avatar: result.url } })

  // The one it replaced would otherwise sit in storage forever.
  if (existing?.avatar) await discard('avatars', existing.avatar)

  // Only the dashboard renders the avatar server-side; the header reads /api/me.
  revalidatePath('/dashboard', 'layout')
  return result
}

export async function removeMyAvatar(): Promise<UploadResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to change your profile picture.' }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  })

  await prisma.user.update({ where: { id: userId }, data: { avatar: null } })
  if (existing?.avatar) await discard('avatars', existing.avatar)

  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

// ─── Car photographs (admin) ────────────────────────────

/**
 * Stores a car photograph uploaded from the admin portal. Writing the URL onto
 * the car is setCarImage's job in car-actions.ts; the old file is deleted
 * there, server-side, once the row no longer points at it.
 *
 * discardCarPhoto used to be exported from here with no check at all, which
 * let anyone delete any file in the Blob store. Deletion of car photos now
 * happens only inside car-actions.ts, behind assertAdmin.
 */
export async function uploadCarPhoto(form: FormData): Promise<UploadResult> {
  if (!(await isRequestAdmin())) {
    return { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
  }

  return store('cars', form)
}
