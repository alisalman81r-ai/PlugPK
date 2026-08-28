// src/components/map/StationList.tsx
'use client'

import { MapPin, Navigation2, SearchX, Star } from 'lucide-react'
import * as React from 'react'

import {
  ConnectorBadgeGroup,
  PhotoFrame,
  PortMeter,
  Skeleton,
  SpeedBadge,
  StatusDot,
} from '@/components/ui'
import { FACE, FRAME, FRAME_FEATURED } from '@/components/shared/frame'
import type { Station } from '@/lib/types'
import { cn, formatDistance, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationListItemProps {
  station: Station
  isSelected: boolean
  onClick: (station: Station) => void
  distanceKm?: number
}

export function StationListItem({
  station,
  isSelected,
  onClick,
  distanceKm,
}: StationListItemProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const ports = getPortAvailability(station)

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
     * The card treatment shared with the home page and Partner Up.
     *
     * These were the last cards on the site still wearing a plain slate border
     * with a blue tint on hover, while every other card wears a graded hairline
     * that warms to brand. Walking from the home page to the map changed what a
     * card was for no reason a visitor could see.
     *
     * The selected state is FRAME_FEATURED — the same brand edge the
     * recommended pricing plan carries — rather than a blue fill with a thick
     * left border. A fill was the heaviest possible way to say "this one", on a
     * page where up to a dozen of these sit in a grid, and it fought the photo
     * and the status dot inside the card for attention.
     */
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onClick(station)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(station)
        }
      }}
      className={cn(
        isSelected ? FRAME_FEATURED : FRAME,
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
      )}
    >
      <div className={cn(FACE, 'p-4')}>
        {/* Thumbnail beside the text: the same photo shown on the station page,
            so a row in the list and its pin on the map read as one place. */}
        <div className="mb-3 flex gap-3">
          <span className="relative block h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl">
            <PhotoFrame
              src={station.coverPhoto}
              alt={`${station.name} charging station`}
              sizes="68px"
            />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 flex-1 text-ui font-bold text-slate-900">
                {station.name}
              </h3>
              <span className="flex shrink-0 items-center gap-1">
                <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-900">
                  {formatRating(station.rating)}
                </span>
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="line-clamp-1 text-ui-sm text-slate-500">
                  {station.address.area}, {station.address.city}
                </span>
              </span>
              {distanceKm !== undefined ? (
                <span className="shrink-0 font-mono text-xs text-slate-400">
                  {formatDistance(distanceKm)}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusDot status={station.status} size="sm" showLabel />
            </div>
          </div>
        </div>

        {ports.total > 0 ? (
          <PortMeter available={ports.available} total={ports.total} size="sm" className="mb-3" />
        ) : null}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
          {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
        </div>

        {/*
          Outlined at rest, brand-filled on hover.

          It was a solid blue bar across the full width of every card, so a grid
          of six put six blue slabs on the page and they, rather than the
          stations, were what the eye landed on. There is also a nesting problem
          a fill makes worse: the card itself is a button — clicking it puts the
          station on the map — so a second, heavier-looking button inside it
          left no way to tell what each one did. Outlined, the card reads as the
          surface and this reads as the one specific action on it.

          It still fills on hover and keeps its own focus ring, so it never
          stops looking like a control.
        */}
        <button
          type="button"
          onClick={handleNavigate}
          className="group/nav flex h-9 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-slate-300 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-plug-blue-600 hover:bg-plug-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          Navigate
          <Navigation2
            size={15}
            className="shrink-0 transition-transform duration-200 group-hover/nav:translate-x-[3px]"
            aria-hidden="true"
          />
        </button>
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
        // Mirrors the loaded row exactly — the same frame and face, so nothing
        // changes shape or shifts the grid the moment the real cards arrive.
        <div key={index} role="status" aria-label="Loading station" className={FRAME}>
          <div className={cn(FACE, 'p-4')}>
            <div className="mb-3 flex gap-3">
              <Skeleton rounded="lg" className="h-[68px] w-[68px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-2.5 h-4 w-24" />
              </div>
            </div>
            <div className="mb-3 flex gap-2">
              <Skeleton rounded="full" className="h-5 w-20" />
              <Skeleton rounded="full" className="h-5 w-16" />
            </div>
            <Skeleton rounded="lg" className="h-9 w-full" />
          </div>
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
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <SearchX size={24} className="text-slate-400" aria-hidden="true" />
      </span>
      <p className="text-ui font-semibold text-slate-900">No stations match</p>
      <p className="mt-1.5 max-w-[240px] text-ui-sm leading-relaxed text-slate-500">
        Nothing here fits every filter you have set. Widening the connector or speed filter
        usually brings results back.
      </p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Clear all filters
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
