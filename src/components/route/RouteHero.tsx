// src/components/route/RouteHero.tsx
'use client'

import { Car, MapPin, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

/**
 * The planner's opening band.
 *
 * Same shape as the map's hero on purpose — dark, centred, rounded off at the
 * bottom, with the next section lifted up into it — because these are the two
 * halves of one job: find a charger, or plan around several. Two different
 * arrival experiences for that would read as two different products.
 *
 * The figures are counted from the data at render time. A route planner is
 * exactly the kind of page where a made-up "500+ stations" would be caught the
 * moment somebody planned a journey and found six.
 */

export interface RouteHeroProps {
  /** Vehicles the planner can size stops for. */
  vehicleCount: number
  /** Stations it can route through. */
  stationCount: number
  /** Cities with at least one of those stations. */
  cityCount: number
}

export function RouteHero({ vehicleCount, stationCount, cityCount }: RouteHeroProps) {
  return (
    <header className="relative rounded-b-[2rem] bg-slate-950 pb-28 pt-10 sm:rounded-b-[2.5rem] sm:pb-32 lg:pb-40 lg:pt-14">
      {/* The decoration clips itself so the band does not have to. Anything
          with a dropdown in it — the planner's city fields sit close below —
          needs the header to keep its overflow visible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        <div className="absolute -bottom-48 left-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
      </div>

      <div className="container-plug relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
            <Zap size={12} aria-hidden="true" />
            EV route planner
          </span>

          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            Plan the drive —{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              charging stops and all
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
            Pick a popular corridor below or enter your own two cities. Tell us what you drive and
            how much charge you have, and we size the stops around your car&apos;s real range.
          </p>

          <dl className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center divide-white/10 sm:divide-x">
            <Stat icon={Car} value={vehicleCount} label="EVs supported" />
            <Stat icon={Zap} value={stationCount} label="stations to route via" tone="cyan" />
            <Stat icon={MapPin} value={cityCount} label={cityCount === 1 ? 'city' : 'cities'} />
          </dl>
        </div>
      </div>
    </header>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
  tone = 'plain',
}: {
  icon?: LucideIcon
  value: number
  label: string
  tone?: 'plain' | 'cyan'
}) {
  return (
    <div className="px-5 py-1 text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-center justify-center gap-1.5">
          {Icon ? (
            <Icon
              size={14}
              aria-hidden={true}
              className={tone === 'cyan' ? 'text-plug-cyan-400' : 'text-white/40'}
            />
          ) : null}
          <span className="font-mono text-lg font-bold text-white">{value}</span>
        </span>
        <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/45">
          {label}
        </span>
      </dd>
    </div>
  )
}
