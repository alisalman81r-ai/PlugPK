// src/lib/db/upload-actions.ts
'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { prisma } from './client'
import { getCurrentUser } from './session-actions'

/**
 * Photos of the chargers on a listing.
 *
 * Files are written under public/uploads and the listing stores the path. That
 * suits how this application already runs — a SQLite file beside the app — and
 * keeps images out of the database, where a few megabytes of base64 per charger
 * would bloat every query that touches the row. It does mean the directory has
 * to survive a deploy; on a host with an ephemeral filesystem this needs to
 * become object storage, and only this file changes.
 */

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chargers')
const PUBLIC_PREFIX = '/uploads/chargers/'
const MAX_BYTES = 5 * 1024 * 1024

export interface UploadResult {
  ok: boolean
  url?: string
  message?: string
}

/**
 * The declared MIME type is chosen by whoever is posting, so the file's own
 * first bytes are checked instead. This is what stops a script being uploaded
 * with `image/png` written on the envelope.
 */
function sniff(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length < 12) return null


  // Read through a helper so the length check above satisfies the compiler as
  // well as the reader — indexing a Uint8Array is typed as possibly undefined.
  const at = (index: number): number => bytes[index] ?? 0

  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'jpg'

  if (
    at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 &&
    at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a
  ) {
    return 'png'
  }

  const text = (from: number): string =>
    String.fromCharCode(at(from), at(from + 1), at(from + 2), at(from + 3))

  if (text(0) === 'RIFF' && text(8) === 'WEBP') return 'webp'

  return null
}

/** Confirms the listing belongs to the signed-in account. */
async function ownsListing(businessId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { userId: true },
  })
  return business?.userId === user.id
}

export async function uploadChargerPhoto(
  businessId: string,
  form: FormData,
): Promise<UploadResult> {
  if (!(await ownsListing(businessId))) {
    return { ok: false, message: 'That listing is not yours to edit.' }
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choose an image to upload.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'Images must be 5MB or smaller.' }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniff(bytes)
  if (!kind) {
    return { ok: false, message: 'That file is not a JPEG, PNG or WebP image.' }
  }

  // The name is generated here and the client's is discarded entirely: a
  // filename from a form is attacker-chosen text, and one containing ../ is
  // the classic way an upload lands somewhere it should not.
  const name = `${randomUUID()}.${kind}`

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, name), bytes)

  return { ok: true, url: `${PUBLIC_PREFIX}${name}` }
}

/**
 * Removes an uploaded photo from disk.
 *
 * The path is rebuilt from its last segment and checked to be inside the upload
 * directory before anything is unlinked, so a crafted value cannot reach a file
 * elsewhere on the machine.
 */
export async function deleteChargerPhoto(
  businessId: string,
  url: string,
): Promise<UploadResult> {
  if (!(await ownsListing(businessId))) {
    return { ok: false, message: 'That listing is not yours to edit.' }
  }
  if (!url.startsWith(PUBLIC_PREFIX)) {
    return { ok: false, message: 'That is not an uploaded charger photo.' }
  }

  const name = url.slice(PUBLIC_PREFIX.length)
  const target = resolve(UPLOAD_DIR, name)
  if (!target.startsWith(resolve(UPLOAD_DIR) + sep)) {
    return { ok: false, message: 'That is not an uploaded charger photo.' }
  }

  try {
    await unlink(target)
  } catch {
    // Already gone is the desired end state, so it is not reported as failure.
  }

  return { ok: true }
}
