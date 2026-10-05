// src/lib/db/business-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { checkEmail, checkPhone, checkText, checkWebsite } from '@/lib/validate'

import { getAdminActor, type AdminActor } from './admin-access'
import { logAdminAction } from './audit'
import {
  approvePhotos,
  cleanChargers,
  distanceKm,
  MOVE_REVIEW_KM,
  parseChargers,
  photoUrls,
  validateForApproval,
  type ListingCharger,
} from './business-listing'
import { prisma } from './client'
import { checkLimits, clientFingerprint, firstInWindow, retryMessage } from './rate-limit'
import { getSessionUserId } from './session'
import { getCurrentUser } from './session-actions'
import { discard } from './upload-store'

/**
 * Applications from businesses wanting their chargers listed.
 *
 * The sign-up form used to await a 2.5 second timer and then announce
 * "You're Live on Plug.pk!" — it wrote nothing, sent nothing, and every
 * application disappeared on refresh. Applying needs an account (the identity
 * comes from the session, never from the form); reading and changing other
 * people's applications is the operator's job, and each privileged action
 * re-checks the admin session, since a Server Action is a POST endpoint
 * reachable by anything that learns its URL.
 */

export interface BusinessResult {
  ok: boolean
  message?: string
  businessId?: string
  /**
   * Set when the change needs the owner's say-so first — moving the pin of a
   * live listing far enough that it goes back for review. Nothing was saved;
   * sending the form again with `confirmMove` set goes ahead.
   */
  needsConfirmation?: boolean
  /** True when the save sent the listing back to the review queue. */
  backToReview?: boolean
}

export type DraftCharger = ListingCharger

export interface BusinessApplication {
  /**
   * No name, email or password.
   *
   * They used to be here, and the action created an account from them. When
   * the email already existed it was accepted without the password being
   * checked, and the submitter was then signed in as that account's owner —
   * so filling in this form with somebody else's registered address handed
   * over their account.
   *
   * The identity now comes from the session on the server, where it cannot be
   * chosen by whoever is posting.
   */
  phone?: string
  businessName: string
  businessType: string
  city: string
  address?: string
  website?: string
  lat?: number | null
  lng?: number | null
  chargers: DraftCharger[]
  /**
   * The listing an earlier attempt at this same sign-up already created.
   *
   * Sign-up is three steps — create the row, upload the photos, attach them —
   * and any of the later two can fail on a bad connection. Retrying used to
   * create a second listing each time. With this set, the retry updates the
   * draft it already made instead.
   */
  businessId?: string
}

/**
 * Coordinates are accepted only if they are real numbers in range.
 *
 * Latitude and longitude arriving swapped is the classic way a pin ends up in
 * the sea, and NaN reaches the database as null and silently drops the
 * listing off the map. Both are rejected here rather than stored.
 */
function readCoordinates(
  lat: unknown,
  lng: unknown,
): { ok: true; lat: number | null; lng: number | null } | { ok: false; message: string } {
  const blank = (value: unknown) => value === null || value === undefined || value === ''
  if (blank(lat) || blank(lng)) {
    return { ok: true, lat: null, lng: null }
  }

  const latitude = Number(lat)
  const longitude = Number(lng)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, message: 'Location must be a pair of numbers.' }
  }
  if (latitude < -90 || latitude > 90) {
    return { ok: false, message: 'Latitude must be between -90 and 90.' }
  }
  if (longitude < -180 || longitude > 180) {
    return { ok: false, message: 'Longitude must be between -180 and 180.' }
  }

  return { ok: true, lat: latitude, lng: longitude }
}

const BUSINESS_TYPES = [
  'hotel',
  'restaurant',
  'mall',
  'office',
  'dealership',
  'service-center',
  // A private home sharing its charger. Same record and same review step as
  // any venue — the only thing that differs is what it is called.
  'home',
]

/** Caps shared by the sign-up, owner and admin forms. */
const LIMITS = {
  name: 120,
  ownerName: 120,
  city: 80,
  address: 300,
  description: 600,
  reviewNote: 500,
} as const

/**
 * A sign-up draft younger than this, by the same account with the same name,
 * is treated as the same application. Covers a reload halfway through a failed
 * upload, where the browser has lost the id it was given.
 */
const DRAFT_RESUME_MINUTES = 30

type Fields = {
  businessName: string
  businessType: string
  city: string
  address: string | null
  phone: string | null
  website: string | null
}

/** The fields every listing form shares, validated once. */
function readListingFields(raw: {
  businessName?: unknown
  businessType?: unknown
  city?: unknown
  address?: unknown
  phone?: unknown
  website?: unknown
}): { ok: true; value: Fields } | { ok: false; message: string } {
  const businessName = checkText(raw.businessName, 'a name for the listing', { max: LIMITS.name, required: true })
  if (!businessName.ok) return businessName
  const businessType = typeof raw.businessType === 'string' ? raw.businessType.trim() : ''
  if (!BUSINESS_TYPES.includes(businessType)) return { ok: false, message: 'Choose a business type.' }
  const city = checkText(raw.city, 'a city', { max: LIMITS.city, required: true })
  if (!city.ok) return { ok: false, message: city.message.startsWith('Enter') ? 'Choose a city.' : city.message }
  const address = checkText(raw.address, 'the address', { max: LIMITS.address })
  if (!address.ok) return address
  const phone = checkPhone(raw.phone)
  if (!phone.ok) return phone
  const website = checkWebsite(raw.website)
  if (!website.ok) return website

  return {
    ok: true,
    value: {
      businessName: businessName.value,
      businessType,
      city: city.value,
      address: address.value || null,
      phone: phone.value,
      website: website.value,
    },
  }
}

/**
 * Refuses a photo URL that another listing already uses.
 *
 * Any upload URL passes the shape check, including one copied off somebody
 * else's public listing. Attaching it would be harmless to look at but not to
 * clean up: removing it from this listing later would delete the other
 * listing's file.
 */
async function usedElsewhere(businessId: string, urls: string[]): Promise<boolean> {
  for (const url of urls) {
    const hit = await prisma.business.findFirst({
      where: { id: { not: businessId }, chargers: { contains: url } },
      select: { id: true },
    })
    if (hit) return true
  }
  return false
}

/**
 * Deletes photos a listing no longer points at.
 *
 * Done here, after the save has committed, rather than by the browser when the
 * owner presses ✕ — that used to delete the stored file before anything was
 * saved, so cancelling the edit left the live listing pointing at nothing.
 * A file another listing still references is left alone.
 */
async function discardUnreferenced(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const hit = await prisma.business.findFirst({
        where: { chargers: { contains: url } },
        select: { id: true },
      })
      if (!hit) await discard('chargers', url)
    } catch (error) {
      // The save has already happened. A file left behind costs storage, not
      // correctness, so it is logged rather than reported to the owner.
      console.error('[business] could not discard a replaced photo', url, error)
    }
  }
}

function refreshPublicViews(): void {
  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  // The homepage counter and the map both read this table and are cached.
  revalidatePath('/')
  revalidatePath('/map')
}

export async function registerBusiness(
  application: BusinessApplication,
): Promise<BusinessResult> {
  // Listing requires an account. The page explains that before the form is
  // shown, but this is the check that actually enforces it — the page only
  // decides what to render, while this is the endpoint that writes.
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, message: 'Sign in to list a business.' }
  }

  // Re-validated here rather than trusted from the client. The form checks
  // these too, but that check is a convenience for the person typing; this one
  // is the one that actually protects the table.
  const fields = readListingFields(application)
  if (!fields.ok) return { ok: false, message: fields.message }

  const coordinates = readCoordinates(application.lat, application.lng)
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  const cleaned = cleanChargers(application.chargers ?? [], [])
  if (!cleaned.ok) return { ok: false, message: cleaned.message }

  /*
    Resuming an earlier attempt. Either the browser still holds the id it was
    given, or — after a reload — a pending listing by this account with the
    same name was started a few minutes ago. Both update that draft rather
    than creating a second listing for the reviewer to untangle.
  */
  const since = new Date(Date.now() - DRAFT_RESUME_MINUTES * 60 * 1000)
  const candidate = application.businessId
    ? await prisma.business.findFirst({
        where: { id: String(application.businessId), userId: user.id, status: 'pending' },
        select: { id: true, chargers: true },
      })
    : await prisma.business.findFirst({
        where: {
          userId: user.id,
          status: 'pending',
          createdAt: { gte: since },
          businessName: { equals: fields.value.businessName, mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, chargers: true },
      })

  // Matched by name, only an unfinished draft (no photos attached yet) is
  // resumed. A finished listing with the same name is left alone, so a second
  // submission can never overwrite the first one's photos.
  const draft =
    candidate && (application.businessId || photoUrls(parseChargers(candidate.chargers)).length === 0)
      ? candidate
      : null

  if (draft) {
    // A draft's chargers are only replaced while it has no photos yet; once
    // saveMyChargers has attached them, the sign-up form calls that directly.
    const keepChargers = photoUrls(parseChargers(draft.chargers)).length > 0
    await prisma.business.update({
      where: { id: draft.id },
      data: {
        ...fields.value,
        lat: coordinates.lat,
        lng: coordinates.lng,
        ...(keepChargers ? {} : { chargers: JSON.stringify(cleaned.chargers) }),
      },
    })
    refreshPublicViews()
    revalidatePath('/business/dashboard')
    return { ok: true, businessId: draft.id }
  }

  // Only a genuinely new listing counts against the limit, so a retry of a
  // failed upload is never what locks somebody out.
  const limit = await checkLimits([
    { key: `biz-register:user:${user.id}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `biz-register:ip:${clientFingerprint()}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many new listings') }
  }

  const businessId = randomUUID()

  await prisma.business.create({
    data: {
      id: businessId,
      userId: user.id,
      ownerName: user.name,
      email: user.email,
      ...fields.value,
      lat: coordinates.lat,
      lng: coordinates.lng,
      chargers: JSON.stringify(cleaned.chargers),
      // No credential is written here, and none is accepted. The owner already
      // has an account; this row only records which one.
    },
  })

  refreshPublicViews()
  revalidatePath('/business/dashboard')
  return { ok: true, businessId }
}

// ─── Admin actions ──────────────────────────────────────
//
// Each returns { ok: false, message } rather than throwing — for an expired
// admin session as much as for a row that has gone — so the portal can say
// what happened instead of showing an error page. Every successful change is
// written to the audit log.

const NOT_ADMIN: BusinessResult = {
  ok: false,
  message: 'Your admin session has expired. Sign in again and retry.',
}

async function requireAdmin(): Promise<AdminActor | null> {
  return getAdminActor()
}

/**
 * Approves, rejects or re-opens a listing.
 *
 * `note` is the reason shown to the owner on their dashboard when a listing is
 * not approved. It is cleared on approval, since a reason for a refusal that
 * no longer applies would only confuse.
 *
 * Approval reads the listing, checks it and writes it inside one transaction,
 * and the write only lands if the charger column is still what was checked.
 * Without that, an owner saving a new photo between the read and the write
 * would have it marked approved by a decision made about the old one.
 */
export async function setBusinessStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  note?: string,
): Promise<BusinessResult> {
  const actor = await requireAdmin()
  if (!actor) return NOT_ADMIN
  if (!id || typeof id !== 'string') return { ok: false, message: 'That listing no longer exists.' }
  if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
    return { ok: false, message: 'Choose a valid status.' }
  }

  const reviewNote =
    status === 'approved' ? null : (typeof note === 'string' ? note.trim().slice(0, LIMITS.reviewNote) : '') || null

  const outcome = await prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id },
      select: { chargers: true, lat: true, lng: true, businessName: true },
    })
    if (!business) return { ok: false as const, message: 'That listing no longer exists.' }

    const chargers = parseChargers(business.chargers)
    if (status === 'approved') {
      const problem = validateForApproval({ lat: business.lat, lng: business.lng, chargers })
      if (problem) return { ok: false as const, message: problem }
    }

    const written = await tx.business.updateMany({
      where: { id, chargers: business.chargers },
      data: {
        status,
        // A note is only replaced when the operator supplies one or approves,
        // so re-opening a listing does not erase why it was refused.
        ...(status === 'approved' || reviewNote !== null ? { reviewNote } : {}),
        reviewedAt: status === 'pending' ? null : new Date(),
        ...(status === 'approved' ? { chargers: JSON.stringify(approvePhotos(chargers)) } : {}),
      },
    })
    if (written.count !== 1) {
      return {
        ok: false as const,
        message: 'The owner changed this listing a moment ago. Reload and review it again.',
      }
    }
    return { ok: true as const, name: business.businessName }
  })

  if (!outcome.ok) return { ok: false, message: outcome.message }

  await logAdminAction(
    actor,
    `business.${status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'reopen'}`,
    'business',
    id,
    `${outcome.name}${reviewNote ? ` — ${reviewNote}` : ''}`,
  )

  refreshPublicViews()
  revalidatePath(`/station/${id}`)
  revalidatePath('/business/dashboard')
  return { ok: true }
}

export async function reviewBusinessPhoto(
  businessId: string,
  photoUrl: string,
  status: 'approved' | 'needs-better-photo',
): Promise<BusinessResult> {
  const actor = await requireAdmin()
  if (!actor) return NOT_ADMIN
  if (status !== 'approved' && status !== 'needs-better-photo') {
    return { ok: false, message: 'Choose a valid photo decision.' }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { chargers: true },
  })
  if (!business) return { ok: false, message: 'That listing no longer exists.' }

  let found = false
  const next = parseChargers(business.chargers).map((charger) => {
    if (charger.photo === photoUrl) {
      found = true
      return { ...charger, photoStatus: status }
    }
    if (charger.portPhoto === photoUrl) {
      found = true
      return { ...charger, portPhotoStatus: status }
    }
    return charger
  })
  if (!found) return { ok: false, message: 'That photo is not part of this listing.' }

  const written = await prisma.business.updateMany({
    where: { id: businessId, chargers: business.chargers },
    data: { chargers: JSON.stringify(next) },
  })
  if (written.count !== 1) {
    return { ok: false, message: 'The owner changed this listing a moment ago. Reload and try again.' }
  }
  await prisma.businessPhotoReport.updateMany({
    where: { businessId, photoUrl, status: 'new' },
    data: { status: 'resolved' },
  })

  await logAdminAction(actor, `business.photo.${status}`, 'business', businessId, photoUrl)

  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  revalidatePath(`/station/${businessId}`)
  revalidatePath('/map')
  revalidatePath('/business/dashboard')
  revalidatePath('/business/chargers')
  return { ok: true }
}

/**
 * Create or update a business from the admin portal.
 *
 * Separate from registerBusiness on purpose. That one is a public application
 * and always lands as `pending`; this one is an operator entering or
 * correcting a record, so it can set the status directly — including adding an
 * already-approved business that never went through the public form. An
 * approved status goes through the same validateForApproval as the status
 * button, so the edit form is not a way around it.
 */
export async function saveBusiness(form: FormData): Promise<BusinessResult> {
  const actor = await requireAdmin()
  if (!actor) return NOT_ADMIN

  const id = String(form.get('id') ?? '').trim()
  const status = String(form.get('status') ?? 'pending').trim()

  const ownerName = checkText(form.get('ownerName'), 'the owner name', { max: LIMITS.ownerName, required: true })
  if (!ownerName.ok) return { ok: false, message: ownerName.message }
  const email = checkEmail(form.get('email'))
  if (!email.ok) return { ok: false, message: email.message }

  const fields = readListingFields({
    businessName: form.get('businessName'),
    businessType: form.get('businessType'),
    city: form.get('city'),
    address: form.get('address'),
    phone: form.get('phone'),
    website: form.get('website'),
  })
  if (!fields.ok) return { ok: false, message: fields.message }

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return { ok: false, message: 'Choose a valid status.' }
  }

  const coordinates = readCoordinates(
    String(form.get('lat') ?? '').trim(),
    String(form.get('lng') ?? '').trim(),
  )
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  let rawChargers: unknown = []
  const chargerText = String(form.get('chargers') ?? '').trim()
  if (chargerText) {
    try {
      rawChargers = JSON.parse(chargerText)
    } catch {
      return { ok: false, message: 'Chargers must be valid JSON.' }
    }
  }

  const existing = id
    ? await prisma.business.findUnique({ where: { id }, select: { chargers: true, status: true } })
    : null
  if (id && !existing) return { ok: false, message: 'That listing no longer exists.' }

  const stored = parseChargers(existing?.chargers)
  const cleaned = cleanChargers(rawChargers, stored, { trustStatus: true })
  if (!cleaned.ok) return { ok: false, message: cleaned.message }

  let chargers = cleaned.chargers
  if (status === 'approved') {
    const problem = validateForApproval({ lat: coordinates.lat, lng: coordinates.lng, chargers })
    if (problem) return { ok: false, message: problem }
    chargers = approvePhotos(chargers)
  }

  const statusChanged = !existing || existing.status !== status
  const data = {
    ownerName: ownerName.value,
    email: email.value,
    ...fields.value,
    lat: coordinates.lat,
    lng: coordinates.lng,
    chargers: JSON.stringify(chargers),
    status,
    ...(statusChanged ? { reviewedAt: status === 'pending' ? null : new Date() } : {}),
    ...(status === 'approved' ? { reviewNote: null } : {}),
  }

  let targetId = id
  if (existing) {
    const written = await prisma.business.updateMany({
      where: { id, chargers: existing.chargers },
      data,
    })
    if (written.count !== 1) {
      return { ok: false, message: 'The owner changed this listing a moment ago. Reload and try again.' }
    }
  } else {
    targetId = randomUUID()
    await prisma.business.create({ data: { ...data, id: targetId } })
  }

  const kept = new Set(photoUrls(chargers))
  await discardUnreferenced(photoUrls(stored).filter((url) => !kept.has(url)))

  await logAdminAction(
    actor,
    existing ? 'business.update' : 'business.create',
    'business',
    targetId,
    `${fields.value.businessName} (${status})`,
  )

  refreshPublicViews()
  revalidatePath(`/station/${targetId}`)
  return { ok: true, businessId: targetId }
}

export async function deleteBusiness(id: string): Promise<BusinessResult> {
  const actor = await requireAdmin()
  if (!actor) return NOT_ADMIN

  const business = await prisma.business.findUnique({
    where: { id },
    select: { chargers: true, businessName: true },
  })
  if (!business) return { ok: false, message: 'That listing no longer exists.' }

  await prisma.business.delete({ where: { id } })

  // The photos go too, after the row: deleting files first and then failing
  // to delete the row would leave a live listing with broken images.
  await discardUnreferenced(photoUrls(parseChargers(business.chargers)))

  await logAdminAction(actor, 'business.delete', 'business', id, business.businessName)

  refreshPublicViews()
  revalidatePath(`/station/${id}`)
  return { ok: true }
}

// ─── Owner-scoped actions ───────────────────────────────
//
// Everything below belongs to the person who submitted the listing, not to an
// admin. Each one re-reads the session and confirms the row's userId matches
// before touching anything: a Server Action is a POST endpoint, so "the UI only
// shows your own listing" is not access control. Without this check, passing
// somebody else's business id would edit their listing.

/**
 * Loads one of the signed-in owner's businesses.
 *
 * Returns null rather than throwing when the id belongs to someone else, so
 * callers cannot tell an id that does not exist from one they simply do not
 * own.
 */
async function loadOwned(businessId: string) {
  const userId = await getSessionUserId()
  if (!userId || typeof businessId !== 'string' || !businessId) return null

  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business || business.userId !== userId) return null

  return business
}

function refreshOwnerViews(businessId: string): void {
  revalidatePath('/business/dashboard')
  revalidatePath('/business/profile')
  revalidatePath('/business/chargers')
  revalidatePath('/admin/businesses')
  // The listing's public face changes too.
  revalidatePath(`/station/${businessId}`)
  revalidatePath('/')
  revalidatePath('/map')
}

export async function updateMyBusiness(form: FormData): Promise<BusinessResult> {
  const id = String(form.get('id') ?? '').trim()
  const business = await loadOwned(id)
  if (!business) return { ok: false, message: 'That listing is not yours to edit.' }

  const fields = readListingFields({
    businessName: form.get('businessName'),
    businessType: form.get('businessType'),
    city: form.get('city'),
    address: form.get('address'),
    phone: form.get('phone'),
    website: form.get('website'),
  })
  if (!fields.ok) return { ok: false, message: fields.message }

  const description = checkText(form.get('description'), 'the description', { max: LIMITS.description })
  if (!description.ok) return { ok: false, message: description.message }

  const coordinates = readCoordinates(form.get('lat'), form.get('lng'))
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  /*
    A live listing whose pin moves more than a kilometre — or loses its pin —
    goes back for review. Drivers navigate to that pin, and the operator
    approved the place it was, not wherever it is dragged to afterwards. The
    owner is asked first; nothing is saved until they confirm.
  */
  let backToReview = false
  if (business.status === 'approved' && business.lat !== null && business.lng !== null) {
    const moved =
      coordinates.lat === null || coordinates.lng === null
        ? Infinity
        : distanceKm({ lat: business.lat, lng: business.lng }, { lat: coordinates.lat, lng: coordinates.lng })
    if (moved > MOVE_REVIEW_KM) {
      if (form.get('confirmMove') !== '1') {
        return {
          ok: false,
          needsConfirmation: true,
          message:
            'Moving the pin this far sends your listing back for review, and it will be off the map until it is approved again.',
        }
      }
      backToReview = true
    }
  }
  // Editing a listing that was not approved is how an owner answers the
  // reason they were given, so it returns to the queue for another look.
  if (business.status === 'rejected') backToReview = true

  await prisma.business.update({
    where: { id },
    data: {
      ...fields.value,
      description: description.value || null,
      lat: coordinates.lat,
      lng: coordinates.lng,
      ...(backToReview ? { status: 'pending', reviewedAt: null } : {}),
      // Email is not editable here. It is what links this row to the owner's
      // account — changing it from this form would silently break that link.
    },
  })

  refreshOwnerViews(id)
  return { ok: true, backToReview }
}

/**
 * Replaces the charger list on a listing.
 *
 * The whole array is written at once rather than patched item by item. The
 * chargers live in a single JSON column, so a partial update would mean
 * read-modify-write on the client and lose any concurrent change; sending the
 * full intended list keeps the column consistent with what the owner sees.
 *
 * Photo statuses come from the stored row, never from the request (see
 * cleanChargers): a new or replaced photo is `pending` and is not shown to
 * drivers until an operator approves it, even on a listing that is already
 * live. Photos the new list no longer uses are deleted from storage once the
 * save has landed.
 */
export async function saveMyChargers(
  businessId: string,
  chargers: DraftCharger[],
): Promise<BusinessResult> {
  const business = await loadOwned(businessId)
  if (!business) return { ok: false, message: 'That listing is not yours to edit.' }

  const stored = parseChargers(business.chargers)
  const cleaned = cleanChargers(chargers, stored)
  if (!cleaned.ok) return { ok: false, message: cleaned.message }

  if (cleaned.chargers.length === 0) return { ok: false, message: 'Add at least one charger before saving.' }
  if (cleaned.chargers.some((charger) => !charger.photo)) {
    return { ok: false, message: 'Each charger needs a primary charger photo before saving.' }
  }

  const storedUrls = new Set(photoUrls(stored))
  const added = photoUrls(cleaned.chargers).filter((url) => !storedUrls.has(url))
  if (await usedElsewhere(businessId, added)) {
    return { ok: false, message: 'One of those photos belongs to another listing. Upload your own.' }
  }

  const backToReview = business.status === 'rejected'

  // Compare-and-swap on the column that was read, so an operator's photo
  // decision made in the meantime is not overwritten with the old statuses.
  const written = await prisma.business.updateMany({
    where: { id: businessId, chargers: business.chargers },
    data: {
      chargers: JSON.stringify(cleaned.chargers),
      ...(backToReview ? { status: 'pending', reviewedAt: null } : {}),
    },
  })
  if (written.count !== 1) {
    return { ok: false, message: 'This listing changed while you were editing. Reload the page and try again.' }
  }

  const kept = new Set(photoUrls(cleaned.chargers))
  await discardUnreferenced([...storedUrls].filter((url) => !kept.has(url)))

  refreshOwnerViews(businessId)
  return { ok: true, backToReview }
}

// ─── What the analytics page counts ─────────────────────
//
// The figures on that page were a fixed array — 1,240 views and 89 clicks that
// never moved, for a listing that might not even be approved. These two
// actions are the only things that write those numbers, and they are called
// from the public listing page by real visitors.

/**
 * Today's date in Pakistan Standard Time as YYYY-MM-DD.
 *
 * Deliberately not the server's local day. A listing in Lahore should roll over
 * at midnight in Lahore, otherwise a host reading yesterday's total sees it
 * change hours late.
 */
function karachiDay(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * One atomic upsert on (businessId, day). The find-then-create this replaced
 * let two first visitors of the day both see "no row" and the second create
 * fail on the unique key, losing the count.
 */
async function bump(businessId: string, field: 'views' | 'clicks'): Promise<void> {
  const day = karachiDay()
  const write = () =>
    prisma.businessDailyStat.upsert({
      where: { businessId_day: { businessId, day } },
      create: { id: randomUUID(), businessId, day, [field]: 1 },
      update: { [field]: { increment: 1 } },
    })
  try {
    await write()
  } catch {
    // A lost race on the unique key resolves itself on the second attempt,
    // which finds the row the other request created.
    await write()
  }
}

/**
 * Who may be counted, or null when nobody should be.
 *
 * Only live listings accumulate figures — counting views of a pending listing
 * would credit it for traffic no driver could have sent it — and the owner
 * looking at their own listing is not a visitor.
 */
async function countable(businessId: string): Promise<boolean> {
  if (typeof businessId !== 'string' || !businessId) return false
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true, userId: true },
  })
  if (!business || business.status !== 'approved') return false

  const viewer = await getSessionUserId()
  return !(viewer && viewer === business.userId)
}

/**
 * Counts one view of a listing, at most once per visitor per day.
 *
 * De-duplicated on the server by a hash of the visitor's address. It used to
 * be a cookie, which anyone could clear — a host could reload their own page
 * in a private window and watch the number climb.
 */
export async function recordBusinessView(businessId: string): Promise<void> {
  if (!(await countable(businessId))) return
  if (!(await firstInWindow(`bview:${businessId}:${clientFingerprint()}`, 24 * 60 * 60))) return
  await bump(businessId, 'views')
}

/**
 * Counts a press of the directions button, at most once per visitor per hour,
 * so the figure reads as "people who asked for directions" rather than taps.
 */
export async function recordBusinessDirections(businessId: string): Promise<void> {
  if (!(await countable(businessId))) return
  if (!(await firstInWindow(`bdir:${businessId}:${clientFingerprint()}`, 60 * 60))) return
  await bump(businessId, 'clicks')
}
