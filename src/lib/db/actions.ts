// src/lib/db/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

import { CONNECTOR_TYPES, SERVICE_CATEGORY_KEYS } from '@/lib/constants'
import type { ConnectorStatus, StationStatus, VenueType } from '@/lib/types'
import { createSlug } from '@/lib/utils'
import { checkEmail, checkPhone, checkText, checkWebsite, isInPakistan } from '@/lib/validate'

import { assertAdmin, type AdminActor } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'
import { getCurrentUser } from './session-actions'

/**
 * Every write in the product goes through this file.
 *
 * Server Actions are POST endpoints with generated URLs — reachable by
 * anything that learns the URL, not only by the page that rendered the form.
 * The layout's session check guards *rendering*, not *invocation*, so each
 * action re-checks the session itself. Skipping that would leave the whole
 * database writable by an unauthenticated request.
 *
 * ── Every admin action answers, none of them throws ───────────────────
 *
 * A thrown error from a server action reaches the client as a rejected promise
 * with the message stripped in production. The controls that call these were
 * written against `{ ok, message }`, so a throw left a "deleting" spinner
 * turning forever or dropped the operator onto the error page. An expired
 * session, a row somebody else already deleted and a bad field are all
 * ordinary outcomes here, and each comes back as a sentence.
 */

export interface ActionResult {
  ok: boolean
  message?: string
}

const DENIED: ActionResult = {
  ok: false,
  message: 'Your admin session has expired. Sign in again and retry.',
}

/** The operator, or null when the caller is not one. Never throws. */
async function actor(): Promise<AdminActor | null> {
  try {
    return await assertAdmin()
  } catch {
    return null
  }
}

/** Prisma's "record to update/delete does not exist". */
function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
}

/** Prisma's unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
}

/** The last resort, logged so the cause is not lost with the stack. */
function unexpected(where: string, error: unknown): ActionResult {
  console.error(`[admin] ${where} failed`, error)
  return { ok: false, message: 'Something went wrong saving that. Nothing was changed; try again.' }
}

/**
 * Public pages read from the database, so a write has to invalidate their
 * cached output or the site keeps serving the previous version until a
 * redeploy. Listed explicitly rather than nuking the whole cache.
 */
function revalidateStationSurfaces(slug?: string) {
  revalidatePath('/')
  revalidatePath('/map')
  revalidatePath('/routes')
  if (slug) revalidatePath(`/station/${slug}`)
}

function revalidateServiceSurfaces(category?: string, slug?: string) {
  revalidatePath('/')
  revalidatePath('/services')
  if (category) revalidatePath(`/services/${category}`)
  if (category && slug) revalidatePath(`/services/${category}/${slug}`)
}

function revalidateCommunitySurfaces(slug?: string) {
  revalidatePath('/')
  revalidatePath('/community')
  if (slug) revalidatePath(`/community/post/${slug}`)
}

// ─── Shared field readers ───────────────────────────

function readNumber(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key))
  return Number.isFinite(value) ? value : fallback
}

function readString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Coordinates that will actually put a pin in the right country.
 *
 * Both of these forms used to run the fields through Number() with 0 as the
 * fallback, so a blank or mistyped latitude saved as 0,0 — a pin in the Gulf
 * of Guinea, and a station that the route planner could never reach. A blank
 * is now refused, and so is anything outside Pakistan's bounding box. A pair
 * that would be inside if swapped says so, because that is the usual mistake.
 */
function readCoordinates(form: FormData): { ok: true; lat: number; lng: number } | { ok: false; message: string } {
  const rawLat = readString(form, 'lat')
  const rawLng = readString(form, 'lng')
  if (!rawLat || !rawLng) {
    return { ok: false, message: 'Enter both latitude and longitude — without them it cannot be placed on the map.' }
  }
  const lat = Number(rawLat)
  const lng = Number(rawLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: 'Latitude and longitude must be decimal numbers, e.g. 31.5497 and 74.3436.' }
  }
  if (!isInPakistan(lat, lng)) {
    if (isInPakistan(lng, lat)) {
      return { ok: false, message: 'Those coordinates look swapped — latitude is the smaller number (about 24–37) in Pakistan.' }
    }
    return {
      ok: false,
      message: 'Those coordinates are outside Pakistan. Latitude should be between 23 and 37.5, longitude between 60.5 and 78.',
    }
  }
  return { ok: true, lat, lng }
}

/**
 * A slug that is safe in a URL, from what was typed or from the fallback.
 * The typed value is normalised too: a space or a capital in a hand-entered
 * slug used to be stored as-is and produced a link that 404'd.
 */
function readSlug(form: FormData, fallback: string): string {
  return createSlug(readString(form, 'slug') || fallback).replace(/^-+|-+$/g, '')
}

// ─── Stations ───────────────────────────────────────

const STATION_STATUSES: StationStatus[] = ['available', 'limited', 'offline', 'unknown']
const VENUE_TYPES: VenueType[] = [
  'standalone',
  'hotel',
  'restaurant',
  'mall',
  'office',
  'dealership',
  'service-center',
  'home',
  'other',
]

export async function saveStation(id: string | null, form: FormData): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  const name = checkText(form.get('name'), 'a name', { max: 120, required: true })
  if (!name.ok) return name

  const city = checkText(form.get('city'), 'a city', { max: 80, required: true })
  if (!city.ok) return city

  const description = checkText(form.get('description'), 'the description', { max: 2000 })
  if (!description.ok) return description

  const coords = readCoordinates(form)
  if (!coords.ok) return coords

  // Whitelisted, not trusted. The select only offers these, but the action is
  // reachable without the select, and an unknown status would render as a
  // badge that no filter can find.
  const status = readString(form, 'status') as StationStatus
  if (!STATION_STATUSES.includes(status)) return { ok: false, message: 'Choose a status from the list.' }

  const venueType = (readString(form, 'venueType') || 'other') as VenueType
  if (!VENUE_TYPES.includes(venueType)) return { ok: false, message: 'Choose a venue from the list.' }

  const website = checkWebsite(form.get('website'))
  if (!website.ok) return website

  const phone = checkPhone(form.get('phone'))
  if (!phone.ok) return phone

  const slug = readSlug(form, `${name.value}-${city.value}`)
  if (!slug) return { ok: false, message: 'Enter a URL slug using letters and numbers.' }

  /*
    No `rating` here any more. It was a hand-typed number on the form, which
    put a score on the public page that no driver had given. Ratings are now
    derived from the Review rows by the public queries, so there is nothing for
    an operator to type.
  */
  const data = {
    slug,
    name: name.value,
    description: description.value || null,
    street: readString(form, 'street'),
    area: readString(form, 'area'),
    city: city.value,
    province: readString(form, 'province'),
    country: readString(form, 'country') || 'Pakistan',
    lat: coords.lat,
    lng: coords.lng,
    network: readString(form, 'network'),
    status,
    venueType,
    isVerified: form.get('isVerified') === 'on',
    phone: phone.value,
    website: website.value,
    coverPhoto: readString(form, 'coverPhoto') || null,
  }

  try {
    if (id) {
      const before = await prisma.station.findUnique({ where: { id }, select: { slug: true } })
      if (!before) return { ok: false, message: 'That station no longer exists.' }
      await prisma.station.update({ where: { id }, data })
      revalidateStationSurfaces(before.slug)
      // A renamed slug leaves the old URL cached; clear it too.
      if (before.slug !== slug) revalidateStationSurfaces(slug)
      await logAdminAction(admin, 'station.update', 'station', id, `${data.name} · ${status}`)
    } else {
      // A UUID rather than Date.now(): two stations created in the same
      // millisecond (a double-submit) got the same id and the second failed.
      const newId = `stn-${randomUUID()}`
      await prisma.station.create({ data: { ...data, id: newId } })
      revalidateStationSurfaces(slug)
      await logAdminAction(admin, 'station.create', 'station', newId, `${data.name}, ${data.city}`)
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, message: `The slug "${slug}" is already used by another station.` }
    }
    if (isNotFound(error)) return { ok: false, message: 'That station no longer exists.' }
    return unexpected('saveStation', error)
  }

  revalidatePath('/admin/stations')
  return { ok: true, message: id ? 'Station saved.' : 'Station created.' }
}

/**
 * Removes a station and everything hanging off it.
 *
 * Connectors and reviews cascade in the schema. Bookmarks do not — a
 * SavedStation stores the listing id as plain text with no relation, because a
 * bookmark can point at a business as well — so they are removed in the same
 * transaction, or members would keep a saved entry that resolves to nothing.
 */
export async function deleteStation(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const station = await prisma.station.findUnique({
      where: { id },
      select: { slug: true, name: true, _count: { select: { connectors: true, reviews: true } } },
    })
    if (!station) return { ok: false, message: 'That station no longer exists.' }

    await prisma.$transaction([
      prisma.savedStation.deleteMany({ where: { listingId: { in: [id, station.slug] } } }),
      prisma.station.delete({ where: { id } }),
    ])

    revalidateStationSurfaces(station.slug)
    revalidatePath('/admin/stations')
    revalidatePath('/admin/connectors')
    revalidatePath('/admin/reviews')
    await logAdminAction(
      admin,
      'station.delete',
      'station',
      id,
      `${station.name} (with ${station._count.connectors} connectors, ${station._count.reviews} reviews)`,
    )
    return { ok: true, message: `${station.name} deleted.` }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That station no longer exists.' }
    return unexpected('deleteStation', error)
  }
}

// ─── Services ───────────────────────────────────────

const SERVICE_STATUSES = ['approved', 'pending', 'rejected'] as const
type ServiceStatus = (typeof SERVICE_STATUSES)[number]

export async function saveService(id: string | null, form: FormData): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  const name = checkText(form.get('name'), 'a name', { max: 120, required: true })
  if (!name.ok) return name

  const category = readString(form, 'category')
  if (!SERVICE_CATEGORY_KEYS.includes(category as (typeof SERVICE_CATEGORY_KEYS)[number])) {
    return { ok: false, message: 'Choose a category from the list.' }
  }

  const city = checkText(form.get('city'), 'a city', { max: 80, required: true })
  if (!city.ok) return city

  const description = checkText(form.get('description'), 'the description', { max: 2000 })
  if (!description.ok) return description

  const coords = readCoordinates(form)
  if (!coords.ok) return coords

  const phone = checkPhone(form.get('phone'), { required: true })
  if (!phone.ok) return phone

  const rawEmail = readString(form, 'email')
  let email: string | null = null
  if (rawEmail) {
    const checked = checkEmail(rawEmail)
    if (!checked.ok) return checked
    email = checked.value
  }

  const website = checkWebsite(form.get('website'))
  if (!website.ok) return website

  /*
    An operator-entered service is approved unless they say otherwise.

    Before, this write left `status` to the schema default of 'pending', so a
    service added here was invisible on the public directory and sat in the
    applications queue as though a stranger had submitted it — inflating the
    badge with work the operator had just done themselves.
  */
  const rawStatus = readString(form, 'status') || 'approved'
  if (!SERVICE_STATUSES.includes(rawStatus as ServiceStatus)) {
    return { ok: false, message: 'Choose a status from the list.' }
  }
  const status = rawStatus as ServiceStatus

  const slug = readSlug(form, name.value)
  if (!slug) return { ok: false, message: 'Enter a URL slug using letters and numbers.' }

  const data = {
    slug,
    name: name.value,
    category,
    description: description.value,
    street: readString(form, 'street'),
    area: readString(form, 'area'),
    city: city.value,
    province: readString(form, 'province'),
    country: readString(form, 'country') || 'Pakistan',
    lat: coords.lat,
    lng: coords.lng,
    phone: phone.value ?? '',
    email,
    website: website.value,
    coverPhoto: readString(form, 'coverPhoto') || null,
    // No rating: services have no review table, so a typed figure would be
    // invented. Existing values are left as they are rather than zeroed.
    isVerified: form.get('isVerified') === 'on',
    status,
  }

  try {
    if (id) {
      const before = await prisma.eVService.findUnique({ where: { id }, select: { category: true, slug: true } })
      if (!before) return { ok: false, message: 'That service no longer exists.' }
      await prisma.eVService.update({ where: { id }, data })
      revalidateServiceSurfaces(before.category, before.slug)
      revalidateServiceSurfaces(category, slug)
      await logAdminAction(admin, 'service.update', 'service', id, `${data.name} · ${status}`)
    } else {
      const newId = `svc-${randomUUID()}`
      await prisma.eVService.create({ data: { ...data, id: newId } })
      revalidateServiceSurfaces(category, slug)
      await logAdminAction(admin, 'service.create', 'service', newId, `${data.name}, ${data.city} · ${status}`)
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, message: `The slug "${slug}" is already used by another service.` }
    }
    if (isNotFound(error)) return { ok: false, message: 'That service no longer exists.' }
    return unexpected('saveService', error)
  }

  revalidatePath('/admin/services')
  revalidatePath('/admin')
  return { ok: true, message: id ? 'Service saved.' : 'Service created.' }
}

export async function deleteService(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const service = await prisma.eVService.delete({ where: { id } })
    revalidateServiceSurfaces(service.category, service.slug)
    revalidatePath('/admin/services')
    revalidatePath('/admin')
    await logAdminAction(admin, 'service.delete', 'service', id, service.name)
    return { ok: true, message: `${service.name} deleted.` }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That service no longer exists.' }
    return unexpected('deleteService', error)
  }
}

// ─── Community ──────────────────────────────────────

export async function markCommunityPostReviewed(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const post = await prisma.communityPost.update({
      where: { id },
      data: { adminViewedAt: new Date() },
      select: { title: true },
    })
    revalidatePath('/admin/community')
    revalidatePath('/admin')
    await logAdminAction(admin, 'post.review', 'post', id, post.title)
    return { ok: true, message: 'Marked as reviewed.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That post no longer exists.' }
    return unexpected('markCommunityPostReviewed', error)
  }
}

export async function reportBusinessPhoto(
  businessId: string,
  photoUrl: string,
  reason: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Sign in to report a photo.' }

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { chargers: true } })
  if (!business) return { ok: false, message: 'That listing no longer exists.' }

  let chargers: Array<{ photo?: string; portPhoto?: string }> = []
  try {
    const parsed: unknown = JSON.parse(business.chargers)
    if (Array.isArray(parsed)) chargers = parsed as Array<{ photo?: string; portPhoto?: string }>
  } catch {
    return { ok: false, message: 'That listing has invalid photo data.' }
  }

  if (!chargers.some((charger) => charger.photo === photoUrl || charger.portPhoto === photoUrl)) {
    return { ok: false, message: 'That photo is not part of this listing.' }
  }

  await prisma.businessPhotoReport.create({
    data: { id: randomUUID(), businessId, photoUrl, reason: reason.trim() || 'Incorrect or misleading photo', reporterId: user.id },
  })
  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
  return { ok: true }
}

export async function deletePost(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    // Comments and likes cascade with the post.
    const post = await prisma.communityPost.delete({ where: { id } })
    revalidateCommunitySurfaces(post.slug)
    revalidatePath('/admin/community')
    revalidatePath('/admin')
    await logAdminAction(admin, 'post.delete', 'post', id, `${post.title} — by ${post.userName}`)
    return { ok: true, message: 'Post deleted.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That post no longer exists.' }
    return unexpected('deletePost', error)
  }
}

/**
 * Removes one comment and keeps the post's count in step.
 *
 * The post carries a denormalised commentCount for the cards, so it has to
 * move with the comment or the community list starts lying. One transaction,
 * so a failure between the two cannot leave the count off by one.
 */
export async function deleteComment(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { postId: true, userName: true, content: true, post: { select: { slug: true } } },
    })
    if (!comment) return { ok: false, message: 'That comment no longer exists.' }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id } }),
      prisma.communityPost.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ])

    revalidateCommunitySurfaces(comment.post.slug)
    revalidatePath('/admin/community')
    await logAdminAction(
      admin,
      'comment.delete',
      'comment',
      id,
      `by ${comment.userName}: ${comment.content.slice(0, 120)}`,
    )
    return { ok: true, message: 'Comment deleted.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That comment no longer exists.' }
    return unexpected('deleteComment', error)
  }
}

// ─── Reviews ────────────────────────────────────────

/**
 * Removes a driver's review of a station or business.
 *
 * Nothing to recompute afterwards: the public queries derive a listing's
 * rating and count from the Review rows themselves. Station.reviewCount and
 * Station.rating are older denormalised columns that nothing writes on review
 * creation either, so they are deliberately left alone here rather than
 * nudged into a state that only looks maintained.
 */
export async function deleteReview(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const review = await prisma.review.delete({
      where: { id },
      select: {
        userName: true,
        rating: true,
        stationId: true,
        businessId: true,
        station: { select: { slug: true, name: true } },
        business: { select: { businessName: true } },
      },
    })

    if (review.station) revalidatePath(`/station/${review.station.slug}`)
    if (review.businessId) revalidatePath(`/station/${review.businessId}`)
    revalidatePath('/map')
    revalidatePath('/business/reviews')
    revalidatePath('/admin/reviews')

    const listing = review.station?.name ?? review.business?.businessName ?? 'a listing'
    await logAdminAction(admin, 'review.delete', 'review', id, `${review.rating}★ by ${review.userName} on ${listing}`)
    return { ok: true, message: 'Review deleted.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That review no longer exists.' }
    return unexpected('deleteReview', error)
  }
}

// ─── Connectors ─────────────────────────────────────

const CONNECTOR_STATUSES: ConnectorStatus[] = ['available', 'in-use', 'offline']

/**
 * Port availability is the single most frequent write this product will take,
 * so it is its own action rather than a field buried in a station form. It
 * clamps rather than rejects: an operator correcting a count under pressure
 * should not be argued with over a typo, and "6 free of 4" is not a state
 * the product can render anyway.
 */
export async function setConnectorAvailability(
  id: string,
  availablePorts: number,
): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED
  if (!Number.isFinite(availablePorts)) return { ok: false, message: 'Enter a number of ports.' }

  try {
    const connector = await prisma.connector.findUnique({
      where: { id },
      include: { station: { select: { slug: true, name: true } } },
    })
    if (!connector) return { ok: false, message: 'That connector no longer exists.' }

    const clamped = Math.max(0, Math.min(Math.round(availablePorts), connector.ports))

    await prisma.connector.update({
      where: { id },
      data: { availablePorts: clamped },
    })

    revalidateStationSurfaces(connector.station.slug)
    revalidatePath('/admin/connectors')
    revalidatePath('/admin')
    await logAdminAction(
      admin,
      'connector.availability',
      'connector',
      id,
      `${connector.type} at ${connector.station.name}: ${connector.availablePorts} → ${clamped} of ${connector.ports} free`,
    )
    return { ok: true }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That connector no longer exists.' }
    return unexpected('setConnectorAvailability', error)
  }
}

export async function saveConnector(
  id: string | null,
  stationId: string,
  form: FormData,
): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  const type = readString(form, 'type')
  if (!CONNECTOR_TYPES.includes(type as (typeof CONNECTOR_TYPES)[number])) {
    return { ok: false, message: 'Choose a connector type from the list.' }
  }

  const status = (readString(form, 'status') || 'available') as ConnectorStatus
  if (!CONNECTOR_STATUSES.includes(status)) return { ok: false, message: 'Choose a status from the list.' }

  const maxPowerKw = readNumber(form, 'maxPowerKw', Number.NaN)
  if (!Number.isFinite(maxPowerKw) || maxPowerKw <= 0 || maxPowerKw > 1000) {
    return { ok: false, message: 'Peak power must be a number of kilowatts between 1 and 1000.' }
  }

  const ports = Math.max(1, Math.round(readNumber(form, 'ports', 1)))
  if (ports > 100) return { ok: false, message: 'A connector cannot have more than 100 ports.' }
  // Free ports can never exceed the total, whichever order they were typed in.
  const availablePorts = Math.max(0, Math.min(Math.round(readNumber(form, 'availablePorts')), ports))

  const data = { type, maxPowerKw, ports, availablePorts, status }

  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { slug: true, name: true },
    })
    if (!station) return { ok: false, message: 'That station no longer exists.' }

    if (id) {
      await prisma.connector.update({ where: { id }, data })
      await logAdminAction(admin, 'connector.update', 'connector', id, `${type} ${maxPowerKw} kW at ${station.name}`)
    } else {
      const newId = `con-${randomUUID()}`
      await prisma.connector.create({
        data: { ...data, id: newId, stationId, compatibleVehicles: '[]' },
      })
      await logAdminAction(admin, 'connector.create', 'connector', newId, `${type} ${maxPowerKw} kW at ${station.name}`)
    }

    revalidateStationSurfaces(station.slug)
    revalidatePath('/admin/connectors')
    revalidatePath(`/admin/stations/${stationId}`)
    revalidatePath('/admin')
    return { ok: true, message: id ? 'Connector saved.' : 'Connector added.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That connector no longer exists.' }
    return unexpected('saveConnector', error)
  }
}

export async function deleteConnector(id: string): Promise<ActionResult> {
  const admin = await actor()
  if (!admin) return DENIED

  try {
    const connector = await prisma.connector.delete({
      where: { id },
      include: { station: { select: { slug: true, id: true, name: true } } },
    })

    revalidateStationSurfaces(connector.station.slug)
    revalidatePath('/admin/connectors')
    revalidatePath(`/admin/stations/${connector.station.id}`)
    revalidatePath('/admin')
    await logAdminAction(admin, 'connector.delete', 'connector', id, `${connector.type} at ${connector.station.name}`)
    return { ok: true, message: 'Connector deleted.' }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, message: 'That connector no longer exists.' }
    return unexpected('deleteConnector', error)
  }
}
