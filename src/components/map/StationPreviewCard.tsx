// src/components/map/StationPreviewCard.tsx
'use client'

import { MapPin, Navigation2, X } from '@/components/ui/icons'
import Link from 'next/link'

import { ConnectorBadgeGroup, PhotoFrame, RatingStars, SpeedBadge } from '@/components/ui'
import { SaveStationButton } from '@/components/station/SaveStationButton'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatDistance, getMaxPower, getPortAvailability } from '@/lib/utils'

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
    <div className={cn('relative rounded-3xl bg-white p-5 shadow-e3', className)}>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block h-1 w-10 rounded-full bg-slate-200 lg:hidden"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close station preview"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4">
        <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
          <PhotoFrame
            src={station.coverPhoto}
            alt={example ? `Example photo for ${station.name}` : `${station.name} charging station`}
            sizes="80px"
          />
        </span>

        <div className="min-w-0 flex-1 pr-8">
          {example ? (
            <span className="mb-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {SAMPLE_LISTING_LABEL}
            </span>
          ) : null}

          <h2 className="mb-1 line-clamp-1 text-lg font-bold text-slate-900">
            <Link
              href={`/station/${station.slug}`}
              className="hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            >
              {station.name}
            </Link>
          </h2>

          <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-1">
              {[station.address.area, station.address.city].filter(Boolean).join(', ')}
            </span>
            {distanceKm !== undefined ? (
              <span className="ml-1 shrink-0 font-mono text-xs text-slate-400">
                · {formatDistance(distanceKm)}
              </span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <ConnectorBadgeGroup connectors={station.connectors} max={3} size="sm" />
            {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {station.reviewCount > 0 ? (
              <RatingStars
                rating={station.rating}
                reviewCount={station.reviewCount}
                size="sm"
                showNumber
                showCount
              />
            ) : (
              <span className="text-xs text-slate-500">No reviews yet</span>
            )}
            {ports > 0 ? (
              <span className="font-mono text-xs text-slate-500">
                {ports} {ports === 1 ? 'port' : 'ports'} installed
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => onNavigate(station)}
          className="group/nav flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-plug-blue-600 font-semibold text-white transition-all duration-200 hover:bg-plug-blue-700 hover:shadow-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          <Navigation2
            size={16}
            className="shrink-0 transition-transform duration-200 group-hover/nav:translate-x-[3px]"
            aria-hidden="true"
          />
          Navigate
        </button>

        <Link
          href={`/station/${station.slug}`}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          View Details
        </Link>

        {/* Signed-in only; renders nothing otherwise. */}
        <SaveStationButton stationId={station.id} stationName={station.name} className="h-11" />
      </div>
    </div>
  )
}
