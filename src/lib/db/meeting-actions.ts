// src/lib/db/meeting-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { checkEmail, checkPhone, checkText } from '@/lib/validate'

import { assertAdmin } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'
import { checkLimits, clientFingerprint, retryMessage } from './rate-limit'

/**
 * Meeting requests from businesses.
 *
 * This replaces the published subscription tiers. Terms are now discussed
 * rather than listed, which means the request has to be stored — an email
 * link would leave no record, no status and nothing to work through.
 *
 * Creating a request is deliberately public: a business should not need an
 * account to ask for a conversation. Reading and updating them is not, and
 * each of those re-checks the admin session for the same reason the other
 * actions do — a Server Action is a POST endpoint reachable by anything that
 * learns its URL.
 *
 * Being public is also why requestMeeting is rate limited and every field is
 * capped here rather than only in the browser: an unauthenticated endpoint
 * that writes a row per call is the cheapest way to fill an operator's inbox
 * with junk, and maxlength on an input stops nobody who calls the action
 * directly.
 */

export interface MeetingResult {
  ok: boolean
  message?: string
}

/** The statuses the admin list knows how to show. Anything else is refused. */
const STATUSES = ['new', 'handled'] as const
type MeetingStatus = (typeof STATUSES)[number]

/** Per IP: plenty for a business asking twice, nothing for a script. */
const REQUEST_LIMIT = { limit: 5, windowSeconds: 60 * 60 }

export async function requestMeeting(form: FormData): Promise<MeetingResult> {
  const name = checkText(form.get('name'), 'your name', { max: 120, required: true })
  if (!name.ok) return name
  const company = checkText(form.get('company'), 'your business name', { max: 160, required: true })
  if (!company.ok) return company
  const email = checkEmail(form.get('email'))
  if (!email.ok) return email
  const phone = checkPhone(form.get('phone'))
  if (!phone.ok) return phone
  const preferredDate = checkText(form.get('preferredDate'), 'the preferred date', { max: 20 })
  if (!preferredDate.ok) return preferredDate
  const preferredTime = checkText(form.get('preferredTime'), 'the preferred time', { max: 20 })
  if (!preferredTime.ok) return preferredTime
  const note = checkText(form.get('note'), 'the note', { max: 2_000 })
  if (!note.ok) return note

  // Checked after validation, so a typo in the email does not use up one of
  // the five tries.
  const limit = await checkLimits([
    { key: `meeting:ip:${clientFingerprint()}`, ...REQUEST_LIMIT },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many requests') }
  }

  await prisma.meetingRequest.create({
    data: {
      id: randomUUID(),
      name: name.value,
      company: company.value,
      email: email.value,
      phone: phone.value,
      preferredDate: preferredDate.value || null,
      preferredTime: preferredTime.value || null,
      note: note.value || null,
    },
  })

  revalidatePath('/admin/meetings')
  return { ok: true }
}

export async function setMeetingStatus(id: string, status: MeetingStatus): Promise<MeetingResult> {
  const actor = await assertAdmin()

  // The type says 'new' | 'handled', but a server action's arguments arrive
  // from the network and the type is not checked there.
  if (!STATUSES.includes(status)) return { ok: false, message: 'Unknown status.' }

  // updateMany rather than update: a request deleted in another tab is a
  // message for the operator, not an exception that blanks the admin page.
  const { count } = await prisma.meetingRequest.updateMany({ where: { id }, data: { status } })
  if (count === 0) return { ok: false, message: 'That request no longer exists.' }

  await logAdminAction(actor, 'meeting.status', 'meeting', id, `Marked ${status}`)
  revalidatePath('/admin/meetings')
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteMeeting(id: string): Promise<MeetingResult> {
  const actor = await assertAdmin()

  const row = await prisma.meetingRequest.findUnique({
    where: { id },
    select: { company: true, email: true },
  })
  if (!row) return { ok: false, message: 'That request no longer exists.' }

  await prisma.meetingRequest.deleteMany({ where: { id } })
  await logAdminAction(actor, 'meeting.delete', 'meeting', id, `Deleted request from ${row.company} <${row.email}>`)
  revalidatePath('/admin/meetings')
  revalidatePath('/admin')
  return { ok: true }
}
