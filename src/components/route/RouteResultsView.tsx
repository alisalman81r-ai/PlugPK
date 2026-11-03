// src/components/route/RouteResultsView.tsx
'use client'

import { AlertTriangle, Map as MapIcon, X, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Btn, Tag } from '@/components/v2/ui'
import type { PlannedTrip } from '@/hooks/useRoutePlanner'
import { estimateDriveMinutes } from '@/lib/route-distances'
import { RESERVE_PERCENT, RANGE_DERATE, TARGET_PERCENT, vehicleName, withArticle, type PlanLeg } from '@/lib/route-plan'
import type { Station } from '@/lib/types'
import { cn, formatDuration } from '@/lib/utils'
import { RouteMap } from './RouteMap'
import { RouteStopCard, SocPill } from './RouteStopCard'
import { RouteSummaryBar } from './RouteSummaryBar'

export interface RouteResultsViewProps {
  trip: PlannedTrip
  /** Every listed charger, for the map's faint network dots. */
  stations?: Station[]
  /** Save / share / sign-in controls, placed at the foot of the plan. */
  actions?: React.ReactNode
}

/**
 * The result itself (landing-v2 .rplan beside .rmapc): the numbers, the stops
 * in order on a timeline with every leg between them, and the map beside it.
 *
 * Every percentage on this screen comes from the plan, legs included. A trip
 * the car cannot make is said so first, above the numbers, so nobody reads a
 * distance and a drive time and sets off.
 */
export function RouteResultsView({ trip, stations, actions }: RouteResultsViewProps) {
  const { plan } = trip
  const unreachable = plan.status === 'unreachable'
  const n = plan.stops.length
  const finalLeg: PlanLeg | undefined = plan.legs[n]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <article className="rounded-3xl border border-ink/10 bg-white p-[clamp(18px,3vw,36px)] shadow-e1 sm:rounded-[32px]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">Your plan</span>
          {unreachable ? (
            <Tag tone="red" mono>
              Not possible on listed chargers
            </Tag>
          ) : n > 0 ? (
            <Tag tone="volt" mono>
              {n} stop{n === 1 ? '' : 's'}
            </Tag>
          ) : (
            <Tag tone="green" mono>
              No stop needed
            </Tag>
          )}
        </div>

        <h2 className="mt-4 font-display text-[clamp(28px,3vw,40px)] leading-[1.05] text-ink">
          {trip.origin}
          <span aria-hidden="true" className="mx-[0.2em] text-fog [-webkit-text-stroke:0]">
            →
          </span>
          <span className="sr-only"> to </span>
          {trip.destination}
        </h2>
        <p className="mt-2 text-sm text-muted">
          <b className="font-semibold text-ink">{vehicleName(trip.vehicle)}</b> · planned on{' '}
          <span className="font-mono">
            {trip.vehicle.rangeKm} km × {Math.round(RANGE_DERATE * 100)}% = {plan.usableRangeKm} km
          </span>{' '}
          at 100% · leaving on <span className="font-mono">{trip.startPercent}%</span>
        </p>

        {unreachable ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-[#FFCDBC] bg-[#FFF4EF] px-4 py-3.5 text-sm leading-[1.55] text-[#6A2003]"
          >
            <strong className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-[#B42E05]">
              <AlertTriangle size={17} className="shrink-0" aria-hidden="true" />
              This trip cannot be made on the chargers we list.
            </strong>
            <p>{plan.reason}</p>
            {n > 0 ? <p className="mt-1">The stops below get you as far as the listed chargers allow.</p> : null}
            <p className="mt-2">
              Know of a charger on this road?{' '}
              <Link href="/partners" className="font-semibold underline underline-offset-2">
                List it
              </Link>
              .
            </p>
          </div>
        ) : null}

        {plan.warnings.length > 0 ? (
          <ul className="mt-5 grid gap-2 rounded-2xl border border-[#FFE0A3] bg-[#FFF6E3] px-4 py-3.5 text-sm leading-[1.55] text-[#8A5300]">
            {plan.warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {warning}
              </li>
            ))}
          </ul>
        ) : null}

        <RouteSummaryBar trip={trip} />

        <h3 className="sr-only">Charging stops</h3>
        <ol role="list" className="mt-[26px]">
          <TlNode marker={<span className="h-3.5 w-3.5 rounded-full bg-[#35D07F]" />} markerClass="bg-[#E9F8EF]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-base font-semibold leading-[1.35] text-ink">{trip.origin}</span>
              <span className="whitespace-nowrap font-mono text-sm font-semibold">
                Leave on <SocPill value={trip.startPercent} />
              </span>
            </div>
            <p className="mt-[3px] text-[13.5px] text-muted">Start</p>
          </TlNode>

          {plan.stops.map((stop, i) => {
            const leg = plan.legs[i]
            return (
              <React.Fragment key={`${stop.station.id}-${stop.order}`}>
                {leg && leg.km > 0.5 ? <TlLeg leg={leg} /> : null}
                <TlNode
                  marker={<Zap size={17} className="fill-current" aria-hidden="true" />}
                  markerClass="bg-ink text-volt shadow-[inset_0_0_0_3px_#D4FF3A,0_6px_16px_-6px_rgba(11,12,14,.5)]"
                >
                  <RouteStopCard stop={stop} totalStops={n} />
                </TlNode>
              </React.Fragment>
            )
          })}

          {/* No stops on a trip that fits: say so, so an empty list reads as
              an answer rather than as a gap. */}
          {finalLeg ? <TlLeg leg={finalLeg} /> : unreachable ? <TlLeg bad /> : null}

          {unreachable ? (
            <TlNode marker={<X size={17} aria-hidden="true" />} markerClass="bg-[#FFECE6] text-[#B42E05]">
              <span className="text-base font-semibold leading-[1.35] text-ink">{trip.destination} is out of reach</span>
              <p className="mt-[3px] text-[13.5px] text-muted">Destination · not reached on the chargers listed today</p>
            </TlNode>
          ) : (
            <TlNode marker={<span className="h-3.5 w-3.5 rounded-full bg-ember" />} markerClass="bg-[#FFECE6]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-base font-semibold leading-[1.35] text-ink">{trip.destination}</span>
                {plan.arrivalPercent !== null ? (
                  <span className="whitespace-nowrap font-mono text-sm font-semibold">
                    Arrive on <SocPill value={plan.arrivalPercent} tone="to" />
                  </span>
                ) : null}
              </div>
              <p className="mt-[3px] text-[13.5px] text-muted">
                Destination
                {n === 0 && plan.arrivalPercent !== null
                  ? ` · no charging stop needed: leaving with ${trip.startPercent}%, ${withArticle(vehicleName(trip.vehicle))} covers the ${trip.totalDistanceKm.toLocaleString('en-PK')} km and arrives with about ${plan.arrivalPercent}%.`
                  : ''}
              </p>
            </TlNode>
          )}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {actions}
          <Btn href="/map" variant="ghost" size="sm">
            <MapIcon aria-hidden="true" />
            See chargers on the map
          </Btn>
        </div>

        {/* The assumptions, in one place, so the numbers above can be judged. */}
        <p className="mt-[18px] text-[12.5px] leading-[1.6] text-muted">
          An estimate, not a promise. Planned on {Math.round(RANGE_DERATE * 100)}% of the car&apos;s rated range (
          {plan.usableRangeKm} km from a full battery) for motorway speeds and air-conditioning, keeping{' '}
          {RESERVE_PERCENT}% in reserve and charging to {TARGET_PERCENT}% unless more is needed. Only listed
          chargers your car can plug into are used. The map draws straight lines between places; it does not
          route along roads. plugpk has no live view of whether a charger is free or working, so call ahead
          before you rely on a stop.
        </p>
      </article>

      <RouteMap trip={trip} stations={stations} className="lg:sticky lg:top-24" />
    </div>
  )
}

/** A place on the timeline (.tl__node): a round marker on the rail, then its body. */
function TlNode({
  marker,
  markerClass,
  children,
}: {
  marker: React.ReactNode
  markerClass: string
  children: React.ReactNode
}) {
  return (
    <li className="grid grid-cols-[36px_1fr] gap-x-3 sm:grid-cols-[40px_1fr] sm:gap-x-3.5">
      <div className="relative grid justify-items-center">
        <span
          aria-hidden="true"
          className={cn(
            'relative z-[1] grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10',
            markerClass,
          )}
        >
          {marker}
        </span>
      </div>
      <div className="min-w-0 pb-1 pt-[7px]">{children}</div>
    </li>
  )
}

/** The drive between two places (.tl__leg): distance, time, charge used, as a bar. */
function TlLeg({ leg, bad = false }: { leg?: PlanLeg; bad?: boolean }) {
  return (
    <li aria-hidden={leg ? undefined : true} className="grid grid-cols-[36px_1fr] gap-x-3 sm:grid-cols-[40px_1fr] sm:gap-x-3.5">
      <div className="relative">
        <span
          className={cn(
            'absolute bottom-0 left-1/2 top-0 border-l-2 border-dashed',
            bad ? 'border-[rgba(255,90,31,.5)]' : 'border-ink/20',
          )}
        />
      </div>
      <div className="min-w-0 pb-[18px] pt-3.5">
        {leg ? (
          <>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-mono text-[13px] font-medium text-muted">
              <span>
                Drive <b className="font-semibold text-ink">{leg.km.toLocaleString('en-PK')} km</b>
              </span>
              <span>~{formatDuration(estimateDriveMinutes(leg.km))}</span>
              <span>
                {Math.round(leg.startPercent)}% → {Math.round(leg.endPercent)}%
              </span>
            </div>
            <div aria-hidden="true" className="relative mt-2.5 h-2 max-w-[360px] overflow-hidden rounded-lg bg-stone">
              <i
                className={cn(
                  'absolute bottom-0 top-0 rounded-lg',
                  leg.endPercent < RESERVE_PERCENT
                    ? 'bg-[linear-gradient(90deg,#FF5A1F,#FFB020)]'
                    : 'bg-[linear-gradient(90deg,#BDEB1F,#D4FF3A)]',
                )}
                style={{
                  left: `${Math.max(0, leg.endPercent)}%`,
                  width: `${Math.max(1, leg.startPercent - Math.max(0, leg.endPercent))}%`,
                }}
              />
            </div>
          </>
        ) : (
          <span className="font-mono text-[13px] text-[#B42E05]">No listed charger close enough to keep going</span>
        )}
      </div>
    </li>
  )
}
