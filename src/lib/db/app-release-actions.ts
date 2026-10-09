// src/lib/db/app-release-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { checkText } from '@/lib/validate'

import { assertAdmin, type AdminActor } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'

/**
 * The mobile app's release log: what each update changed, and when it was sent
 * to users. "Send" stamps sentAt; from then on the app shows the note once to
 * every user as "What's new" (public/app-prototype/sync.js). Editing a sent
 * update changes the note for anyone who has not opened it yet.
 */

export interface ReleaseResult {
  ok: boolean
  message?: string
}

const DENIED: ReleaseResult = { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
const PATH = '/admin/app/releases'

async function actor(): Promise<AdminActor | null> {
  try {
    return await assertAdmin()
  } catch {
    return null
  }
}

function fields(form: FormData) {
  const version = checkText(form.get('version'), 'the version', { max: 20, required: true })
  if (!version.ok) return version
  const title = checkText(form.get('title'), 'a title', { max: 120, required: true })
  if (!title.ok) return title
  const notes = checkText(form.get('notes'), 'the notes', { max: 2_000, required: true })
  if (!notes.ok) return notes
  return { ok: true as const, value: { version: version.value, title: title.value, notes: notes.value } }
}

export async function createRelease(form: FormData): Promise<ReleaseResult> {
  const admin = await actor()
  if (!admin) return DENIED
  const input = fields(form)
  if (!input.ok) return input
  const sendNow = form.get('send') === 'now'

  try {
    const id = randomUUID()
    await prisma.appRelease.create({
      data: { id, ...input.value, createdBy: admin.email, sentAt: sendNow ? new Date() : null },
    })
    await logAdminAction(admin, sendNow ? 'app-release.send' : 'app-release.create', 'app-release', id, `${input.value.version} — ${input.value.title}`)
    revalidatePath(PATH)
    revalidatePath('/admin/app')
    return { ok: true, message: sendNow ? 'Update sent. Users see it next time they open the app.' : 'Draft saved.' }
  } catch (error) {
    console.error('[admin] createRelease failed', error)
    return { ok: false, message: 'Something went wrong saving that. Nothing was changed; try again.' }
  }
}

export async function updateRelease(id: string, form: FormData): Promise<ReleaseResult> {
  const admin = await actor()
  if (!admin) return DENIED
  const input = fields(form)
  if (!input.ok) return input
  try {
    await prisma.appRelease.update({ where: { id }, data: input.value })
    await logAdminAction(admin, 'app-release.update', 'app-release', id, `${input.value.version} — ${input.value.title}`)
    revalidatePath(PATH)
    return { ok: true, message: 'Saved.' }
  } catch (error) {
    console.error('[admin] updateRelease failed', error)
    return { ok: false, message: 'That update could not be saved. It may have been deleted; reload the page.' }
  }
}

export async function sendRelease(id: string): Promise<ReleaseResult> {
  const admin = await actor()
  if (!admin) return DENIED
  try {
    const release = await prisma.appRelease.update({ where: { id }, data: { sentAt: new Date() } })
    await logAdminAction(admin, 'app-release.send', 'app-release', id, `${release.version} — ${release.title}`)
    revalidatePath(PATH)
    revalidatePath('/admin/app')
    return { ok: true, message: 'Sent. Users see it next time they open the app.' }
  } catch (error) {
    console.error('[admin] sendRelease failed', error)
    return { ok: false, message: 'That update could not be sent. Reload the page and try again.' }
  }
}

export async function deleteRelease(id: string): Promise<ReleaseResult> {
  const admin = await actor()
  if (!admin) return DENIED
  try {
    const release = await prisma.appRelease.delete({ where: { id } })
    await logAdminAction(admin, 'app-release.delete', 'app-release', id, `${release.version} — ${release.title}`)
    revalidatePath(PATH)
    revalidatePath('/admin/app')
    return { ok: true, message: 'Deleted.' }
  } catch (error) {
    console.error('[admin] deleteRelease failed', error)
    return { ok: false, message: 'That update could not be deleted. It may already be gone; reload the page.' }
  }
}
