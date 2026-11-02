// src/app/api/business-documents/[id]/route.ts
import { getAdminActor } from '@/lib/db/admin-access'
import { prisma } from '@/lib/db/client'
import { getSessionUserId } from '@/lib/db/session'

/**
 * One identity or payment document, to an operator or the listing's owner.
 *
 * These are a person's CNIC and a bank receipt, so nothing about them is
 * public: no Blob URL, no caching, and a 404 — not a 403 — for anyone else, so
 * a stranger cannot even learn that an id exists. Images open in the browser
 * under a sandbox policy; a PDF is downloaded rather than opened, so a crafted
 * one never renders inside this origin.
 */

export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId || typeof params.id !== 'string' || params.id.length > 64) return NOT_FOUND()

  const document = await prisma.businessDocument.findUnique({
    where: { id: params.id },
    select: { kind: true, mimeType: true, bytes: true, business: { select: { userId: true } } },
  })
  if (!document) return NOT_FOUND()

  const isOwner = document.business.userId === userId
  if (!isOwner && !(await getAdminActor())) return NOT_FOUND()

  const isPdf = document.mimeType === 'application/pdf'
  return new Response(new Uint8Array(document.bytes), {
    headers: {
      'Content-Type': document.mimeType,
      'Content-Disposition': `${isPdf ? 'attachment' : 'inline'}; filename="${document.kind}.${isPdf ? 'pdf' : 'webp'}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
