// src/components/home/StationCard.tsx
'use client'

import { Bookmark, BookmarkCheck, MapPin, Navigation2, Star, Zap } from 'lucide-react'
import * as React from 'react'

import { ConnectorBadgeGroup, SpeedBadge } from '@/components/ui'
import type { Station, StationStatus } from '@/lib/types'
import { cn, formatRating, getMaxPower } from '@/lib/utils'

export interface StationCardProps {
  station: Station
  variant?: 'default' | 'compact' | 'horizontal'
  onNavigate?: (station: Station) => void
  onSave?: (stationId: string) => void
  isSaved?: boolean
  className?: string
  animationDelay?: number
  showDistance?: boolean
  distanceKm?: number
}

const STATUS_DOT: Record<StationStatus, string> = {
  available: 'bg-green-400',
  limited: 'bg-amber-400',
  offline: 'bg-red-400',
  unknown: 'bg-slate-400',
}

const STATUS_LABEL: Record<StationStatus, string> = {
  available: 'Available',
  limited: 'Limited',
  offline: 'Offline',
  unknown: 'Unknown',
}

const HOVER =
  'transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_rgba(0,0,0,0.10)]'

function StatusPill({ status }: { status: StationStatus }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-black/[0.65] px-3 py-1.5 backdrop-blur-md">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={cn('absolute inset-0 rounded-full', STATUS_DOT[status])} />
        {status === 'available' ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-pulse-ring rounded-full bg-green-400"
          />
        ) : null}
      </span>
      <span className="text-xs font-medium text-white">{STATUS_LABEL[status]}</span>
    </span>
  )
}

/** Stations have no real photography yet, so every card uses this placeholder. */
function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50',
        className,
      )}
    >
      <Zap size={48} className="text-blue-200" />
    </div>
  )
}

export function StationCard({
  station,
  variant = 'default',
  onNavigate,
  onSave,
  isSaved = false,
  className,
  animationDelay,
  showDistance = false,
  distanceKm,
}: StationCardProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const location = `${station.address.area}, ${station.address.city}`

  const handleNavigate = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onNavigate?.(station)
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
        '_blank',
        'noopener,noreferrer',
      )
    },
    [onNavigate, station],
  )

  const handleSave = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onSave?.(station.id)
    },
    [onSave, station.id],
  )

  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined

  const rating = (
    <span className="flex items-center gap-1.5">
      <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-[14px] font-semibold text-slate-900">{formatRating(station.rating)}</span>
      <span className="text-[13px] text-slate-400">({station.reviewCount})</span>
    </span>
  )

  const navigateButton = (
    <button
      type="button"
      onClick={handleNavigate}
      className="group/nav inline-flex items-center justify-center gap-2 rounded-xl bg-plug-blue-600 font-semibold text-white transition-all duration-200 hover:bg-plug-blue-700 hover:shadow-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
    >
      Navigate
      <Navigation2
        size={16}
        className="shrink-0 transition-transform duration-200 group-hover/nav:translate-x-[3px]"
        aria-hidden="true"
      />
    </button>
  )

  /* ── Compact ─────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <article
        style={style}
        className={cn(
          'flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4',
          HOVER,
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900">{station.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{location}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
            {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
          </div>
        </div>
        {React.cloneElement(navigateButton, { className: cn(navigateButton.props.className, 'h-9 shrink-0 px-4 text-sm') })}
      </article>
    )
  }

  /* ── Horizontal ──────────────────────────────────────────────── */
  if (variant === 'horizontal') {
    return (
      <article
        style={style}
        className={cn(
          'flex h-40 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white',
          HOVER,
          className,
        )}
      >
        <div className="relative w-2/5 shrink-0">
          <PhotoPlaceholder className="h-full w-full" />
          <span className="absolute left-3 top-3">
            <StatusPill status={station.status} />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
          <h3 className="line-clamp-1 text-[17px] font-bold text-slate-900">{station.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
            <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
            {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
          </div>
          <div className="mt-3 flex items-center justify-between">
            {rating}
            {React.cloneElement(navigateButton, { className: cn(navigateButton.props.className, 'h-9 px-4 text-sm') })}
          </div>
        </div>
      </article>
    )
  }

  /* ── Default ─────────────────────────────────────────────────── */
  return (
    <article
      style={style}
      className={cn(
        'cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white',
        HOVER,
        className,
      )}
    >
      <div className="relative h-[200px] overflow-hidden bg-slate-100">
        <PhotoPlaceholder className="h-full w-full" />

        <span className="absolute left-3 top-3">
          <StatusPill status={station.status} />
        </span>

        <button
          type="button"
          onClick={handleSave}
          aria-label={isSaved ? `Remove ${station.name} from saved` : `Save ${station.name}`}
          aria-pressed={isSaved}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.65] backdrop-blur-md transition-all duration-150 hover:scale-110 hover:bg-black/[0.85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isSaved ? (
            <BookmarkCheck size={18} className="text-blue-400" aria-hidden="true" />
          ) : (
            <Bookmark size={18} className="text-white" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="p-5">
        <h3 className="mb-1.5 line-clamp-1 text-[17px] font-bold text-slate-900">{station.name}</h3>

        <p className="mb-4 flex items-center gap-1.5 text-[13px] text-slate-500">
          <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1">{location}</span>
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
          {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
        </div>

        <div className="mb-5 flex items-center justify-between">
          {rating}
          {showDistance && distanceKm !== undefined ? (
            <span className="flex items-center gap-1 font-mono text-[13px] text-slate-500">
              <MapPin size={12} className="shrink-0" aria-hidden="true" />
              {distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>

        {React.cloneElement(navigateButton, { className: cn(navigateButton.props.className, 'h-11 w-full text-sm') })}
      </div>
    </article>
  )
}
