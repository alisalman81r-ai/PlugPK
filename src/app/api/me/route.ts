// src/app/api/me/route.ts

import { NextResponse } from 'next/server'

import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Who is signed in, for the navbar.
 *
 * ── Why this exists ───────────────────────────────────────────────────
 *
 * The (main) layout used to await getCurrentProfile() so the header was
 * correct on first paint. Reading cookies in a layout opts the entire subtree
 * out of static rendering, and in Next 14 there is no partial escape: measured
 * on a production build, every page under (main) came back marked
 * `ƒ (server-rendered on demand)` — including the homepage, which asks for
 * `revalidate = 300` and could never have it. Every navigation therefore waited
 * on a server render that no cache was allowed to keep.
 *
 * Moving the read here takes cookies() out of the render path, so those pages
 * can be cached and served without one. The header fills in a moment later
 * instead of being right on the first frame — that flash is the price, and it
 * was chosen deliberately over making every page uncacheable to avoid it.
 *
 * ── Why it must never be cached ───────────────────────────────────────
 *
 * The response is per-visitor. force-dynamic and no-store keep it that way: a
 * cached answer here would be far worse than the flash it replaced, because it
 * would show one person's name and email to the next visitor.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await getCurrentProfile()

  const user = profile
    ? {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        /*
          So the header can send an operator to the portal rather than to the
          driver dashboard. It is a display hint and nothing more — every
          /admin page re-reads isAdmin from the database on its own request,
          so a forged value here changes a menu label and grants nothing.
        */
        isAdmin: profile.isAdmin,
      }
    : null

  return NextResponse.json(
    { user },
    { headers: { 'Cache-Control': 'no-store, private' } },
  )
}
