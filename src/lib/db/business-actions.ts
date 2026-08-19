// src/lib/db/business-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

import { prisma } from './client'
import { getCurrentUser } from './session-actions'

/**
 * Applications from businesses wanting their chargers listed.
 *
 * The sign-up form used to await a 2.5 second timer and then announce
 * "You're Live on Plug.pk!" — it wrote nothing, sent nothing, and every
 * application disappeared on refresh. These are the same shape of actions as
 * the meeting requests: applying is public, because a business should not need
 * an account to ask; reading and changing applications is not, and each
 * privileged action re-checks the admin session, since a Server Action is a
 * POST endpoint reachable by anything that learns its URL.
 */

export interface BusinessResult {
  ok: boolean
  message?: string
}

export interface DraftCharger {
  connectorType: string
  maxPowerKw: number
  ports: number
}

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
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
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

export async function registerBusiness(
  application: BusinessApplication,
): Promise<BusinessResult> {
  // Listing requires an account. The page redirects to /login before the form
  // is shown, but this is the check that actually enforces it — the page only
  // decides what to render, while this is the endpoint that writes.
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, message: 'Sign in to list a business.' }
  }

  const ownerName = user.name
  const email = user.email
  const businessName = application.businessName?.trim() ?? ''
  const businessType = application.businessType?.trim() ?? ''
  const city = application.city?.trim() ?? ''

  // Re-validated here rather than trusted from the client. The form checks
  // these too, but that check is a convenience for the person typing; this one
  // is the one that actually protects the table.
  if (!businessName) return { ok: false, message: 'Enter your business name.' }
  if (!BUSINESS_TYPES.includes(businessType)) {
    return { ok: false, message: 'Choose a business type.' }
  }
  if (!city) return { ok: false, message: 'Choose a city.' }

  const coordinates = readCoordinates(application.lat, application.lng)
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  const chargers = Array.isArray(application.chargers)
    ? application.chargers
        .filter((charger) => charger && typeof charger.connectorType === 'string')
        .map((charger) => ({
          connectorType: charger.connectorType,
          maxPowerKw: Number(charger.maxPowerKw) || 0,
          ports: Math.max(1, Number(charger.ports) || 1),
        }))
    : []

  await prisma.business.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      ownerName,
      email,
      phone: application.phone?.trim() || null,
      businessName,
      businessType,
      city,
      address: application.address?.trim() || null,
      website: application.website?.trim() || null,
      lat: coordinates.lat,
      lng: coordinates.lng,
      chargers: JSON.stringify(chargers),
      // No credential is written here, and none is accepted. The owner already
      // has an account; this row only records which one.
    },
  })

  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  // The homepage counter and the map both read this table and are cached.
  revalidatePath('/')
  revalidatePath('/map')
  revalidatePath('/business/dashboard')
  return { ok: true }
}

async function assertAdmin(): Promise<void> {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error('Not authorised')
  }
}

export async function setBusinessStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<BusinessResult> {
  await assertAdmin()
  await prisma.business.update({ where: { id }, data: { status } })
  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  // The homepage counter and the map both read this table and are cached.
  revalidatePath('/')
  revalidatePath('/map')
  return { ok: true }
}

/**
 * Create or update a business from the admin portal.
 *
 * Separate from registerBusiness on purpose. That one is a public application
 * and always lands as `pending`; this one is an operator entering or
 * correcting a record, so it can set the status directly — including adding an
 * already-approved business that never went through the public form.
 */
export async function saveBusiness(form: FormData): Promise<BusinessResult> {
  await assertAdmin()

  const id = String(form.get('id') ?? '').trim()
  const ownerName = String(form.get('ownerName') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const businessName = String(form.get('businessName') ?? '').trim()
  const businessType = String(form.get('businessType') ?? '').trim()
  const city = String(form.get('city') ?? '').trim()
  const status = String(form.get('status') ?? 'pending').trim()

  if (!ownerName) return { ok: false, message: 'Enter the owner name.' }
  if (!email.includes('@')) return { ok: false, message: 'Enter a valid email address.' }
  if (!businessName) return { ok: false, message: 'Enter the business name.' }
  if (!BUSINESS_TYPES.includes(businessType)) {
    return { ok: false, message: 'Choose a business type.' }
  }
  if (!city) return { ok: false, message: 'Choose a city.' }
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return { ok: false, message: 'Choose a valid status.' }
  }

  const rawLat = String(form.get('lat') ?? '').trim()
  const rawLng = String(form.get('lng') ?? '').trim()
  const coordinates = readCoordinates(
    rawLat === '' ? null : rawLat,
    rawLng === '' ? null : rawLng,
  )
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  // An approved listing with no pin is invisible on the map, which is the
  // one place approval is supposed to put it.
  if (status === 'approved' && (coordinates.lat === null || coordinates.lng === null)) {
    return { ok: false, message: 'An approved business needs coordinates to appear on the map.' }
  }

  let chargers: DraftCharger[] = []
  const rawChargers = String(form.get('chargers') ?? '').trim()
  if (rawChargers) {
    try {
      const parsed: unknown = JSON.parse(rawChargers)
      if (Array.isArray(parsed)) chargers = parsed as DraftCharger[]
    } catch {
      return { ok: false, message: 'Chargers must be valid JSON.' }
    }
  }

  const data = {
    ownerName,
    email,
    phone: String(form.get('phone') ?? '').trim() || null,
    businessName,
    businessType,
    city,
    address: String(form.get('address') ?? '').trim() || null,
    website: String(form.get('website') ?? '').trim() || null,
    lat: coordinates.lat,
    lng: coordinates.lng,
    chargers: JSON.stringify(chargers),
    status,
  }

  if (id) {
    await prisma.business.update({ where: { id }, data })
  } else {
    await prisma.business.create({ data: { ...data, id: randomUUID() } })
  }

  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  // The homepage counter and the map both read this table and are cached.
  revalidatePath('/')
  revalidatePath('/map')
  return { ok: true }
}

export async function deleteBusiness(id: string): Promise<BusinessResult> {
  await assertAdmin()
  await prisma.business.delete({ where: { id } })
  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  // The homepage counter and the map both read this table and are cached.
  revalidatePath('/')
  revalidatePath('/map')
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
  const user = await getCurrentUser()
  if (!user) return null

  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business || business.userId !== user.id) return null

  return business
}

function refreshOwnerViews(): void {
  revalidatePath('/business/dashboard')
  revalidatePath('/business/profile')
  revalidatePath('/business/chargers')
  // The listing's public face changes too.
  revalidatePath('/')
  revalidatePath('/map')
}

export async function updateMyBusiness(form: FormData): Promise<BusinessResult> {
  const id = String(form.get('id') ?? '').trim()
  const business = await loadOwned(id)
  if (!business) return { ok: false, message: 'That listing is not yours to edit.' }

  const businessName = String(form.get('businessName') ?? '').trim()
  const businessType = String(form.get('businessType') ?? '').trim()
  const city = String(form.get('city') ?? '').trim()

  if (!businessName) return { ok: false, message: 'Enter a name for your listing.' }
  if (!BUSINESS_TYPES.includes(businessType)) return { ok: false, message: 'Choose a business type.' }
  if (!city) return { ok: false, message: 'Choose a city.' }

  const coordinates = readCoordinates(form.get('lat'), form.get('lng'))
  if (!coordinates.ok) return { ok: false, message: coordinates.message }

  await prisma.business.update({
    where: { id },
    data: {
      businessName,
      businessType,
      city,
      address: String(form.get('address') ?? '').trim() || null,
      phone: String(form.get('phone') ?? '').trim() || null,
      website: String(form.get('website') ?? '').trim() || null,
      description: String(form.get('description') ?? '').trim() || null,
      lat: coordinates.lat,
      lng: coordinates.lng,
      // Neither status nor email is editable here. Status is the admin's
      // decision, and the email is what links this row to the owner's account —
      // changing it from this form would silently break that link.
    },
  })

  refreshOwnerViews()
  return { ok: true }
}

/**
 * Replaces the charger list on a listing.
 *
 * The whole array is written at once rather than patched item by item. The
 * chargers live in a single JSON column, so a partial update would mean
 * read-modify-write on the client and lose any concurrent change; sending the
 * full intended list keeps the column consistent with what the owner sees.
 */
export async function saveMyChargers(
  businessId: string,
  chargers: DraftCharger[],
): Promise<BusinessResult> {
  const business = await loadOwned(businessId)
  if (!business) return { ok: false, message: 'That listing is not yours to edit.' }

  if (!Array.isArray(chargers)) return { ok: false, message: 'Could not read the charger list.' }
  if (chargers.length > 20) return { ok: false, message: 'A listing can hold at most 20 chargers.' }

  const cleaned = chargers
    .filter((charger) => charger && typeof charger.connectorType === 'string')
    .map((charger) => ({
      connectorType: charger.connectorType,
      maxPowerKw: Math.max(0, Number(charger.maxPowerKw) || 0),
      ports: Math.min(50, Math.max(1, Number(charger.ports) || 1)),
    }))

  await prisma.business.update({
    where: { id: businessId },
    data: { chargers: JSON.stringify(cleaned) },
  })

  refreshOwnerViews()
  return { ok: true }
}

// ─── What the analytics page counts ─────────────────────
//
// The figures on that page were a fixed array — 1,240 views and 89 clicks that
// never moved, for a listing that might not even be approved. These two
// actions are the only things that write those numbers, and they are called
// from the public listing page by real visitors.

const SEEN_COOKIE = 'plugpk_seen'
const SEEN_LIMIT = 40

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

async function bump(businessId: string, field: 'views' | 'clicks'): Promise<void> {
  const day = karachiDay()
  const existing = await prisma.businessDailyStat.findUnique({
    where: { businessId_day: { businessId, day } },
  })

  if (existing) {
    await prisma.businessDailyStat.update({
      where: { id: existing.id },
      data: { [field]: { increment: 1 } },
    })
    return
  }

  await prisma.businessDailyStat.create({
    data: { id: randomUUID(), businessId, day, [field]: 1 },
  })
}

/**
 * Counts one view of a listing, at most once per browser per day.
 *
 * Without the cookie check a host could reload their own page and watch the
 * number climb, which would make the figure worthless. Counting once per
 * browser per day is what the page then honestly calls a daily view.
 */
export async function recordBusinessView(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true },
  })
  // Only live listings accumulate figures. Counting views of a pending listing
  // would credit it for traffic no driver could have sent it.
  if (!business || business.status !== 'approved') return

  const day = karachiDay()
  const key = `${businessId.slice(0, 8)}:${day}`
  const jar = cookies()
  const seen = (jar.get(SEEN_COOKIE)?.value ?? '').split(',').filter(Boolean)

  if (seen.includes(key)) return

  await bump(businessId, 'views')

  // Yesterday's entries are dropped, so the cookie cannot grow without bound.
  const kept = [...seen.filter((entry) => entry.endsWith(day)), key].slice(-SEEN_LIMIT)
  jar.set(SEEN_COOKIE, kept.join(','), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 48,
  })
}

/**
 * Counts a press of the directions button.
 *
 * Not deduplicated, unlike views: this is a deliberate action rather than a
 * page load, and someone pressing it twice really did ask for directions twice.
 */
export async function recordBusinessDirections(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true },
  })
  if (!business || business.status !== 'approved') return

  await bump(businessId, 'clicks')
}
