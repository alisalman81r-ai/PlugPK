// src/app/api/admin/signout/route.ts
import { NextResponse, type NextRequest } from 'next/server'

import { clearSession } from '@/lib/db/session'

/**
 * POST only. Sign-out mutates server state, and a GET that mutates would be
 * triggered by any link prefetcher or crawler that touched the URL.
 *
 * Clears the account session (which is what authorises the portal) and the
 * retired shared-password cookie, should an old browser still hold one.
 */
export async function POST(request: NextRequest) {
  clearSession()
  return NextResponse.redirect(new URL('/login', request.url), {
    // 303 so the browser follows with GET rather than repeating the POST.
    status: 303,
  })
}
