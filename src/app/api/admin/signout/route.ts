// src/app/api/admin/signout/route.ts
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import { USER_COOKIE_NAME } from '@/lib/user-auth'

/**
 * POST only. Sign-out mutates server state, and a GET that mutates would be
 * triggered by any link prefetcher or crawler that touched the URL.
 *
 * ── Both cookies, not just the admin one ─────────────────────────────
 *
 * This deleted ADMIN_COOKIE_NAME alone, which was correct while the portal
 * had exactly one way in. It no longer does: the layout authorises a user
 * session whose account carries isAdmin, so clearing only the shared-password
 * cookie left an operator signed in to the portal they had just signed out of.
 *
 * Clearing the account session too is the honest reading of the button. The
 * cost is that it also signs them out of the public site, which is the right
 * trade — a sign-out that leaves a session standing is the worse surprise.
 */
export async function POST(request: NextRequest) {
  cookies().delete(ADMIN_COOKIE_NAME)
  cookies().delete(USER_COOKIE_NAME)
  return NextResponse.redirect(new URL('/login', request.url), {
    // 303 so the browser follows with GET rather than repeating the POST.
    status: 303,
  })
}
