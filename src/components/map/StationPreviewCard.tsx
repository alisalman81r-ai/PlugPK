// src/components/map/StationPreviewCard.tsx
'use client'

import { CalendarCheck, MapPin, Navigation2, Star, X } from '@/components/ui/icons'
import Link from 'next/link'

import { PhotoFrame } from '@/components/ui'
import { ExampleBadge, btnClass } from '@/components/v2/ui'
import { ConnectorTags, KwTag } from './StationList'
import { SaveStationButton } from '@/components/station/SaveStationButton'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatDistance, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationPreviewCardProps {
  station: Station
  onClose: () => void
  onNavigate: (station: Station) => void
  distanceKm?: number
  className?: string
}

/**
 * The card that opens when a pin is tapped.
 *
 * ── What it no longer says ───────────────────────────────────────────
 *
 * It carried a status badge ("Available"), a port meter of free against
 * occupied, and a verified shield. None of the three is measured: there is no
 * feed from the hardware and no verification process. It says how many ports
 * are installed, which is a fact, and flags a sample listing as one.
 *
 * "View details" is a real link now. It was a button calling router.push, so
 * the one way from the map to a station page was invisible to a crawler and
 * could not be opened in a new tab.
 */
export function StationPreviewCard({
  station,
  onClose,
  onNavigate,
  distanceKm,
  className,
}: StationPreviewCardProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const { total: ports } = getPortAvailability(station)
  const example = isSampleListing(station.id)

  return (
    <div className={cn('relative rounded-[24px] border border-ink/10 bg-white p-4 shadow-e4 sm:p-5', className)}>
      <span aria-hidden="true" className="mx-auto mb-3.5 block h-1 w-10 rounded-full bg-ink/15 lg:hidden" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close station preview"
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-chalk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-4">
        <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone">
          <PhotoFrame
            src={station.coverPhoto}
            alt={example ? `Example photo for ${station.name}` : `${station.name} charging station`}
            sizes="80px"
          />
        </span>

        <div className="min-w-0 flex-1 pr-8">
          <h2 className="line-clamp-1 font-display text-[21px] leading-[1.1] text-ink">
            <Link
              href={`/station/${station.slug}`}
              className="rounded-sm hover:underline hover:decoration-1 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {station.name}
            </Link>
          </h2>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            {station.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-ink">
                <Star size={13} className="fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
                {formatRating(station.rating)}
                <span className="font-normal text-muted">({station.reviewCount})</span>
              </span>
            ) : (
              <span>No reviews yet</span>
            )}
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">
                {[station.address.area, station.address.city].filter(Boolean).join(', ')}
              </span>
            </span>
            {distanceKm !== undefined ? (
              <span className="font-mono text-[12.5px] font-semibold text-ink">{formatDistance(distanceKm)}</span>
            ) : null}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {example ? <ExampleBadge>{SAMPLE_LISTING_LABEL}</ExampleBadge> : null}
            {ports > 0 ? (
              <span className="font-mono text-[12.5px] font-medium text-muted">
                {ports} {ports === 1 ? 'port' : 'ports'} installed
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <ConnectorTags station={station} max={3} />
            {maxPower > 0 ? <KwTag kw={maxPower} /> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onNavigate(station)}
          className={btnClass('ink', 'sm', 'h-11 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2')}
        >
          Navigate
          <Navigation2 aria-hidden="true" />
        </button>

        <Link
          href={`/station/${station.slug}`}
          className={btnClass('ghost', 'sm', 'h-11 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2')}
        >
          View details
        </Link>

        {/* Signed-in only; renders nothing otherwise. */}
        <SaveStationButton stationId={station.id} stationName={station.name} className="h-11" />
      </div>

      {/* On every card. The listing's #book section is the booking panel where
          it takes bookings, otherwise a note and nearby chargers that do. */}
      <Link
        href={`/station/${station.slug}#book`}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-volt-edge bg-volt-tint text-sm font-semibold text-ink transition-colors duration-200 hover:bg-volt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <CalendarCheck size={16} className="shrink-0" aria-hidden="true" />
        Book a slot
      </Link>
    </div>
  )
}
