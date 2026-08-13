// src/lib/db/actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'
import { createSlug } from '@/lib/utils'

import { prisma } from './client'

/**
 * Every write in the product goes through this file.
 *
 * Server Actions are POST endpoints with generated URLs — reachable by
 * anything that learns the URL, not only by the page that rendered the form.
 * The layout's session check guards *rendering*, not *invocation*, so each
 * action re-checks the session itself. Skipping that would leave the whole
 * database writable by an unauthenticated request.
 */
async function assertAdmin(): Promise<void> {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error('Not authorised')
  }
}

export interface ActionResult {
  ok: boolean
  message?: string
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

// ─── Stations ───────────────────────────────────────

function readNumber(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key))
  return Number.isFinite(value) ? value : fallback
}

export async function saveStation(id: string | null, form: FormData): Promise<ActionResult> {
  await assertAdmin()

  const name = String(form.get('name') ?? '').trim()
  if (!name) return { ok: false, message: 'Name is required.' }

  const city = String(form.get('city') ?? '').trim()
  if (!city) return { ok: false, message: 'City is required.' }

  const slug = String(form.get('slug') ?? '').trim() || createSlug(`${name}-${city}`)

  const data = {
    slug,
    name,
    description: String(form.get('description') ?? '').trim() || null,
    street: String(form.get('street') ?? '').trim(),
    area: String(form.get('area') ?? '').trim(),
    city,
    province: String(form.get('province') ?? '').trim(),
    country: String(form.get('country') ?? 'Pakistan').trim(),
    lat: readNumber(form, 'lat'),
    lng: readNumber(form, 'lng'),
    network: String(form.get('network') ?? '').trim(),
    status: String(form.get('status') ?? 'unknown'),
    isVerified: form.get('isVerified') === 'on',
    phone: String(form.get('phone') ?? '').trim() || null,
    website: String(form.get('website') ?? '').trim() || null,
    coverPhoto: String(form.get('coverPhoto') ?? '').trim() || null,
    rating: readNumber(form, 'rating'),
  }

  try {
    if (id) {
      const existing = await prisma.station.update({ where: { id }, data })
      revalidateStationSurfaces(existing.slug)
      // A renamed slug leaves the old URL cached; clear it too.
      if (existing.slug !== slug) revalidateStationSurfaces(slug)
    } else {
      await prisma.station.create({
        data: { ...data, id: `stn-${Date.now().toString(36)}` },
      })
      revalidateStationSurfaces(slug)
    }
  } catch (error) {
    // The only realistic failure is the unique constraint on slug.
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { ok: false, message: `The slug "${slug}" is already used by another station.` }
    }
    throw error
  }

  revalidatePath('/admin/stations')
  return { ok: true }
}

export async function deleteStation(id: string): Promise<ActionResult> {
  await assertAdmin()
  const station = await prisma.station.delete({ where: { id } })
  revalidateStationSurfaces(station.slug)
  revalidatePath('/admin/stations')
  return { ok: true }
}

// ─── Services ───────────────────────────────────────

export async function saveService(id: string | null, form: FormData): Promise<ActionResult> {
  await assertAdmin()

  const name = String(form.get('name') ?? '').trim()
  if (!name) return { ok: false, message: 'Name is required.' }

  const category = String(form.get('category') ?? '').trim()
  if (!category) return { ok: false, message: 'Category is required.' }

  const slug = String(form.get('slug') ?? '').trim() || createSlug(name)

  const data = {
    slug,
    name,
    category,
    description: String(form.get('description') ?? '').trim(),
    street: String(form.get('street') ?? '').trim(),
    area: String(form.get('area') ?? '').trim(),
    city: String(form.get('city') ?? '').trim(),
    province: String(form.get('province') ?? '').trim(),
    country: String(form.get('country') ?? 'Pakistan').trim(),
    lat: readNumber(form, 'lat'),
    lng: readNumber(form, 'lng'),
    phone: String(form.get('phone') ?? '').trim(),
    email: String(form.get('email') ?? '').trim() || null,
    website: String(form.get('website') ?? '').trim() || null,
    coverPhoto: String(form.get('coverPhoto') ?? '').trim() || null,
    rating: readNumber(form, 'rating'),
    isVerified: form.get('isVerified') === 'on',
  }

  try {
    if (id) {
      const existing = await prisma.eVService.update({ where: { id }, data })
      revalidateServiceSurfaces(existing.category, existing.slug)
      revalidateServiceSurfaces(category, slug)
    } else {
      await prisma.eVService.create({
        data: { ...data, id: `svc-${Date.now().toString(36)}` },
      })
      revalidateServiceSurfaces(category, slug)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { ok: false, message: `The slug "${slug}" is already used by another service.` }
    }
    throw error
  }

  revalidatePath('/admin/services')
  return { ok: true }
}

export async function deleteService(id: string): Promise<ActionResult> {
  await assertAdmin()
  const service = await prisma.eVService.delete({ where: { id } })
  revalidateServiceSurfaces(service.category, service.slug)
  revalidatePath('/admin/services')
  return { ok: true }
}

// ─── Community ──────────────────────────────────────

export async function deletePost(id: string): Promise<ActionResult> {
  await assertAdmin()
  const post = await prisma.communityPost.delete({ where: { id } })
  revalidateCommunitySurfaces(post.slug)
  revalidatePath('/admin/community')
  return { ok: true }
}

export async function deleteComment(id: string): Promise<ActionResult> {
  await assertAdmin()
  const comment = await prisma.comment.delete({ where: { id } })

  // The post carries a denormalised count for the cards, so it has to move
  // with the comment or the community list starts lying.
  await prisma.communityPost.update({
    where: { id: comment.postId },
    data: { commentCount: { decrement: 1 } },
  })

  const post = await prisma.communityPost.findUnique({ where: { id: comment.postId } })
  revalidateCommunitySurfaces(post?.slug)
  revalidatePath('/admin/community')
  return { ok: true }
}

// ─── Connectors ─────────────────────────────────────

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
  await assertAdmin()

  const connector = await prisma.connector.findUnique({
    where: { id },
    include: { station: { select: { slug: true } } },
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
  return { ok: true }
}

export async function saveConnector(
  id: string | null,
  stationId: string,
  form: FormData,
): Promise<ActionResult> {
  await assertAdmin()

  const ports = Math.max(1, Math.round(readNumber(form, 'ports', 1)))
  // Free ports can never exceed the total, whichever order they were typed in.
  const availablePorts = Math.max(0, Math.min(Math.round(readNumber(form, 'availablePorts')), ports))

  const data = {
    type: String(form.get('type') ?? 'CCS2'),
    maxPowerKw: readNumber(form, 'maxPowerKw'),
    ports,
    availablePorts,
    pricePerKwh: readNumber(form, 'pricePerKwh'),
    isFree: form.get('isFree') === 'on',
    status: String(form.get('status') ?? 'available'),
  }

  const station = await prisma.station.findUnique({
    where: { id: stationId },
    select: { slug: true },
  })
  if (!station) return { ok: false, message: 'That station no longer exists.' }

  if (id) {
    await prisma.connector.update({ where: { id }, data })
  } else {
    await prisma.connector.create({
      data: { ...data, id: `con-${Date.now().toString(36)}`, stationId, compatibleVehicles: '[]' },
    })
  }

  revalidateStationSurfaces(station.slug)
  revalidatePath('/admin/connectors')
  revalidatePath(`/admin/stations/${stationId}`)
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteConnector(id: string): Promise<ActionResult> {
  await assertAdmin()

  const connector = await prisma.connector.delete({
    where: { id },
    include: { station: { select: { slug: true, id: true } } },
  })

  revalidateStationSurfaces(connector.station.slug)
  revalidatePath('/admin/connectors')
  revalidatePath(`/admin/stations/${connector.station.id}`)
  revalidatePath('/admin')
  return { ok: true }
}
