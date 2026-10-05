// src/app/(main)/map/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { MapExplorer } from '@/components/map/MapExplorer'
import { FaqSection } from '@/components/shared/FaqSection'
import { readOrFallback } from '@/lib/db/availability'
import { getMapStations } from '@/lib/db/queries'
import { MAP_FAQS } from '@/lib/faqs'

import MapLoading from './loading'

/**
 * The charging map, read from the database on the server.
 *
 * ── What this replaced ────────────────────────────────────────────────
 *
 * This page was a Client Component: no metadata, nothing for a crawler but an
 * empty canvas, and its stations came from MOCK_STATIONS compiled into the
 * bundle — six fixtures — plus approved businesses fetched from /api/businesses
 * after mount. An operator adding or editing a station in the admin portal
 * changed nothing here.
 *
 * Now the page reads every listing (getMapStations: the Station table plus
 * approved, placed businesses) and hands it to MapExplorer as a prop. Cached
 * for five minutes like the home page; the admin and review actions already
 * revalidate '/map' when something on it changes.
 *
 * ── If the database is down ──────────────────────────────────────────
 *
 * readOrFallback renders the map with no pins rather than an error page. The
 * map without pins still offers search, directions and the FAQ, and the hero
 * copy says plainly that nothing is listed — it never falls back to fixtures.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'EV Charging Map of Pakistan',
  description:
    'Find EV charging stations across Pakistan on one map. Filter by connector (CCS2, Type 2, CHAdeMO, GB/T) and charging speed, and get one-tap directions.',
  alternates: { canonical: '/map' },
  openGraph: {
    type: 'website',
    url: '/map',
    title: 'EV Charging Map of Pakistan — Plug.pk',
    description:
      'Every listed EV charger in Pakistan on one map, with connector types, charging speeds and directions.',
  },
}

export default async function MapPage() {
  const stations = await readOrFallback('/map stations', [], getMapStations)

  return (
    <>
      {/* useSearchParams (for ?q=) lives inside MapExplorer, so it gets its
          own boundary rather than opting the whole route out of static
          rendering. The fallback is the route's own loading shape. */}
      <Suspense fallback={<MapLoading />}>
        <MapExplorer stations={stations} />
      </Suspense>

      <FaqSection items={MAP_FAQS} title="Common questions about the map" />
    </>
  )
}
