// src/components/map/MapHeader.tsx
'use client'

import { MapPin, Zap } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A slim context band above the map.
 *
 * The route had no heading of any kind — it dropped straight into a split view,
 * which left nothing to orient a first-time visitor and nothing for a search
 * engine to index a page whose entire content is a canvas element.
 *
 * Kept deliberately short, and its height is not a magic number: the page is a
 * flex column, so this takes what it needs and the map takes the rest. A
 * full-height hero here would be the wrong trade — on this route the map is the
 * content, and every pixel above it is a pixel not showing chargers.
 *
 * Dark, matching the car and services heroes, so the map below reads as a
 * bright working surface set into the site rather than a page of its own.
 *
 * Counts are live and reflect the current filters: the total never moves, but
 * "showing 6 of 6" changing to "showing 2 of 6" as a filter is applied is the
 * fastest possible confirmation that the filter did something.
 */

export interface MapHeaderProps {
  total: number
  shown: number
  cities: number
  className?: string
}

export function MapHeader({ total, shown, cities, className }: MapHeaderProps) {
  const filtered = shown !== total

  return (
    <header
      className={cn(
        'relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-slate-950',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 -z-10 h-64 w-64 rounded-full bg-plug-blue-600/25 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 -z-10 h-56 w-56 rounded-full bg-plug-cyan-500/20 blur-[90px]"
      />

      <div className="container-plug flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 lg:py-5">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Charging map
          </h1>
          <p className="mt-0.5 text-ui-sm text-white/60">
            Every public charger on Plug.pk, filterable by connector, speed and amenity.
          </p>
        </div>

        {/*
          Chips rather than the big three-up rail the other heroes use. This
          band is a few lines tall, and a rail would double its height for
          numbers that are supporting information here, not the headline.
        */}
        <dl className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-sm">
            <Zap size={13} aria-hidden="true" className="shrink-0 text-plug-cyan-400" />
            <dd className="font-mono text-ui-sm font-bold tabular-nums text-white">
              {filtered ? `${shown}/${total}` : total}
            </dd>
            <dt className="text-ui-xs text-white/60">
              {filtered ? 'shown' : total === 1 ? 'station' : 'stations'}
            </dt>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-sm">
            <MapPin size={13} aria-hidden="true" className="shrink-0 text-plug-cyan-400" />
            <dd className="font-mono text-ui-sm font-bold tabular-nums text-white">{cities}</dd>
            <dt className="text-ui-xs text-white/60">{cities === 1 ? 'city' : 'cities'}</dt>
          </div>
        </dl>
      </div>
    </header>
  )
}
