// src/app/api/admin/signout/route.ts
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

/**
 * POST only. Sign-out mutates server state, and a GET that mutates would be
 * triggered by any link prefetcher or crawler that touched the URL.
 */
export async function POST(request: NextRequest) {
  cookies().delete(ADMIN_COOKIE_NAME)
  return NextResponse.redirect(new URL('/admin/login', request.url), {
    // 303 so the browser follows with GET rather than repeating the POST.
    status: 303,
  })
}
