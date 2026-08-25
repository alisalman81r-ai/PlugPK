// src/lib/db/car-review-actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

import {
  applyChange,
  applyMany,
  rejectChange,
  reviewImageCandidate,
} from './car-review-store'

/**
 * Server actions for the review queue.
 *
 * ── Every action checks the session itself ────────────────────────────
 *
 * The admin layout's guard protects *pages*, not server actions. An action is a
 * POST endpoint that exists independently of the page that rendered its form, so
 * relying on the layout would leave the whole catalogue writable by anyone who
 * read the client bundle and replayed the request. The same reasoning as
 * car-actions.ts, and the same pattern.
 *
 * ── Revalidation is targeted ──────────────────────────────────────────
 *
 * `applyChange` returns the paths its change actually affects, and only those
 * are revalidated. A bulk approval of forty rows collects the union and
 * revalidates once per distinct path rather than forty times per path.
 */

export interface ReviewResult {
  ok: boolean
  message: string
}

const DENIED: ReviewResult = { ok: false, message: 'Not signed in.' }

async function requireAdmin(): Promise<boolean> {
  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

/**
 * Who approved it.
 *
 * The portal is a single shared credential, so there is no per-user identity to
 * record — "admin" is the honest answer rather than inventing a name. If the
 * portal ever gains real accounts, this is the one place that changes, and the
 * history rows written before then remain truthful about what was known.
 */
const APPROVER = 'admin'

export async function approveFieldChange(
  changeId: string,
  note?: string,
): Promise<ReviewResult> {
  if (!(await requireAdmin())) return DENIED

  const result = await applyChange(changeId, APPROVER, note)
  if (!result.ok) return { ok: false, message: result.message }

  for (const path of result.revalidate ?? []) revalidatePath(path)
  // The admin queue itself, so the approved row leaves the list.
  revalidatePath('/admin/cars/review')

  return { ok: true, message: result.message }
}

export async function rejectFieldChange(
  changeId: string,
  note?: string,
): Promise<ReviewResult> {
  if (!(await requireAdmin())) return DENIED

  await rejectChange(changeId, APPROVER, note)
  /*
    Only the queue is revalidated. A rejection changes nothing a visitor can see,
    and revalidating the public pages would be pure cost.
  */
  revalidatePath('/admin/cars/review')

  return { ok: true, message: 'Rejected. The source record is kept.' }
}

/**
 * Approves several proposals.
 *
 * The store refuses anything high-risk or conflicting even when it is passed
 * here, so a selection that includes one comes back partially applied with the
 * reason — rather than the caller having to be trusted to filter correctly.
 */
export async function approveFieldChanges(changeIds: string[]): Promise<ReviewResult> {
  if (!(await requireAdmin())) return DENIED
  if (changeIds.length === 0) return { ok: false, message: 'Nothing selected.' }

  const { applied, refused, revalidate } = await applyMany(changeIds, APPROVER)

  for (const path of revalidate) revalidatePath(path)
  revalidatePath('/admin/cars/review')

  if (refused.length === 0) {
    return { ok: true, message: `Applied ${applied.length} change(s).` }
  }

  return {
    ok: applied.length > 0,
    message:
      `Applied ${applied.length}, refused ${refused.length}. ` +
      refused.map((entry) => entry.reason).slice(0, 3).join('; '),
  }
}

export async function rejectFieldChanges(changeIds: string[]): Promise<ReviewResult> {
  if (!(await requireAdmin())) return DENIED
  if (changeIds.length === 0) return { ok: false, message: 'Nothing selected.' }

  for (const id of changeIds) await rejectChange(id, APPROVER, 'rejected in bulk')
  revalidatePath('/admin/cars/review')

  return { ok: true, message: `Rejected ${changeIds.length} change(s).` }
}

export async function reviewImage(
  id: string,
  status: 'approved' | 'rejected',
  note?: string,
): Promise<ReviewResult> {
  if (!(await requireAdmin())) return DENIED

  const result = await reviewImageCandidate(id, status, note)
  revalidatePath('/admin/cars/sources')

  /*
    No public path is revalidated, even on approval — approving an image
    candidate does not change Car.image. A person still has to place the file
    somewhere the licence permits, and pretending otherwise would make the
    catalogue look updated when it is not.
  */
  return result
}
