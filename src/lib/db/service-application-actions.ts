// src/lib/db/service-application-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { SERVICE_CATEGORY_KEYS } from '@/lib/constants'
import { prisma } from './client'

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

/** Trimmed, and empty-to-null so a blank optional field is not stored as "". */
function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim()
}

function optional(form: FormData, key: string): string | null {
  const value = text(form, key)
  return value.length > 0 ? value : null
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
 * Validation is deliberately shallow: name, category, city and one way to make
 * contact. Asking an applicant for coordinates or opening hours before anybody
 * has agreed to list them is how a form gets abandoned, and the admin can fill
 * the rest in while reviewing. The category is checked against the real list
 * because it decides which page the listing appears on.
 */
export async function applyToListService(form: FormData): Promise<ApplyResult> {
  const name = text(form, 'name')
  const category = text(form, 'category')
  const city = text(form, 'city')
  const description = text(form, 'description')
  const phone = text(form, 'phone')
  const email = optional(form, 'email')

  if (name.length < 2) return { ok: false, field: 'name', message: 'Tell us the business name.' }
  if (!SERVICE_CATEGORY_KEYS.includes(category as (typeof SERVICE_CATEGORY_KEYS)[number])) {
    return { ok: false, field: 'category', message: 'Choose the kind of service you offer.' }
  }
  if (city.length < 2) return { ok: false, field: 'city', message: 'Which city are you in?' }
  if (description.length < 20) {
    return {
      ok: false,
      field: 'description',
      message: 'A sentence or two about what you do — at least 20 characters.',
    }
  }
  if (phone.length < 7 && !email) {
    return { ok: false, field: 'phone', message: 'Leave a phone number or an email so we can reach you.' }
  }

  // One pending application per name and city. Submitting twice is far more
  // often an impatient second click than a second branch, and a duplicate in
  // the queue costs the reviewer time rather than the applicant anything.
  const existing = await prisma.eVService.findFirst({
    where: { name, city, status: 'pending' },
    select: { id: true },
  })
  if (existing) {
    return { ok: true, message: 'We already have your application — we will be in touch.' }
  }

  await prisma.eVService.create({
    data: {
      id: randomUUID(),
      slug: await uniqueSlug(name),
      name,
      category,
      description,
      // The applicant gives a city; the rest of the address and the map pin are
      // filled in by the reviewer, who can check them.
      street: text(form, 'street') || '',
      area: text(form, 'area') || '',
      city,
      province: '',
      country: 'Pakistan',
      lat: 0,
      lng: 0,
      phone,
      email,
      website: optional(form, 'website'),
      status: 'pending',
      submittedAt: new Date(),
    },
  })

  // The admin badge and the services queue both count pending rows.
  revalidatePath('/admin/services')
  revalidatePath('/admin')

  return { ok: true }
}

/** Guards the review actions. Same check the upload actions use. */
async function isAdmin(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  const { ADMIN_COOKIE_NAME, verifySessionValue } = await import('@/lib/admin-auth')
  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

/**
 * Approves or rejects an application.
 *
 * Approving is what publishes it, so this revalidates the public directory as
 * well as the admin screens — otherwise the reviewer approves a listing and it
 * does not appear until the cache expires, which reads as the button not
 * working.
 */
export async function reviewServiceApplication(
  id: string,
  status: 'approved' | 'rejected',
  note?: string | null,
): Promise<ApplyResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
  }
  if (status !== 'approved' && status !== 'rejected') {
    return { ok: false, message: 'Unknown review outcome.' }
  }

  const row = await prisma.eVService.findUnique({ where: { id }, select: { id: true } })
  if (!row) return { ok: false, message: 'That application no longer exists.' }

  await prisma.eVService.update({
    where: { id },
    data: { status, reviewNote: note?.trim() || null },
  })

  revalidatePath('/admin/services')
  revalidatePath('/admin')
  revalidatePath('/services')
  revalidatePath('/', 'layout')

  return { ok: true }
}
