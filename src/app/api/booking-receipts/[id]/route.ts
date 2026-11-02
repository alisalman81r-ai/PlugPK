// src/app/api/booking-receipts/[id]/route.ts
import { getAdminActor } from '@/lib/db/admin-access'
import { prisma } from '@/lib/db/client'
import { getSessionUserId } from '@/lib/db/session'

/**
 * The receipt a driver attached to a booking — to that driver, the listing's
 * host, or an operator. A 404 for anyone else, so an id reveals nothing.
 * A PDF is downloaded rather than opened inside this origin.
 */

export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId || typeof params.id !== 'string' || params.id.length > 64) return NOT_FOUND()

  const booking = await prisma.chargerBooking.findUnique({
    where: { id: params.id },
    select: { userId: true, receiptMime: true, receiptBytes: true, business: { select: { userId: true } } },
  })
  if (!booking) return NOT_FOUND()
  // The driver, the partner who hosts the listing, or an operator — who also
  // hosts every station booking.
  const allowed = booking.userId === userId || booking.business?.userId === userId || (await getAdminActor())
  if (!allowed) return NOT_FOUND()

  const isPdf = booking.receiptMime === 'application/pdf'
  return new Response(new Uint8Array(booking.receiptBytes), {
    headers: {
      'Content-Type': booking.receiptMime,
      'Content-Disposition': `${isPdf ? 'attachment' : 'inline'}; filename="booking-receipt.${isPdf ? 'pdf' : 'webp'}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
