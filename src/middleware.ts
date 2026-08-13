// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

/**
 * The outer admin gate.
 *
 * Middleware runs on the Edge runtime, which has no node:crypto, so this
 * cannot verify the session signature — that happens in the admin layout on
 * the Node runtime. The split is deliberate rather than a limitation:
 *
 *   here    does /admin exist at all?   (env flag, no secrets involved)
 *   layout  is this session genuine?    (HMAC verification)
 *
 * Rewriting to /404 rather than redirecting matters. A redirect to a login
 * page would confirm the portal exists; a 404 makes an admin build
 * indistinguishable from one where the routes were never compiled.
 */
export function middleware(request: NextRequest) {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.rewrite(new URL('/404', request.url), { status: 404 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
