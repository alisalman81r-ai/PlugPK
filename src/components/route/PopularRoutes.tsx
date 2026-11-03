// src/components/route/PopularRoutes.tsx
'use client'

import { ArrowRight, Clock, Route as RouteIcon } from '@/components/ui/icons'
import * as React from 'react'

import { Lift, LiftBody, LiftHead, Tag } from '@/components/v2/ui'
import { estimateDriveMinutes, POPULAR_ROUTES, type PopularRoute } from '@/lib/route-distances'
import { cn, formatDuration } from '@/lib/utils'

/**
 * The corridors people actually drive, offered before the form, on the sheet
 * lifted into the hero (landing-v2 .lift with .rt-route cards).
 *
 * Most visitors are driving one of six roads, and for them the fastest
 * possible route plan is one tap, not two city fields, a car picker and a
 * battery slider. The form is still there for everyone else, one screen down.
 *
 * Each card states the distance and the drive time rather than a stop count:
 * the number of stops depends on the car, which is the question the planner
 * asks next, and a card that guessed at it would be contradicted by the results
 * page as often as not.
 */

export interface PopularRoutesProps {
  onSelect: (route: PopularRoute) => void
  /** The cities currently in the form, so the matching card reads as loaded. */
  origin?: string
  destination?: string
  className?: string
}

export function PopularRoutes({ onSelect, origin, destination, className }: PopularRoutesProps) {
  const norm = (s?: string) => (s ?? '').trim().toLowerCase()

  return (
    <Lift className={className}>
      <section aria-labelledby="popular-routes-heading">
        <LiftHead
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <RouteIcon size={15} aria-hidden="true" />
              Start here
            </span>
          }
          title={<span id="popular-routes-heading">Popular routes</span>}
          meta="Tap one to load it into the planner below — then pick your car."
          actions={
            <Tag mono className="bg-white text-muted">
              {POPULAR_ROUTES.length} corridors
            </Tag>
          }
        />

        <LiftBody>
          <ul role="list" className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {POPULAR_ROUTES.map((route) => (
              <li key={`${route.from}-${route.to}`}>
                <RouteCard
                  route={route}
                  onSelect={onSelect}
                  active={norm(origin) === norm(route.from) && norm(destination) === norm(route.to)}
                />
              </li>
            ))}
          </ul>
        </LiftBody>
      </section>
    </Lift>
  )
}

function RouteCard({
  route,
  onSelect,
  active,
}: {
  route: PopularRoute
  onSelect: (route: PopularRoute) => void
  active: boolean
}) {
  const driveTime = formatDuration(estimateDriveMinutes(route.distanceKm))

  return (
    <button
      type="button"
      onClick={() => onSelect(route)}
      aria-label={`Plan ${route.from} to ${route.to}, about ${route.distanceKm} kilometres`}
      aria-pressed={active}
      className={cn(
        'group grid h-full w-full gap-[18px] rounded-[22px] border-[1.5px] bg-white px-4 pb-3.5 pt-[18px] text-left sm:px-5 sm:pb-4 sm:pt-5',
        // .rt-route: lifts 4px on hover (the translate property, eased), and
        // presses to .985 on :active with no transition, as the design does.
        '[transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:[translate:0_-4px] active:[scale:.985]',
        'focus-visible:outline-none focus-visible:shadow-focus',
        // .is-on outranks :hover in the design, so a loaded card keeps its ring.
        active
          ? 'border-ink [box-shadow:0_0_0_4px_rgba(212,255,58,.55),var(--shadow-e1)]'
          : 'border-ink/10 shadow-e1 hover:border-ink/20 hover:shadow-e2',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        {/* The two cities read down the card with the green-to-ember run the
            planner's own From and To fields use. */}
        <span className="relative grid min-w-0 gap-3 pl-5 text-base font-semibold leading-[1.2] text-ink">
          <span aria-hidden="true" className="absolute left-1 top-[13px] h-4 border-l-[1.5px] border-dashed border-ink/25" />
          <span className="relative min-w-0">
            <span aria-hidden="true" className="absolute -left-5 top-1/2 -mt-[5px] h-2.5 w-2.5 rounded-full bg-[#35D07F] shadow-[0_0_0_3px_rgba(53,208,127,.2)]" />
            <span className="block truncate">{route.from}</span>
          </span>
          <span className="relative min-w-0">
            <span aria-hidden="true" className="absolute -left-5 top-1/2 -mt-[5px] h-2.5 w-2.5 rounded-full bg-ember shadow-[0_0_0_3px_rgba(255,90,31,.18)]" />
            <span className="block truncate">{route.to}</span>
          </span>
        </span>

        <span className="grid shrink-0 justify-items-end gap-1">
          <b className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
            {route.distanceKm.toLocaleString('en-PK')}
          </b>
          <small className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-fog">KM</small>
        </span>
      </span>

      <span className="flex items-center gap-3 border-t border-dashed border-ink/10 pt-3.5 text-[13px] text-muted">
        {/* Approximate, and said so: distance over an assumed average speed,
            not a live traffic estimate. */}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[13px] font-semibold text-ink">
          <Clock size={15} className="shrink-0 text-muted" aria-hidden="true" />~{driveTime}
        </span>
        <span className="min-w-0 flex-1 truncate">{route.note}</span>
        <span
          aria-hidden="true"
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full [transition:background-color_.3s,color_.3s,transform_.4s_cubic-bezier(.34,1.56,.64,1)]',
            active ? '-rotate-45 bg-ink text-volt' : 'bg-chalk text-ink group-hover:-rotate-45 group-hover:bg-ink group-hover:text-volt',
          )}
        >
          <ArrowRight size={16} />
        </span>
      </span>
    </button>
  )
}
