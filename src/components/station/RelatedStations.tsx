// src/components/station/RelatedStations.tsx
import { MapPin, Star } from '@/components/ui/icons'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ConnectorTags, KwTag } from '@/components/map/StationList'
import { PhotoFrame, StationCardSkeleton } from '@/components/ui'
import { SCARD_HOVER } from '@/components/map/layout'
import { CARD, Hl, SectionHead, WRAP } from '@/components/v2/ui'
import { getRelatedStations } from '@/lib/db/queries'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface RelatedStationsProps {
  currentStationId: string
  city: string
}

const RELATED_COUNT = 3

/** Grid sizing shared with the skeleton, so the fallback and the real row are the same shape. */
const GRID = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
const THIRD = (index: number) => index === 2 && 'md:max-lg:hidden'

/**
 * The paper band the row sits on. It belongs to this component rather than the
 * page so that a station with no neighbours renders nothing at all, instead of
 * an empty band.
 */
function Band({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  return (
    <section
      data-theme="light"
      aria-busy={busy || undefined}
      className="bg-paper pb-48 pt-[clamp(56px,6vw,96px)] lg:pb-[clamp(80px,9vw,128px)]"
    >
      <div className={WRAP}>{children}</div>
    </section>
  )
}

/** What the page shows while the related row streams in (inside <Suspense>). */
export function RelatedStationsSkeleton() {
  return (
    <Band busy>
      <div className="mx-auto mb-[clamp(40px,5vw,64px)] h-12 w-72 max-w-full rounded-xl bg-stone" />
      <div className={GRID}>
        {Array.from({ length: RELATED_COUNT }, (_, index) => (
          <StationCardSkeleton key={index} className={cn(THIRD(index))} />
        ))}
      </div>
    </Band>
  )
}

/**
 * Three other stations, as real links.
 *
 * A plain Link that says what is installed — never live availability, which
 * nothing on the platform measures.
 */
export async function RelatedStations({ currentStationId, city }: RelatedStationsProps) {
  const related = await getRelatedStations(currentStationId, city, RELATED_COUNT)
  if (related.length === 0) return null

  const allSameCity = related.every((station) => station.address.city === city)

  return (
    <Band>
      <SectionHead
        eyebrow="Keep exploring"
        title={
          allSameCity ? (
            <>
              More stations in <Hl>{city}</Hl>
            </>
          ) : (
            <>
              More <Hl>stations</Hl>
            </>
          )
        }
        className="!mb-[clamp(40px,5vw,64px)]"
      />

      <div className={GRID}>
        {related.map((station, index) => (
          // The reveal rides a wrapper: GSAP leaves an inline 'translate: none'
          // on what it moves, which would cancel the card's own hover lift.
          <div key={station.id} data-reveal="" className={cn(THIRD(index))}>
            <RelatedCard station={station} className="h-full" />
          </div>
        ))}
      </div>
    </Band>
  )
}

function RelatedCard({ station, className }: { station: Station; className?: string }) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const { total: ports } = getPortAvailability(station)
  const example = isSampleListing(station.id)

  return (
    // The map page's card language: lifts 4px on hover (.scard2).
    <Link
      href={`/station/${station.slug}`}
      className={cn(
        CARD,
        SCARD_HOVER,
        'group block overflow-hidden p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        className,
      )}
    >
      <span className="relative block aspect-[16/10] overflow-hidden rounded-[22px] bg-stone">
        <PhotoFrame
          src={station.coverPhoto}
          alt={example ? `Example photo for ${station.name}` : `${station.name} charging station`}
          sizes="(max-width: 768px) 100vw, 420px"
          zoomOnHover
        />
        {example ? (
          <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-full border border-[#FFE0A3] bg-[#FFF6E3] px-[9px] text-[11.5px] font-semibold text-[#8A5300]">
            {SAMPLE_LISTING_LABEL}
          </span>
        ) : null}
      </span>

      <span className="block px-3 pb-3 pt-4">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 font-display text-[21px] leading-[1.12] text-ink">{station.name}</span>
          {station.reviewCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 font-mono text-[13px] font-semibold text-ink">
              <Star size={14} className="fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
              {formatRating(station.rating)}
            </span>
          ) : null}
        </span>

        <span className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-muted">
          <MapPin size={14} className="shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">
            {[station.address.area, station.address.city].filter(Boolean).join(', ')}
          </span>
        </span>

        <span className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <ConnectorTags station={station} />
          {maxPower > 0 ? <KwTag kw={maxPower} className="ml-auto" /> : null}
        </span>

        {ports > 0 ? (
          <span className="mt-3 block font-mono text-[12.5px] text-muted">
            {ports} {ports === 1 ? 'port' : 'ports'} installed
          </span>
        ) : null}
      </span>
    </Link>
  )
}
