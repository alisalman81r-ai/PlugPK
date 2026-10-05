// src/components/route/RouteResultsView.tsx
'use client'

import { AlertTriangle, Info, Zap } from '@/components/ui/icons'
import Link from 'next/link'

import type { PlannedTrip } from '@/hooks/useRoutePlanner'
import { RESERVE_PERCENT, RANGE_DERATE, TARGET_PERCENT, withArticle } from '@/lib/route-plan'
import { RouteMap } from './RouteMap'
import { RouteStopCard } from './RouteStopCard'
import { RouteSummaryBar } from './RouteSummaryBar'

export interface RouteResultsViewProps {
  trip: PlannedTrip
}

/**
 * The result itself: the numbers, the stops in order, and the map beside them.
 *
 * Every percentage on this screen comes from the plan. The start used to be
 * reconstructed as "first stop's arrival + 25", the arrival was a hard-coded
 * "~45%" here and "~80%" on the map beside it, and a trip the car could not
 * make came back as "0 stops" with nothing to say it would not get there.
 *
 * It carries no chrome. Going back, saving and sharing belong to the page
 * around the result, and that is where they are.
 */
export function RouteResultsView({ trip }: RouteResultsViewProps) {
  const { plan } = trip
  const unreachable = plan.status === 'unreachable'

  return (
    <div className="flex flex-col gap-8">
      {/*
        A trip the car cannot make is the headline, not a footnote. Blocking
        in tone and first on the page, above the numbers, so nobody reads a
        distance and a drive time and sets off.
      */}
      {unreachable ? (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              This trip cannot be made on the chargers we list.
            </p>
            <p className="mt-1 text-ui-sm leading-relaxed">{plan.reason}</p>
            {plan.stops.length > 0 ? (
              <p className="mt-1 text-ui-sm leading-relaxed">
                The stops below get you as far as the listed chargers allow.
              </p>
            ) : null}
            <p className="mt-2 text-ui-sm">
              Know of a charger on this road?{' '}
              <Link href="/partners" className="font-semibold underline underline-offset-2">
                List it
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      {plan.warnings.length > 0 ? (
        <ul className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-ui-sm text-amber-900">
          {plan.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      <RouteSummaryBar trip={trip} />

      <div className="mt-2 grid items-start gap-10 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Zap size={20} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Charging Stops</h2>
            <span className="rounded-full border border-plug-blue-200 bg-plug-blue-50 px-3 py-1 text-sm font-semibold text-plug-blue-700">
              {plan.stops.length} stop{plan.stops.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-slate-600">Starting from {trip.origin}</span>
            <span className="ml-auto font-mono text-green-600">{trip.startPercent}%</span>
          </div>

          {/* No stops on a trip that fits: say so, so an empty list reads as
              an answer rather than as a gap. */}
          {plan.stops.length === 0 && !unreachable ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-ui font-semibold text-slate-900">No charging stop needed</p>
              <p className="mt-2 max-w-prose text-ui-sm leading-relaxed text-slate-600">
                Leaving with {trip.startPercent}%, {withArticle(`${trip.vehicle.make} ${trip.vehicle.model}`)} covers
                the {trip.totalDistanceKm.toLocaleString('en-PK')} km and arrives with about{' '}
                {plan.arrivalPercent}%.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {plan.stops.map((stop, index) => (
              <div key={`${stop.station.id}-${stop.order}`}>
                <RouteStopCard stop={stop} totalStops={plan.stops.length} />
                {index < plan.stops.length - 1 ? (
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
            <span className="text-sm font-medium text-slate-600">Arriving at {trip.destination}</span>
            <span className="ml-auto font-mono text-amber-600">
              {plan.arrivalPercent !== null ? `~${plan.arrivalPercent}%` : 'Not reached'}
            </span>
          </div>

          {/* The assumptions, in one place, so the numbers above can be judged. */}
          <p className="mt-8 flex gap-2 text-ui-xs leading-relaxed text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              An estimate, not a promise. Planned on {Math.round(RANGE_DERATE * 100)}% of the
              car&apos;s rated range ({plan.usableRangeKm} km from a full battery) for motorway
              speeds and air-conditioning, keeping {RESERVE_PERCENT}% in reserve and charging to{' '}
              {TARGET_PERCENT}% unless more is needed. Only listed chargers your car can plug into
              are used. Plug.pk has no live view of whether a charger is free or working.
            </span>
          </p>
        </div>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <RouteMap trip={trip} />
        </div>
      </div>
    </div>
  )
}
