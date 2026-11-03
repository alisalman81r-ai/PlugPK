// src/components/map/StationList.tsx
'use client'

import { MapPin, Navigation2, SearchX, Star, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame, Skeleton } from '@/components/ui'
import { CARD, CARD_HOVER, ExampleBadge, Tag, btnClass } from '@/components/v2/ui'
import { FAST_CHARGER_KW } from '@/lib/charging'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { SaveStationButton } from '@/components/station/SaveStationButton'
import { cn, formatDistance, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'
import { CONNECTOR_LABEL } from './filter-options'

export interface StationListItemProps {
  station: Station
  isSelected: boolean
  onClick: (station: Station) => void
  distanceKm?: number
}

/**
 * The peak-power tag (.tag--kw): ink with a volt bolt at 60 kW and up, white
 * below — the same split the pins on the map use.
 */
export function KwTag({ kw, className }: { kw: number; className?: string }) {
  const fast = kw >= FAST_CHARGER_KW
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-[5px] whitespace-nowrap rounded-full border px-2.5 font-mono text-xs font-semibold',
        fast ? 'border-ink bg-ink text-white' : 'border-ink/30 bg-white text-ink',
        className,
      )}
    >
      <Zap aria-hidden="true" className={cn('h-3 w-3 fill-current', fast ? 'text-volt' : 'text-ink')} />
      {kw} kW
    </span>
  )
}

/** The connector types at a station, each named once, with a "+n" for the rest. */
export function ConnectorTags({ station, max = 2 }: { station: Station; max?: number }) {
  const types = [...new Set(station.connectors.map((connector) => connector.type))]
  return (
    <>
      {types.slice(0, max).map((type) => (
        <Tag key={type}>{CONNECTOR_LABEL[type] ?? type}</Tag>
      ))}
      {types.length > max ? (
        <Tag className="bg-chalk font-mono text-muted">+{types.length - max}</Tag>
      ) : null}
    </>
  )
}

export function StationListItem({
  station,
  isSelected,
  onClick,
  distanceKm,
}: StationListItemProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const { total: ports } = getPortAvailability(station)
  const example = isSampleListing(station.id)

  const handleNavigate = (event: React.MouseEvent) => {
    event.stopPropagation()
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    /*
     * The landing-v2 station card (.scard2). The card itself is a button —
     * clicking it puts the station on the map — so the selected state is an
     * ink outline rather than a fill, and the one specific action inside it
     * (Navigate) is an outlined pill that goes ink on hover.
     */
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Show ${station.name} on the map`}
      onClick={() => onClick(station)}
      onKeyDown={(event) => {
        // Only the card itself: Enter on the name link or a button inside
        // must do what that control does, not be swallowed here.
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(station)
        }
      }}
      className={cn(
        CARD,
        CARD_HOVER,
        'grid cursor-pointer gap-3.5 rounded-[24px] p-4 sm:p-[18px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-[3px]',
        isSelected && 'border-ink shadow-[0_0_0_1.5px_#0B0C0E,0_18px_40px_-18px_rgba(11,12,14,.35)] hover:border-ink',
      )}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3.5">
        {/* The same photo shown on the station page, so a card in the list and
            its pin on the map read as one place. */}
        <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-2xl bg-stone">
          <PhotoFrame src={station.coverPhoto} alt={`${station.name} charging station`} sizes="72px" />
        </span>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2.5">
            {/* A real link to the station page, so the list is crawlable and a
                card can be opened in a new tab. Clicking it does not also
                select the card — it is leaving the map. */}
            <h3 className="mt-px line-clamp-2 font-display text-xl leading-[1.12] text-ink">
              <Link
                href={`/station/${station.slug}`}
                onClick={(event) => event.stopPropagation()}
                className="rounded-sm hover:underline hover:decoration-1 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {station.name}
              </Link>
            </h3>
            {station.reviewCount > 0 ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 font-mono text-[13px] font-semibold text-ink"
                aria-label={`Rated ${formatRating(station.rating)} out of 5`}
              >
                <Star size={14} className="fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
                {formatRating(station.rating)}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2.5 text-[13.5px] text-muted">
            <span className="inline-flex min-w-0 items-center gap-[5px]">
              <MapPin size={14} className="shrink-0" aria-hidden="true" />
              <span className="truncate">
                {station.address.area}, {station.address.city}
              </span>
            </span>
            {distanceKm !== undefined ? (
              <span className="shrink-0 whitespace-nowrap font-mono text-[12.5px] font-semibold text-ink">
                {formatDistance(distanceKm)}
              </span>
            ) : null}
          </div>

          {/* No status dot: nothing reports live availability. What is
              known is what is installed, and whether this is a sample. */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {example ? <ExampleBadge>{SAMPLE_LISTING_LABEL}</ExampleBadge> : null}
            {ports > 0 ? (
              <span className="font-mono text-[12.5px] font-medium text-muted">
                {ports} {ports === 1 ? 'port' : 'ports'} installed
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ConnectorTags station={station} />
        {maxPower > 0 ? <KwTag kw={maxPower} className="ml-auto" /> : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleNavigate}
          aria-label={`Navigate to ${station.name} in Google Maps`}
          className={btnClass(
            'ghost',
            'sm',
            'h-11 min-w-0 flex-1 hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 [&_svg]:!h-[15px] [&_svg]:!w-[15px]',
          )}
        >
          Navigate
          <Navigation2 aria-hidden="true" />
        </button>
        {/* Signed-in only; renders nothing otherwise. */}
        <SaveStationButton stationId={station.id} stationName={station.name} className="h-11" />
      </div>
    </div>
  )
}

export interface StationListSkeletonProps {
  count?: number
}

export function StationListSkeleton({ count = 4 }: StationListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => index).map((index) => (
        // Mirrors the loaded card, so nothing changes shape or shifts the grid
        // the moment the real cards arrive.
        <div key={index} role="status" aria-label="Loading station" className={cn(CARD, 'grid gap-3.5 rounded-[24px] p-[18px]')}>
          <div className="flex gap-3.5">
            <Skeleton rounded="lg" className="h-[72px] w-[72px] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-2.5 h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton rounded="full" className="h-[26px] w-16" />
            <Skeleton rounded="full" className="h-[26px] w-16" />
          </div>
          <Skeleton rounded="full" className="h-11 w-full" />
        </div>
      ))}
    </>
  )
}

export interface StationListProps {
  stations: (Station & { distanceKm?: number })[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  isLoading?: boolean
  /** Lets the empty state offer a way out instead of just stating the fact. */
  onClearFilters?: () => void
  className?: string
}

/**
 * An empty result is a dead end unless it offers the way back. The reset is
 * the action, so it is a real button rather than a line of muted text.
 */
export function NoResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-14 text-center">
      <SearchX size={30} className="text-muted" aria-hidden="true" />
      <p className="font-display text-2xl leading-[1.15] text-ink">No stations match these filters.</p>
      <p className="max-w-[24rem] text-[15px] leading-relaxed text-muted">
        Nothing here fits every filter you have set. Try another connector or speed, or clear the
        filters.
      </p>
      {onClearFilters ? (
        <button type="button" onClick={onClearFilters} className={btnClass('ink', 'sm', 'mt-2.5')}>
          Clear filters
        </button>
      ) : null}
    </div>
  )
}

export function StationList({
  stations,
  selectedStation,
  onStationSelect,
  isLoading = false,
  onClearFilters,
  className,
}: StationListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {isLoading ? (
        <StationListSkeleton count={4} />
      ) : stations.length === 0 ? (
        <NoResults onClearFilters={onClearFilters} />
      ) : (
        stations.map((station) => (
          <StationListItem
            key={station.id}
            station={station}
            isSelected={selectedStation?.id === station.id}
            onClick={onStationSelect}
            distanceKm={station.distanceKm}
          />
        ))
      )}
    </div>
  )
}
