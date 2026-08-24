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

  /*
    A known limitation, recorded here because it looks like a bug in the
    pages and is not.

    Because this matcher covers /admin, Next 14 loses the status from any
    notFound() under it: /admin/cars/nope and /admin/stations/nope serve the
    portal 404 page with a 200. Tried returning nothing here instead of
    next() — no difference; the matcher alone is enough to do it.

    Not worth the fix that would work. Moving the ENABLE_ADMIN check into the
    admin layout would drop the matcher and restore the status, but it would
    also mean page code runs before the flag is read — giving up the property
    this file exists for, that a disabled portal is indistinguishable from one
    that was never built. A wrong status code on a page a human reads is the
    cheaper of the two.

    (protected)/not-found.tsx at least makes the page itself right; before it,
    a mistyped admin URL rendered the public marketing 404 inside the portal.
  */
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
