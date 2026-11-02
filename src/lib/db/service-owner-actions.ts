// src/lib/db/service-owner-actions.ts
'use server'

import { revalidatePath } from 'next/cache'

import { distanceKm, MOVE_REVIEW_KM } from './business-listing'
import { prisma } from './client'
import { getSessionUserId } from './session'
import { readServiceDetails } from './service-details'
import { readServiceCore } from './service-form'
import { recordSiteEvent } from './site-events'

/**
 * The owner's edits to their own service listing, from the service side of
 * the business portal.
 *
 * Same rules as the application (readServiceCore and readServiceDetails), and
 * the same review rules as a charger listing: a live listing that changes its
 * category or moves its pin more than a kilometre goes back for review — the
 * team approved what it is and where it is — and the owner is asked first.
 * Editing a listing that was not approved is how the owner answers the reason
 * they were given, so it returns to the queue.
 */

export interface ServiceSaveResult {
  ok: boolean
  message?: string
  field?: string
  /** Nothing saved: this change needs the owner's say-so first. Send again with confirmReview. */
  needsConfirmation?: boolean
  /** The save sent the listing back to the review queue. */
  backToReview?: boolean
}

export async function updateMyService(form: FormData): Promise<ServiceSaveResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in again to edit your listing.' }

  const id = String(form.get('id') ?? '')
  const service = await prisma.eVService.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, category: true, lat: true, lng: true, slug: true, name: true },
  })
  // A stranger's id and a missing one read the same.
  if (!service || service.userId !== userId) return { ok: false, message: 'That listing is not yours to edit.' }

  const core = readServiceCore(form)
  if (!core.ok) return core
  const details = readServiceDetails(form, { contactRequired: true })
  if (!details.ok) return details

  let backToReview = service.status === 'rejected'
  if (service.status === 'approved') {
    const moved = distanceKm({ lat: service.lat, lng: service.lng }, { lat: core.value.lat, lng: core.value.lng })
    const bigChange = core.value.category !== service.category || moved > MOVE_REVIEW_KM
    if (bigChange) {
      if (form.get('confirmReview') !== '1') {
        return {
          ok: false,
          needsConfirmation: true,
          message:
            'Changing your category or moving your pin this far sends your listing back for review, and it will be off the directory until it is approved again.',
        }
      }
      backToReview = true
    }
  }

  await prisma.eVService.update({
    where: { id: service.id },
    data: {
      ...core.value,
      ...details.value,
      ...(backToReview ? { status: 'pending', reviewNote: null, submittedAt: new Date() } : {}),
    },
  })

  await recordSiteEvent({
    userId,
    type: 'service.update',
    targetType: 'service',
    targetId: service.id,
    summary: (who) => `${who} updated ${core.value.name}${backToReview ? ' (back to review)' : ''}`,
  })

  revalidatePath('/business/services')
  revalidatePath('/business/services/profile')
  revalidatePath('/services')
  revalidatePath(`/services/${service.category}`)
  revalidatePath(`/services/${core.value.category}/${service.slug}`)
  revalidatePath('/admin/services')
  revalidatePath('/admin')
  return { ok: true, backToReview }
}
