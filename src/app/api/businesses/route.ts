// src/app/api/businesses/route.ts
import { NextResponse } from 'next/server'

import { readOrFallback } from '@/lib/db/availability'
import { businessToStation } from '@/lib/db/business-to-station'
import { getBusinessRatings, getMappableBusinesses } from '@/lib/db/queries'
import type { Station } from '@/lib/types'

/**
 * Approved businesses, shaped as Stations.
 *
 * The map no longer calls this — /map is a Server Component now and reads the
 * same listings through getMapStations — but the endpoint is public and kept
 * working for anything else that reads it.
 *
 * Only approved records with coordinates are returned — that filtering
 * happens in the query, so an unreviewed submission cannot reach this
 * endpoint even if someone calls it directly. The owner's name and email are
 * not even selected (see getMappableBusinesses).
 *
 * ── Cached, not force-dynamic ─────────────────────────────────────────
 *
 * It was `force-dynamic`, so every call was a fresh round trip to the
 * database. Nothing in the response depends on who asks, so it is rendered
 * statically and refreshed every five minutes, the same window the map page
 * uses — an approval shows up here on the same timetable as there.
 */
export const revalidate = 300

export async function GET() {
  // Through the same guard as the pages: this is prerendered at build time,
  // and a build with no reachable database should ship an empty list (and
  // refresh it on the first revalidation) rather than fail.
  const businesses = await readOrFallback('/api/businesses', [], () => getMappableBusinesses())
  // Ratings for every listing in one query rather than one per business, so
  // the feed does not slow down linearly as listings are added.
  const ratings = await getBusinessRatings(businesses.map((business) => business.id))

  const stations: Station[] = businesses.map((business) =>
    businessToStation(business, ratings[business.id]),
  )

  return NextResponse.json({ stations })
}
