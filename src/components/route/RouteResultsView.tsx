// src/components/route/RouteResultsView.tsx
'use client'

import { Zap } from 'lucide-react'

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
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
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
