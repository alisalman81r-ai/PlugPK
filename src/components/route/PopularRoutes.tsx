// src/components/route/PopularRoutes.tsx
'use client'

import { ArrowRight, Clock, Route as RouteIcon } from 'lucide-react'
import * as React from 'react'

import { estimateDriveMinutes, POPULAR_ROUTES, type PopularRoute } from '@/lib/route-distances'
import { cn, formatDuration } from '@/lib/utils'

/**
 * The corridors people actually drive, offered before the form.
 *
 * They used to sit at the very bottom of the page, below the planner and below
 * a three-step explainer — which is the wrong way round. Most visitors are
 * driving one of six roads, and for them the fastest possible route plan is one
 * tap, not two city fields, a car picker and a battery slider. The form is
 * still there for everyone else, one screen down.
 *
 * Each card states the distance and the drive time rather than a stop count:
 * the number of stops depends on the car, which is the question the planner
 * asks next, and a card that guessed at it would be contradicted by the results
 * page as often as not.
 */

export interface PopularRoutesProps {
  onSelect: (route: PopularRoute) => void
  className?: string
}

export function PopularRoutes({ onSelect, className }: PopularRoutesProps) {
  return (
    <section
      aria-labelledby="popular-routes-heading"
      className={cn(
        'overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-e4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 sm:px-8">
        {/* Heading and its one line of instruction stay together. Pushed to
            opposite ends of a 1400px card they read as two unrelated notices. */}
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
            <RouteIcon size={13} aria-hidden="true" />
            Start here
          </p>
          <h2
            id="popular-routes-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            Popular routes
          </h2>
          <p className="mt-1.5 text-ui text-slate-500">
            Tap one to load it into the planner below — then pick your car.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-ui-xs font-semibold text-slate-500">
          {POPULAR_ROUTES.length} corridors
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        {POPULAR_ROUTES.map((route) => (
          <RouteCard key={`${route.from}-${route.to}`} route={route} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

function RouteCard({
  route,
  onSelect,
}: {
  route: PopularRoute
  onSelect: (route: PopularRoute) => void
}) {
  const driveTime = formatDuration(estimateDriveMinutes(route.distanceKm))

  return (
    <button
      type="button"
      onClick={() => onSelect(route)}
      aria-label={`Plan ${route.from} to ${route.to}, about ${route.distanceKm} kilometres`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-plug-blue-200 hover:bg-white hover:shadow-e2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
    >
      {/*
        The two cities read down the card with the same green-to-red run the
        planner's own From and To fields use, so a card and the form it fills in
        are visibly the same thing.
      */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative min-w-0 pl-6">
          <span
            aria-hidden="true"
            className="absolute left-[3px] top-[7px] h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-[9px] left-[7px] top-[19px] border-l-2 border-dashed border-slate-300"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-[3px] left-[3px] h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/15"
          />

          <span className="block truncate text-ui-lg font-bold leading-snug text-slate-900">
            {route.from}
          </span>
          <span className="mt-2 block truncate text-ui-lg font-bold leading-snug text-slate-900">
            {route.to}
          </span>
        </div>

        <span className="shrink-0 text-right">
          <span className="block font-mono text-xl font-bold leading-none text-plug-blue-600">
            {route.distanceKm.toLocaleString('en-PK')}
          </span>
          <span className="mt-1 block font-mono text-ui-xs uppercase tracking-widest text-slate-400">
            km
          </span>
        </span>
      </div>

      <span className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 text-ui-sm text-slate-500">
            <Clock size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            {/* Approximate, and said so: it is distance over an assumed average
                speed, not a live traffic estimate. */}
            <span className="font-mono">~{driveTime}</span>
          </span>
          <span className="truncate text-ui-sm text-slate-400">{route.note}</span>
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200 transition-all duration-200 group-hover:bg-plug-blue-600 group-hover:text-white group-hover:ring-plug-blue-600">
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-px"
          />
        </span>
      </span>
    </button>
  )
}
