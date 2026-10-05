// src/lib/db/service-application-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { SERVICE_CATEGORY_KEYS } from '@/lib/constants'
import { checkEmail, checkPhone, checkText, checkWebsite, isInPakistan } from '@/lib/validate'

import { getAdminActor } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'
import { checkLimits, clientFingerprint, retryMessage } from './rate-limit'

/**
 * Applications to be listed in the EV services directory.
 *
 * Services were admin-created only, so a workshop, installer or insurer had no
 * way to ask to be listed — while a charger host has had a public form and an
 * approval queue all along. This is that same flow for services, deliberately
 * shaped like the Business one so an operator learns one pattern rather than
 * two.
 *
 * Nothing here publishes anything. A submission lands as `pending` and is
 * invisible on the public site until a person approves it; getServices() and
 * the detail page both filter on that. The approve and reject actions live in
 * this file too, and they check the admin session themselves — a server action
 * is a POST endpoint anyone can call once they know the name, so a layout guard
 * protects pages, not actions.
 */

export interface ApplyResult {
  ok: boolean
  message?: string
  /** Field name to focus, when the failure is one specific input. */
  field?: string
}

/** Applications per address per hour. A real applicant sends one. */
const APPLICATIONS_PER_HOUR = 5

/** Trimmed, and empty-to-null so a blank optional field is not stored as "". */
function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim()
}

/**
 * A URL-safe slug, made unique by checking the table rather than by appending a
 * random suffix up front — a readable /services/service-center/ev-care-workshop
 * is worth one extra query, and the suffix only appears when it has to.
 */
async function uniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'service'

  let slug = base
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const clash = await prisma.eVService.findUnique({ where: { slug }, select: { id: true } })
    if (!clash) return slug
    slug = `${base}-${attempt}`
  }
  return `${base}-${randomUUID().slice(0, 6)}`
}

/**
 * Records an application. Public — no session required, by design.
 *
 * Name, category, city, a description, one way to make contact, and a map pin.
 * The pin was left to the reviewer at first, so every application was stored
 * at 0,0 — a point in the Gulf of Guinea — and an approved listing's
 * "Get Directions" sent drivers there. The applicant is the one person who
 * knows where the workshop is, so they place it, and it has to be inside
 * Pakistan. Opening hours and photos are still the reviewer's to fill in.
 *
 * Every field is length-capped and re-validated here; the form's own checks
 * are a convenience for the person typing.
 */
export async function applyToListService(form: FormData): Promise<ApplyResult> {
  const name = checkText(form.get('name'), 'the business name', { max: 120, min: 2, required: true })
  if (!name.ok) return { ok: false, field: 'name', message: name.message }

  const category = text(form, 'category')
  if (!SERVICE_CATEGORY_KEYS.includes(category as (typeof SERVICE_CATEGORY_KEYS)[number])) {
    return { ok: false, field: 'category', message: 'Choose the kind of service you offer.' }
  }

  const city = checkText(form.get('city'), 'your city', { max: 80, min: 2, required: true })
  if (!city.ok) return { ok: false, field: 'city', message: city.message }
  const area = checkText(form.get('area'), 'the area', { max: 120 })
  if (!area.ok) return { ok: false, field: 'area', message: area.message }
  const street = checkText(form.get('street'), 'the street address', { max: 200 })
  if (!street.ok) return { ok: false, field: 'street', message: street.message }

  const description = checkText(form.get('description'), 'a description', { max: 1000, required: true })
  if (!description.ok) return { ok: false, field: 'description', message: description.message }
  if (description.value.length < 20) {
    return {
      ok: false,
      field: 'description',
      message: 'A sentence or two about what you do — at least 20 characters.',
    }
  }

  const phone = checkPhone(form.get('phone'))
  if (!phone.ok) return { ok: false, field: 'phone', message: phone.message }
  const rawEmail = text(form, 'email')
  const email = rawEmail ? checkEmail(rawEmail) : null
  if (email && !email.ok) return { ok: false, field: 'email', message: email.message }
  if (!phone.value && !email) {
    return { ok: false, field: 'phone', message: 'Leave a phone number or an email so we can reach you.' }
  }

  const website = checkWebsite(form.get('website'))
  if (!website.ok) return { ok: false, field: 'website', message: website.message }

  const lat = Number(text(form, 'lat'))
  const lng = Number(text(form, 'lng'))
  if (!text(form, 'lat') || !text(form, 'lng') || !isInPakistan(lat, lng)) {
    return {
      ok: false,
      field: 'location',
      message: 'Set your location on the map — it has to be inside Pakistan.',
    }
  }

  const limit = await checkLimits([
    { key: `service-apply:ip:${clientFingerprint()}`, limit: APPLICATIONS_PER_HOUR, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many applications') }
  }

  // One pending application per name and city. Submitting twice is far more
  // often an impatient second click than a second branch, and a duplicate in
  // the queue costs the reviewer time rather than the applicant anything.
  const existing = await prisma.eVService.findFirst({
    where: {
      name: { equals: name.value, mode: 'insensitive' },
      city: { equals: city.value, mode: 'insensitive' },
      status: 'pending',
    },
    select: { id: true },
  })
  if (existing) {
    return { ok: true, message: 'We already have your application, and it is waiting to be reviewed.' }
  }

  await prisma.eVService.create({
    data: {
      id: randomUUID(),
      slug: await uniqueSlug(name.value),
      name: name.value,
      category,
      description: description.value,
      street: street.value,
      area: area.value,
      city: city.value,
      province: '',
      country: 'Pakistan',
      lat,
      lng,
      // The column is required; an email-only applicant has no phone to store.
      phone: phone.value ?? '',
      email: email && email.ok ? email.value : null,
      website: website.value,
      status: 'pending',
      submittedAt: new Date(),
    },
  })

  // The admin badge and the services queue both count pending rows.
  revalidatePath('/admin/services')
  revalidatePath('/admin')

  return { ok: true }
}

/**
 * Approves or rejects an application.
 *
 * Approving is what publishes it, so this revalidates the public directory as
 * well as the admin screens — otherwise the reviewer approves a listing and it
 * does not appear until the cache expires, which reads as the button not
 * working.
 *
 * Approval is refused while the listing has no real pin (0,0, or anywhere
 * outside Pakistan): published, it would give drivers directions to nowhere.
 * Like the business actions, an expired session or a vanished row is a
 * message, not a thrown error, and every decision is written to the audit log.
 */
export async function reviewServiceApplication(
  id: string,
  status: 'approved' | 'rejected',
  note?: string | null,
): Promise<ApplyResult> {
  const actor = await getAdminActor()
  if (!actor) {
    return { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
  }
  if (status !== 'approved' && status !== 'rejected') {
    return { ok: false, message: 'Unknown review outcome.' }
  }

  const row = await prisma.eVService.findUnique({
    where: { id },
    select: { id: true, name: true, lat: true, lng: true },
  })
  if (!row) return { ok: false, message: 'That application no longer exists.' }

  if (status === 'approved' && !isInPakistan(row.lat, row.lng)) {
    return {
      ok: false,
      message: 'This listing has no map pin inside Pakistan. Set its coordinates before approving it.',
    }
  }

  const reviewNote = (typeof note === 'string' ? note.trim().slice(0, 500) : '') || null

  await prisma.eVService.update({
    where: { id },
    data: { status, reviewNote },
  })

  await logAdminAction(
    actor,
    status === 'approved' ? 'service.approve' : 'service.reject',
    'service',
    id,
    `${row.name}${reviewNote ? ` — ${reviewNote}` : ''}`,
  )

  revalidatePath('/admin/services')
  revalidatePath('/admin')
  revalidatePath('/services')
  revalidatePath('/', 'layout')

  return { ok: true }
}
