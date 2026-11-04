// src/app/api/community/me/route.ts

import { NextResponse } from 'next/server'

import { getMyCommunityCounts } from '@/lib/db/community-queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * The signed-in member's community counts, for the "My profile" bar on
 * /community. That page is cached and shared, so the bar asks here after it
 * mounts; a guest gets `{ user: null }` and sees no bar. Per-visitor, so never
 * cached.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } })
  const counts = await getMyCommunityCounts(profile.id)
  return NextResponse.json(
    { user: { name: profile.name, avatar: profile.avatar ?? null, vehicle: profile.vehicle ?? null }, counts },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
