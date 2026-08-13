// src/lib/db/meeting-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

import { prisma } from './client'

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
 */

export interface MeetingResult {
  ok: boolean
  message?: string
}

export async function requestMeeting(form: FormData): Promise<MeetingResult> {
  const name = String(form.get('name') ?? '').trim()
  const company = String(form.get('company') ?? '').trim()
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!name) return { ok: false, message: 'Enter your name.' }
  if (!company) return { ok: false, message: 'Enter your company name.' }
  if (!email.includes('@')) return { ok: false, message: 'Enter a valid email address.' }

  await prisma.meetingRequest.create({
    data: {
      id: randomUUID(),
      name,
      company,
      email,
      phone: String(form.get('phone') ?? '').trim() || null,
      preferredDate: String(form.get('preferredDate') ?? '').trim() || null,
      preferredTime: String(form.get('preferredTime') ?? '').trim() || null,
      note: String(form.get('note') ?? '').trim() || null,
    },
  })

  revalidatePath('/admin/meetings')
  return { ok: true }
}

async function assertAdmin(): Promise<void> {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error('Not authorised')
  }
}

export async function setMeetingStatus(
  id: string,
  status: 'new' | 'handled',
): Promise<MeetingResult> {
  await assertAdmin()
  await prisma.meetingRequest.update({ where: { id }, data: { status } })
  revalidatePath('/admin/meetings')
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteMeeting(id: string): Promise<MeetingResult> {
  await assertAdmin()
  await prisma.meetingRequest.delete({ where: { id } })
  revalidatePath('/admin/meetings')
  revalidatePath('/admin')
  return { ok: true }
}
