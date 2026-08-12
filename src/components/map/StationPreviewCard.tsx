// src/components/map/StationPreviewCard.tsx
'use client'

import { MapPin, Navigation2, ShieldCheck, X } from 'lucide-react'

import {
  ConnectorBadgeGroup,
  PhotoFrame,
  RatingStars,
  SpeedBadge,
  StatusBadge,
} from '@/components/ui'
import type { Station } from '@/lib/types'
import { cn, formatDistance, getMaxPower } from '@/lib/utils'

export interface StationPreviewCardProps {
  station: Station
  onClose: () => void
  onViewDetails: (station: Station) => void
  onNavigate: (station: Station) => void
  distanceKm?: number
  className?: string
}

export function StationPreviewCard({
  station,
  onClose,
  onViewDetails,
  onNavigate,
  distanceKm,
  className,
}: StationPreviewCardProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

  return (
    <div
      className={cn(
        'relative rounded-3xl bg-white p-5 shadow-[0_-4px_40px_rgba(0,0,0,0.12)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block h-1 w-10 rounded-full bg-slate-200 lg:hidden"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close station preview"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4">
        <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
          <PhotoFrame
            src={station.coverPhoto}
            alt={`${station.name} charging station`}
            sizes="80px"
          />
        </span>

        <div className="min-w-0 flex-1 pr-8">
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={station.status} className="px-2.5 py-1 text-xs" />
            {station.isVerified ? (
              <ShieldCheck
                size={14}
                className="shrink-0 text-plug-blue-600"
                aria-label="Verified station"
              />
            ) : null}
          </div>

          <h2 className="mb-1 line-clamp-1 text-lg font-bold text-slate-900">{station.name}</h2>

          <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-1">
              {station.address.area}, {station.address.city}
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

          <div className="mt-2">
            <RatingStars
              rating={station.rating}
              reviewCount={station.reviewCount}
              size="sm"
              showNumber
              showCount
            />
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

        <button
          type="button"
          onClick={() => onViewDetails(station)}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          View Details
        </button>
      </div>
    </div>
  )
}
