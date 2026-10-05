// src/components/station/RelatedStations.tsx
import { MapPin, Star } from '@/components/ui/icons'
import Link from 'next/link'

import { ConnectorBadgeGroup, PhotoFrame, SpeedBadge, StationCardSkeleton } from '@/components/ui'
import { getRelatedStations } from '@/lib/db/queries'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface RelatedStationsProps {
  currentStationId: string
  city: string
}

const RELATED_COUNT = 3

/**
 * Grid sizing shared with the skeleton, so the fallback and the real row are
 * the same shape.
 *
 * This grid sits in the page's left column, which narrows to ~460px at 1024
 * once the sidebar appears. Three columns there gave 137px cards that cut every
 * station name to "F-10…", and one column on a tablet stretched a card to
 * 700px. Two columns until the column is wide enough for three; the third card
 * waits for that width rather than sitting alone on a second row.
 */
const GRID = 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
const THIRD = (index: number) => index === 2 && 'sm:max-xl:hidden'

/** What the page shows while the related row streams in (inside <Suspense>). */
export function RelatedStationsSkeleton() {
  return (
    <section aria-busy="true">
      <div className="mb-8 h-8 w-64 rounded-lg bg-slate-100" />
      <div className={GRID}>
        {Array.from({ length: RELATED_COUNT }, (_, index) => (
          <StationCardSkeleton key={index} className={cn(THIRD(index))} />
        ))}
      </div>
    </section>
  )
}

/**
 * Three other stations, as real links.
 *
 * This used to borrow the home page's StationCard, which navigates with
 * router.push — so a page full of station links had no `<a href>` a crawler
 * could follow — and which prints live availability ("3/5 free") that nothing
 * on the platform measures. This card is a plain Link and says what is
 * installed instead.
 */
export async function RelatedStations({ currentStationId, city }: RelatedStationsProps) {
  const related = await getRelatedStations(currentStationId, city, RELATED_COUNT)
  if (related.length === 0) return null

  const allSameCity = related.every((station) => station.address.city === city)

  return (
    <section>
      <h2 className="mb-8 text-2xl font-bold text-slate-900">
        {allSameCity ? `More Stations in ${city}` : 'More Stations'}
      </h2>

      <div className={GRID}>
        {related.map((station, index) => (
          <RelatedCard key={station.id} station={station} className={cn(THIRD(index))} />
        ))}
      </div>
    </section>
  )
}

function RelatedCard({ station, className }: { station: Station; className?: string }) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const { total: ports } = getPortAvailability(station)
  const example = isSampleListing(station.id)

  return (
    <Link
      href={`/station/${station.slug}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      <span className="relative block h-[160px] overflow-hidden">
        <PhotoFrame
          src={station.coverPhoto}
          alt={example ? `Example photo for ${station.name}` : `${station.name} charging station`}
          sizes="(max-width: 640px) 100vw, 320px"
          zoomOnHover
        />
        {example ? (
          <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {SAMPLE_LISTING_LABEL}
          </span>
        ) : null}
      </span>

      <span className="block p-5">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 font-bold text-slate-900 group-hover:text-plug-blue-700">
            {station.name}
          </span>
          {station.reviewCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-900">
              <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              {formatRating(station.rating)}
            </span>
          ) : null}
        </span>

        <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1">
            {[station.address.area, station.address.city].filter(Boolean).join(', ')}
          </span>
        </span>

        <span className="mt-3 flex flex-wrap items-center gap-2">
          <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
          {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
        </span>

        {ports > 0 ? (
          <span className="mt-3 block font-mono text-xs text-slate-500">
            {ports} {ports === 1 ? 'port' : 'ports'} installed
          </span>
        ) : null}
      </span>
    </Link>
  )
}
