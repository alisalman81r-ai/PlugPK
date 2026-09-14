// src/components/route/RouteResultsView.tsx
'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'

import type { PlannedRoute } from '@/lib/types'
import { RouteMap } from './RouteMap'
import { RouteStopCard } from './RouteStopCard'
import { RouteSummaryBar } from './RouteSummaryBar'

export interface RouteResultsViewProps {
  route: PlannedRoute
}

/**
 * The result itself: the numbers, the stops in order, and the map beside them.
 *
 * It carries no chrome. Going back, saving and sharing all used to live in a
 * row at the top of this component, directly beneath a header that already had
 * a way out — two identical escapes a hundred pixels apart, plus an otherwise
 * empty band holding two right-aligned buttons. Those actions belong to the
 * page around the result, and that is where they are now.
 */
export function RouteResultsView({ route }: RouteResultsViewProps) {
  const startBattery = route.stops[0] ? route.stops[0].arrivalBatteryPercent + 25 : 80

  return (
    <div className="flex flex-col gap-8">
      <RouteSummaryBar route={route} />

      <div className="mt-2 grid items-start gap-10 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Zap size={20} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Charging Stops</h2>
            <span className="rounded-full border border-plug-blue-200 bg-plug-blue-50 px-3 py-1 text-sm font-semibold text-plug-blue-700">
              {route.stops.length} stop{route.stops.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-slate-600">
              Starting from {route.origin}
            </span>
            <span className="ml-auto font-mono text-green-600">{startBattery}%</span>
          </div>

          {/*
            No stops is a real answer, not an empty list.

            The planner only offers chargers that sit on the way — within a
            corridor of the line between the two places, and between them
            rather than behind or beyond. When a journey comes back with none,
            it is because there is no charger on this route in the data yet,
            and saying so is more use than a gap where the list would be.

            It is also the honest state of charging coverage in Pakistan, which
            this product should report rather than paper over.
          */}
          {route.stops.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-ui font-semibold text-slate-900">
                No charging stops on this route yet
              </p>
              <p className="mt-2 max-w-prose text-ui-sm leading-relaxed text-slate-600">
                We only suggest chargers that are actually on the way, and we do not
                have one listed between {route.origin} and {route.destination}. Plan
                to arrive with enough charge, or{' '}
                <Link
                  href="/partners"
                  className="font-medium text-plug-blue-600 underline-offset-2 hover:underline"
                >
                  list a charger
                </Link>{' '}
                if you know of one on this road.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {route.stops.map((stop, index) => (
              <div key={stop.station.id}>
                <RouteStopCard
                  stop={stop}
                  totalStops={route.stops.length}
                  isFirst={index === 0}
                  isLast={index === route.stops.length - 1}
                />
                {index < route.stops.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-4 block h-4 w-0 border-l-2 border-dashed border-slate-200"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-slate-600">
              Arriving at {route.destination}
            </span>
            <span className="ml-auto font-mono text-amber-600">~45%</span>
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <RouteMap route={route} />
        </div>
      </div>
    </div>
  )
}
