// src/components/home/FeaturedStations.tsx
'use client'

import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { TiltCard } from '@/components/ui'
import type { Station } from '@/lib/types'
import { getPortAvailability } from '@/lib/utils'

import { StationCard } from './StationCard'

export interface FeaturedStationsProps {
  /**
   * Passed in from the page rather than imported from mock-data. This section
   * used to read MOCK_STATIONS directly, which meant adding or editing a
   * station in the admin changed the station's own page but never this one.
   */
  stations: Station[]
}

export function FeaturedStations({ stations }: FeaturedStationsProps) {
  const [savedIds, setSavedIds] = React.useState<string[]>([])

  const toggleSaved = React.useCallback((stationId: string) => {
    setSavedIds((current) =>
      current.includes(stationId)
        ? current.filter((id) => id !== stationId)
        : [...current, stationId],
    )
  }, [])

  // A live figure rather than a claim: how many ports are open right now
  // across the stations actually being shown.
  const free = stations.reduce((sum, s) => sum + getPortAvailability(s).available, 0)
  const total = stations.reduce((sum, s) => sum + getPortAvailability(s).total, 0)

  if (stations.length === 0) {
    return null
  }

  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="container-plug">
        {/* Header on one baseline: the heading and the link sit on the same
            row so the eye is not sent right, then back left, then right. */}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-black leading-[1.08] tracking-[-0.02em] text-slate-900">
              Stations worth the detour
            </h2>
            <p className="mt-3 max-w-lg text-pretty leading-relaxed text-slate-600">
              The highest-rated sites on the network, with live availability from the
              operators themselves.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {total > 0 ? (
              <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 sm:inline-flex">
                <Zap size={13} className="shrink-0 fill-emerald-600 text-emerald-600" aria-hidden="true" />
                <span className="font-mono text-ui-sm font-semibold tabular-nums text-emerald-800">
                  {free}/{total}
                </span>
                <span className="text-ui-sm text-emerald-700">ports free</span>
              </span>
            ) : null}

            <Link
              href="/map"
              className="group/all inline-flex items-center gap-1.5 text-ui font-semibold text-plug-blue-600 transition-colors hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-4"
            >
              View all
              <ArrowRight
                size={15}
                className="shrink-0 transition-transform duration-200 group-hover/all:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {stations.map((station, index) => (
            // The tilt lives on a wrapper, not on StationCard — the same card
            // renders on the map and in the dashboard, where a card that
            // moves under the pointer would be a nuisance rather than a
            // flourish.
            <TiltCard key={station.id} className="h-full">
              <StationCard
                station={station}
                animationDelay={index * 90}
                isSaved={savedIds.includes(station.id)}
                onSave={toggleSaved}
                className="h-full animate-fade-up opacity-0"
              />
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}
