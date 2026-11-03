// src/app/(main)/map/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { MapExplorer } from '@/components/map/MapExplorer'
import { Faq, Hl, SectionHead, WRAP } from '@/components/v2/ui'
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
    title: 'EV Charging Map of Pakistan — plugpk',
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

      {/* The shared FAQ pieces rather than FaqSection, so the heading can
          carry the design's highlighted phrase. */}
      <section data-theme="light" className="bg-chalk pb-[clamp(80px,9vw,128px)] pt-[clamp(56px,6vw,96px)]">
        <div className={WRAP}>
          <SectionHead eyebrow="FAQ" title={<>Common questions about <Hl>the map</Hl></>} />
          <Faq items={MAP_FAQS.map((item) => ({ q: item.question, a: item.answer }))} />
        </div>
      </section>
    </>
  )
}
