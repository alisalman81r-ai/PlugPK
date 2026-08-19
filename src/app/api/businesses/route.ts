// src/app/api/businesses/route.ts
import { NextResponse } from 'next/server'

import { businessToStation } from '@/lib/db/business-to-station'
import { getBusinessRatings, getMappableBusinesses } from '@/lib/db/queries'
import type { Station } from '@/lib/types'

/**
 * Approved businesses, shaped as Stations for the map.
 *
 * A route rather than a prop because /map is a client component driven by
 * useStations, and threading server data down through it would mean
 * rewriting the whole explorer. Mapping to Station here means the pins,
 * filters, preview card and list all work on these without knowing they came
 * from a different table.
 *
 * Only approved records with coordinates are returned — that filtering
 * happens in the query, so an unreviewed submission cannot reach this
 * endpoint even if someone calls it directly.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const businesses = await getMappableBusinesses()
  // Ratings for every listing in one query rather than one per business, so
  // the feed does not slow down linearly as listings are added.
  const ratings = await getBusinessRatings(businesses.map((business) => business.id))

  const stations: Station[] = businesses.map((business) =>
    businessToStation(business, ratings[business.id]),
  )

  return NextResponse.json({ stations })
}
