// src/lib/db/business-listing.ts
import { CONNECTOR_TYPES } from '@/lib/constants'
import { isUploadUrl } from '@/lib/upload-urls'
import { isInPakistan } from '@/lib/validate'

/**
 * The rules for a business listing's charger column, in one place.
 *
 * Kept out of business-actions.ts on purpose. That file is 'use server', so
 * every value it exports becomes a POST endpoint and only async functions are
 * allowed there; these are plain synchronous checks that the owner actions,
 * the admin actions and any screen that wants to explain "why can't I approve
 * this?" all need to agree on. Two copies of an approval rule is how the admin
 * form came to approve listings the status button refused.
 */

export type PhotoStatus = 'pending' | 'approved' | 'needs-better-photo'
export type PhotoLabel = 'charger' | 'port' | 'location' | 'signage'

export interface ListingCharger {
  connectorType: string
  maxPowerKw: number
  ports: number
  photo?: string
  photoLabel?: PhotoLabel
  photoStatus?: PhotoStatus
  portPhoto?: string
  portPhotoStatus?: PhotoStatus
}

export const MAX_CHARGERS = 20
const MAX_POWER_KW = 1000
const MAX_PORTS = 50

const PHOTO_STATUSES: PhotoStatus[] = ['pending', 'approved', 'needs-better-photo']
const PHOTO_LABELS: PhotoLabel[] = ['charger', 'port', 'location', 'signage']

/**
 * Reads the stored JSON column. A malformed one reads as no chargers rather
 * than throwing, so one bad row cannot take a whole page down.
 */
export function parseChargers(raw: string | null | undefined): ListingCharger[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? (parsed as ListingCharger[]) : []
  } catch {
    return []
  }
}

/** Every photo URL a charger list points at, primary and port alike. */
export function photoUrls(chargers: ListingCharger[]): string[] {
  return chargers.flatMap((charger) =>
    [charger.photo, charger.portPhoto].filter((url): url is string => typeof url === 'string' && url.length > 0),
  )
}

/**
 * Turns a charger list from a browser into the one that is stored.
 *
 * Photo review status is never taken from the request. An owner used to be
 * able to send `photoStatus: 'approved'` with a brand-new picture and publish
 * it without anyone looking at it. Now a URL that was already on the listing
 * keeps the status it had, and any URL the listing has not held before is
 * `pending` — only an operator's review moves it from there.
 *
 * `trustStatus` is for the admin form alone, where the person sending the list
 * is the reviewer.
 *
 * URLs are checked against this application's own upload locations (local
 * disk or the Blob store), so a listing cannot be made to point at an
 * arbitrary address. Checking only the local prefix is what dropped every
 * photo in production, where uploads are Blob URLs.
 */
export function cleanChargers(
  input: unknown,
  stored: ListingCharger[],
  { trustStatus = false }: { trustStatus?: boolean } = {},
): { ok: true; chargers: ListingCharger[] } | { ok: false; message: string } {
  if (!Array.isArray(input)) return { ok: false, message: 'Could not read the charger list.' }
  if (input.length > MAX_CHARGERS) {
    return { ok: false, message: `A listing can hold at most ${MAX_CHARGERS} chargers.` }
  }

  const known = new Map<string, PhotoStatus | undefined>()
  for (const charger of stored) {
    if (charger.photo) known.set(charger.photo, charger.photoStatus)
    if (charger.portPhoto) known.set(charger.portPhoto, charger.portPhotoStatus)
  }

  const statusFor = (url: string, claimed: unknown): PhotoStatus => {
    if (trustStatus && PHOTO_STATUSES.includes(claimed as PhotoStatus)) return claimed as PhotoStatus
    if (known.has(url)) return known.get(url) ?? 'pending'
    return 'pending'
  }

  const chargers: ListingCharger[] = []
  for (const item of input as unknown[]) {
    if (!item || typeof item !== 'object') continue
    const charger = item as Record<string, unknown>
    const connectorType = typeof charger.connectorType === 'string' ? charger.connectorType : ''
    if (!CONNECTOR_TYPES.includes(connectorType as (typeof CONNECTOR_TYPES)[number])) {
      return { ok: false, message: 'Choose a connector type for every charger.' }
    }

    const next: ListingCharger = {
      connectorType,
      maxPowerKw: Math.min(MAX_POWER_KW, Math.max(0, Number(charger.maxPowerKw) || 0)),
      ports: Math.min(MAX_PORTS, Math.max(1, Math.round(Number(charger.ports) || 1))),
    }

    if (isUploadUrl('chargers', charger.photo)) {
      next.photo = charger.photo
      next.photoLabel = PHOTO_LABELS.includes(charger.photoLabel as PhotoLabel)
        ? (charger.photoLabel as PhotoLabel)
        : 'charger'
      next.photoStatus = statusFor(charger.photo, charger.photoStatus)
    }
    if (isUploadUrl('chargers', charger.portPhoto)) {
      next.portPhoto = charger.portPhoto
      next.portPhotoStatus = statusFor(charger.portPhoto, charger.portPhotoStatus)
    }

    chargers.push(next)
  }

  return { ok: true, chargers }
}

/**
 * What a listing must have before it can go live. Used by the status button
 * and by the admin edit form, so neither can approve what the other refuses.
 *
 * A pin inside Pakistan, because approval is what puts the listing on the map
 * and a missing or swapped pair of coordinates puts it nowhere useful; and a
 * primary photo for every charger, because the photo is the only evidence a
 * reviewer has that the charger exists.
 */
export function validateForApproval(business: {
  lat: number | null
  lng: number | null
  chargers: ListingCharger[]
}): string | null {
  if (business.lat === null || business.lng === null) {
    return 'An approved listing needs a map pin. Add coordinates first.'
  }
  if (!isInPakistan(business.lat, business.lng)) {
    return 'The map pin is outside Pakistan. Check the coordinates (latitude and longitude may be swapped).'
  }
  if (business.chargers.length === 0) return 'The listing has no chargers to approve.'
  if (business.chargers.some((charger) => !charger.photo)) {
    return 'Every charger needs a primary charger photo before the listing can be approved.'
  }
  return null
}

/**
 * Marks the photos on this exact list approved. Called inside the approval
 * transaction with the list it just read, so a photo the owner adds a moment
 * later arrives as `pending` and is not swept into an approval nobody gave it.
 */
export function approvePhotos(chargers: ListingCharger[]): ListingCharger[] {
  return chargers.map((charger) => ({
    ...charger,
    ...(charger.photo ? { photoStatus: 'approved' as const } : {}),
    ...(charger.portPhoto ? { portPhotoStatus: 'approved' as const } : {}),
  }))
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * How far an approved listing's pin may move before it goes back for review.
 * A kilometre covers correcting a pin dropped on the wrong side of a building
 * or street; beyond that it is plausibly a different place, and drivers would
 * be sent somewhere nobody has checked.
 */
export const MOVE_REVIEW_KM = 1
