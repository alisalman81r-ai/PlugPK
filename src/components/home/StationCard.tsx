// src/components/home/StationCard.tsx
'use client'

import { MapPin, Navigation2, Plug, Star } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { ConnectorBadgeGroup } from '@/components/ui/ConnectorBadge'
import { PhotoFrame } from '@/components/ui/PhotoFrame'
import { SpeedBadge } from '@/components/ui/SpeedBadge'
import { SaveStationButton } from '@/components/station/SaveStationButton'
import { isSampleListing, SAMPLE_LISTING_LABEL } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationCardProps {
  station: Station
  variant?: 'default' | 'compact' | 'horizontal'
  onNavigate?: (station: Station) => void
  className?: string
  animationDelay?: number
  showDistance?: boolean
  distanceKm?: number
}

/**
 * A station on a card.
 *
 * ── What it no longer claims ──────────────────────────────────────────
 *
 * It wore a status pill ("Available", with a pulsing green ring) and a port
 * meter reading "2 of 4 free". Nothing behind the site talks to a charger:
 * those figures were whatever the row was seeded with, presented as live. The
 * card now says how many ports are installed, which is what an operator
 * actually entered, and nothing about whether they are in use.
 *
 * A sample station — one of the fixtures the map started from — says so with
 * the shared "Example listing" label, the same words every other surface uses.
 *
 * ── A link, not a click handler ───────────────────────────────────────
 *
 * The whole card is one real link to the station page (the title's link is
 * stretched over the card), so it opens in a new tab, shows its address on
 * hover and works without script. Navigate and Save sit above that link as
 * their own controls.
 */

// `group` so the photo can react to a hover anywhere on the card.
// motion-reduce keeps the lift off for users who ask for less movement.
const HOVER =
  'group relative transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-plug-blue-200 hover:shadow-e2 focus-within:border-plug-blue-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0'

/** The title link, stretched over the whole card by its ::after. */
const STRETCHED =
  'after:absolute after:inset-0 after:z-0 after:content-[""] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-plug-blue-500'

function stationPhotoAlt(station: Station) {
  return `${station.name} charging station`
}

function SampleTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-ui-xs font-semibold text-amber-800',
        className,
      )}
    >
      {SAMPLE_LISTING_LABEL}
    </span>
  )
}

export function StationCard({
  station,
  variant = 'default',
  onNavigate,
  className,
  animationDelay,
  showDistance = false,
  distanceKm,
}: StationCardProps) {
  const href = `/station/${station.slug}`
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const location = `${station.address.area}, ${station.address.city}`
  const installed = getPortAvailability(station).total
  const sample = isSampleListing(station.id)

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

  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined

  const title = (size: string) => (
    <h3 className={cn('line-clamp-1 font-bold text-slate-900', size)}>
      <Link href={href} className={STRETCHED}>
        {station.name}
      </Link>
    </h3>
  )

  const portsInstalled =
    installed > 0 ? (
      <span className="flex items-center gap-1.5 text-ui-sm text-slate-500">
        <Plug size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
        {installed} {installed === 1 ? 'port' : 'ports'} installed
      </span>
    ) : null

  const rating =
    station.reviewCount > 0 ? (
      <span className="flex items-center gap-1.5">
        <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
        <span className="text-[14px] font-semibold text-slate-900">{formatRating(station.rating)}</span>
        <span className="text-ui-sm text-slate-400">({station.reviewCount})</span>
      </span>
    ) : (
      <span className="text-ui-sm text-slate-400">No reviews yet</span>
    )

  const renderNavigateButton = (sizing: string) => (
    <button
      type="button"
      onClick={handleNavigate}
      className={cn(
        'group/nav relative z-10 inline-flex items-center justify-center gap-2 rounded-xl bg-plug-blue-600 font-semibold text-white transition-all duration-200',
        'hover:bg-plug-blue-700 hover:shadow-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        sizing,
      )}
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
        className={cn('flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4', HOVER, className)}
      >
        <div className="min-w-0 flex-1">
          {title('text-ui')}
          <p className="mt-0.5 line-clamp-1 text-ui-sm text-slate-500">{location}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {sample ? <SampleTag /> : null}
            <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
            {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
          </div>
        </div>
        {renderNavigateButton('h-11 shrink-0 px-4 text-sm')}
      </article>
    )
  }

  /* ── Horizontal ──────────────────────────────────────────────── */
  if (variant === 'horizontal') {
    return (
      <article
        style={style}
        className={cn('flex h-40 overflow-hidden rounded-2xl border border-slate-200 bg-white', HOVER, className)}
      >
        <div className="relative w-2/5 shrink-0 overflow-hidden">
          <PhotoFrame
            src={station.coverPhoto}
            alt={stationPhotoAlt(station)}
            sizes="(max-width: 640px) 40vw, 220px"
            zoomOnHover
          />
          {sample ? <SampleTag className="absolute left-3 top-3 z-10" /> : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
          {title('text-ui-lg')}
          <p className="mt-1 flex items-center gap-1.5 text-ui-sm text-slate-500">
            <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
            {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
          </div>
          <div className="mt-3 flex items-center justify-between">
            {rating}
            {renderNavigateButton('h-11 px-4 text-sm')}
          </div>
        </div>
      </article>
    )
  }

  /* ── Default ─────────────────────────────────────────────────── */
  return (
    <article
      style={style}
      className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', HOVER, className)}
    >
      <div className="relative h-[200px] overflow-hidden bg-slate-100">
        <PhotoFrame
          src={station.coverPhoto}
          alt={stationPhotoAlt(station)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          zoomOnHover
          overlay
        />

        {sample ? <SampleTag className="absolute left-3 top-3 z-10" /> : null}

        {/* Saved to the account, and only offered when signed in. */}
        <SaveStationButton
          stationId={station.id}
          stationName={station.name}
          variant="overlay"
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <div className="p-5">
        <div className="mb-1.5">{title('text-ui-lg')}</div>

        <p className="mb-4 flex items-center gap-1.5 text-ui-sm text-slate-500">
          <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1">{location}</span>
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
          {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {rating}
          <span className="flex items-center gap-3">
            {portsInstalled}
            {showDistance && distanceKm !== undefined ? (
              <span className="flex items-center gap-1 font-mono text-ui-sm text-slate-500">
                <MapPin size={12} className="shrink-0" aria-hidden="true" />
                {distanceKm.toFixed(1)} km
              </span>
            ) : null}
          </span>
        </div>

        {renderNavigateButton('h-11 w-full text-sm')}
      </div>
    </article>
  )
}
