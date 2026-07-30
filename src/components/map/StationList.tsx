// src/components/map/StationList.tsx
'use client'

import { MapPin, Navigation2, Star } from 'lucide-react'
import * as React from 'react'

import { ConnectorBadgeGroup, Skeleton, SpeedBadge, StatusDot } from '@/components/ui'
import type { Station } from '@/lib/types'
import { cn, formatDistance, formatRating, getMaxPower } from '@/lib/utils'

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

  const handleNavigate = (event: React.MouseEvent) => {
    event.stopPropagation()
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
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
        'cursor-pointer rounded-2xl bg-white p-4 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isSelected
          ? 'border-2 border-l-4 border-plug-blue-600 bg-blue-50 shadow-blue'
          : 'border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 flex-1 text-[15px] font-bold text-slate-900">{station.name}</h3>
        <span className="flex shrink-0 items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900">{formatRating(station.rating)}</span>
        </span>
      </div>

      <div className="mb-3 mt-1.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1 text-[13px] text-slate-500">
            {station.address.area}, {station.address.city}
          </span>
        </span>
        {distanceKm !== undefined ? (
          <span className="shrink-0 font-mono text-xs text-slate-400">
            {formatDistance(distanceKm)}
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusDot status={station.status} size="sm" showLabel />
        <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
        {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
      </div>

      <button
        type="button"
        onClick={handleNavigate}
        className="group/nav flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-plug-blue-600 text-sm font-semibold text-white transition-colors duration-150 hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
      >
        Navigate
        <Navigation2
          size={15}
          className="shrink-0 transition-transform duration-200 group-hover/nav:translate-x-[3px]"
          aria-hidden="true"
        />
      </button>
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
        <div
          key={index}
          role="status"
          aria-label="Loading station"
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="mb-3 mt-2 h-3 w-1/2" />
          <div className="mb-3 flex gap-2">
            <Skeleton rounded="full" className="h-5 w-20" />
            <Skeleton rounded="full" className="h-5 w-16" />
          </div>
          <Skeleton rounded="lg" className="h-9 w-full" />
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
  className?: string
}

export function StationList({
  stations,
  selectedStation,
  onStationSelect,
  isLoading = false,
  className,
}: StationListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {isLoading ? (
        <StationListSkeleton count={4} />
      ) : stations.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No stations match these filters.</p>
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
