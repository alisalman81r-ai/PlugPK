// src/app/api/payout-qr/[id]/route.ts
import { getAdminActor } from '@/lib/db/admin-access'
import { prisma } from '@/lib/db/client'
import { getSessionUserId } from '@/lib/db/session'

/**
 * A host's payment QR code. Public while the listing is live, because a driver
 * booking a slot has to scan it; before that, only the owner and operators
 * can see it. Never cached by a shared cache, so a replaced QR is never served
 * stale to someone about to pay.
 */

export const dynamic = 'force-dynamic'

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (typeof params.id !== 'string' || params.id.length > 64) return NOT_FOUND()

  const account = await prisma.payoutAccount.findUnique({
    where: { id: params.id },
    select: { qrMime: true, qrBytes: true, business: { select: { status: true, userId: true } } },
  })
  if (!account?.qrMime || !account.qrBytes) return NOT_FOUND()

  if (account.business.status !== 'approved') {
    const userId = await getSessionUserId()
    const allowed = (userId && userId === account.business.userId) || (await getAdminActor())
    if (!allowed) return NOT_FOUND()
  }

  return new Response(new Uint8Array(account.qrBytes), {
    headers: {
      'Content-Type': account.qrMime,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
