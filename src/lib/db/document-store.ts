// src/lib/db/document-store.ts
import 'server-only'

import { ACCEPTED_FORMATS } from '@/lib/upload-urls'
import { acceptsPdf, DOCUMENT_MAX_BYTES, type DocumentKind } from '@/lib/listing-application'

import { toWebp } from './upload-store'

/**
 * Reads an identity or payment document from a form, ready to store privately.
 *
 * Photos go through the same encoder as charger photos — turned upright,
 * stripped of metadata (a phone's GPS tag included), re-encoded to WebP — but
 * kept larger, since a reviewer has to read the small print on a CNIC. A PDF
 * is accepted only where certificates usually arrive as one, and only if its
 * bytes really start like a PDF; what the browser claims the file is decides
 * nothing.
 */

/** Long edge of a stored scan. A CNIC's printed number stays legible. */
const SCAN_MAX_SIDE = 2400

export type ReadDocument =
  | { ok: true; mimeType: 'image/webp' | 'application/pdf'; bytes: Buffer }
  | { ok: false; message: string }

const PDF_MAGIC = Buffer.from('%PDF-')

export async function readDocument(kind: DocumentKind, form: FormData): Promise<ReadDocument> {
  return readPrivateFile(form.get('file'), { allowPdf: acceptsPdf(kind) })
}

/**
 * The same checks for any privately stored file — identity scans, payout QR
 * codes, booking receipts. `allowPdf` is off where only a picture makes sense
 * (a QR code has to be scannable on screen).
 */
export async function readPrivateFile(
  file: FormDataEntryValue | null,
  { allowPdf }: { allowPdf: boolean },
): Promise<ReadDocument> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Choose a file to upload.' }
  if (file.size > DOCUMENT_MAX_BYTES) return { ok: false, message: 'Files must be 4MB or smaller.' }

  const input = Buffer.from(await file.arrayBuffer())

  if (input.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    if (!allowPdf) return { ok: false, message: `Upload a picture — a ${ACCEPTED_FORMATS} image.` }
    return { ok: true, mimeType: 'application/pdf', bytes: input }
  }

  const encoded = await toWebp(new Uint8Array(input), SCAN_MAX_SIDE)
  if (!encoded.ok) {
    return { ok: false, message: allowPdf ? encoded.message.replace(' file.', ' file, or a PDF.') : encoded.message }
  }
  return { ok: true, mimeType: 'image/webp', bytes: encoded.bytes }
}
