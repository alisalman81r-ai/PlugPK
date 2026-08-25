// src/lib/db/car-candidate-actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

import { prisma } from './client'
import { reviewCandidate, setSourceSchedule } from './car-source-store'

/**
 * Server actions for new-car candidates and source cadence.
 *
 * Each action verifies the session itself. The admin layout guards *pages*, and
 * an action is a POST endpoint that exists independently of the page that
 * rendered its form — relying on the layout would leave these callable by anyone
 * who read the client bundle and replayed the request.
 *
 * ── What approving a candidate does, and does not, do ─────────────────
 *
 * It marks the candidate as worth adding. It does not create a Car. The car is
 * then created through the ordinary admin form, with its slug, its images, its
 * Pakistan pricing and its description written by a person — because a crawler
 * that can create catalogue entries out of a name it failed to match is the one
 * failure mode this whole pipeline exists to prevent.
 */

export interface CandidateResult {
  ok: boolean
  message: string
}

const DENIED: CandidateResult = { ok: false, message: 'Not signed in.' }

async function requireAdmin(): Promise<boolean> {
  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

const UPDATES_PAGE = '/admin/cars/updates'

export async function approveCandidate(id: string, note?: string): Promise<CandidateResult> {
  if (!(await requireAdmin())) return DENIED

  const candidate = await prisma.carCandidate.findUnique({ where: { id } })
  if (!candidate) return { ok: false, message: 'That candidate no longer exists.' }

  await reviewCandidate(id, 'approved', note ?? null)
  revalidatePath(UPDATES_PAGE)

  return {
    ok: true,
    message: `Marked ${candidate.brand} ${candidate.model} as worth adding. Create it from Cars → Add car — nothing has been published.`,
  }
}

export async function rejectCandidate(id: string, note?: string): Promise<CandidateResult> {
  if (!(await requireAdmin())) return DENIED

  await reviewCandidate(id, 'rejected', note ?? null)
  revalidatePath(UPDATES_PAGE)

  /*
    A rejection is permanent for as long as nobody reopens it.

    Tomorrow's crawl will see the same car again and find this row already
    judged; it refreshes the data and leaves the verdict alone. Without that, a
    car we have deliberately decided not to list — because it is not sold in
    Pakistan — would arrive in the queue every single morning.
  */
  return { ok: true, message: 'Rejected. It will not come back tomorrow.' }
}

export async function mergeCandidate(id: string, carSlug: string): Promise<CandidateResult> {
  if (!(await requireAdmin())) return DENIED

  const slug = carSlug.trim()
  if (!slug) return { ok: false, message: 'Name the car this should merge into.' }

  const car = await prisma.car.findUnique({ where: { slug }, select: { slug: true, fullName: true } })
  if (!car) return { ok: false, message: `No car has the slug "${slug}".` }

  await reviewCandidate(id, 'merged', `merged into ${car.slug}`, car.slug)
  revalidatePath(UPDATES_PAGE)

  /*
    Merging records a judgement; it moves no data.

    The candidate's figures do not flow into the car it was merged with, because
    that would be exactly the automatic merge the matcher refused to make — the
    reason this row exists is that the identity was uncertain. Recording the
    decision means the same record matches next time, through the review queue,
    where each field is approved individually.
  */
  return {
    ok: true,
    message: `Recorded as the same car as ${car.fullName}. No specification was copied — its fields come through the review queue.`,
  }
}

/**
 * Changes how often a source is visited.
 *
 * Deliberately its own action rather than part of a general source editor. How
 * often we request somebody else's pages is a decision about their bandwidth and
 * their terms, and it should never change as a side effect of editing a name.
 */
export async function updateSourceSchedule(
  sourceId: string,
  schedule: string,
  staleAfterDays?: number,
): Promise<CandidateResult> {
  if (!(await requireAdmin())) return DENIED

  const allowed = new Set(['daily', 'every-3-days', 'weekly', 'monthly', 'manual'])
  if (!allowed.has(schedule)) return { ok: false, message: `"${schedule}" is not a cadence.` }

  await setSourceSchedule(sourceId, schedule, staleAfterDays)
  revalidatePath(UPDATES_PAGE)
  revalidatePath('/admin/cars/sources')

  return { ok: true, message: `${sourceId} is now set to ${schedule}.` }
}
