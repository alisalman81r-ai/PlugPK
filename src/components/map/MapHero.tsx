// src/components/map/MapHero.tsx
'use client'

import { LocateFixed, MapPin, Zap } from '@/components/ui/icons'
import * as React from 'react'

import { Hl, btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * The map's opening band (the landing-v2 .phero): a centred Power Grotesk
 * title whose second line is volt, the counted copy, the search pill, the
 * volt "find chargers near me" button and the stats strip.
 *
 * It is a local variant of the shared PageHero rather than PageHero itself for
 * one reason: PageHero clips its own overflow, and the search suggestions drop
 * below the field — over the filter sheet lifted into this band's lower edge.
 * A clipped band would cut the list off at its bottom edge. So the grid and
 * glow get their own clipped layer and the band itself does not isolate or
 * clip.
 *
 * Every figure in the copy is counted from the data, never typed in. A
 * paragraph claiming coverage the map cannot show is the one thing on a page
 * like this that destroys trust, and a hardcoded number is wrong the first time
 * a station is added.
 */

export interface MapHeroProps {
  total: number
  shown: number
  /** City names from the data, for the copy and the count. */
  cities: string[]
  /**
   * Ports installed across the stations shown — a count of hardware, not a
   * reading: plugpk has no live connection to any charger.
   */
  portsInstalled: number
  /**
   * How many of `total` are sample listings (lib/sample-listings). The copy
   * says so, rather than counting six examples as six places to charge.
   */
  exampleCount: number
  onLocateMe: () => void
  isLocating: boolean
  /** The search field, passed in so this owns layout and not behaviour. */
  search: React.ReactNode
}

export function MapHero({
  total,
  shown,
  cities,
  portsInstalled,
  exampleCount,
  onLocateMe,
  isLocating,
  search,
}: MapHeroProps) {
  /** Named cities for the copy, with the rest summarised rather than listed. */
  const named = cities.slice(0, 3)
  const others = cities.length - named.length

  return (
    <header
      data-theme="dark"
      className="relative rounded-b-[32px] bg-ink pb-[150px] pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px] sm:pb-[196px]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[32px] sm:rounded-b-[48px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]" />
        <div className="absolute -top-[260px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]" />
      </div>

      <div className="relative mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        <h1 className="m-0 text-balance font-display text-[clamp(42px,5.6vw,88px)] leading-none">
          EV chargers near you <Hl dark className="block">all of Pakistan on one map</Hl>
        </h1>

        <p className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70">
          {total === 0 ? (
            <>No stations are listed yet. As operators add chargers they appear here.</>
          ) : (
            <>
              {total} charging {total === 1 ? 'station' : 'stations'}
              {named.length > 0 ? (
                <>
                  {' '}
                  across {named.join(', ')}
                  {others > 0 ? ` and ${others} more ${others === 1 ? 'city' : 'cities'}` : ''}
                </>
              ) : null}
              {exampleCount > 0
                ? exampleCount === total
                  ? ' — all of them example listings for now'
                  : ` — ${exampleCount} of them example listings`
                : ''}
              . Search a city, filter by connector and speed, and get one-tap directions — no app
              needed.
            </>
          )}
        </p>

        {/* ── Search (the .psearch pill) ─────────────────────── */}
        <div className="relative z-[5] mt-[34px] w-full max-w-[640px]">{search}</div>

        {/* ── Locate ─────────────────────────────────────────── */}
        <div className="mt-[18px] flex w-full justify-center">
          <button
            type="button"
            onClick={onLocateMe}
            aria-busy={isLocating}
            className={btnClass('volt', 'lg', 'w-full sm:w-auto')}
          >
            <LocateFixed aria-hidden="true" className={isLocating ? 'animate-spin motion-reduce:animate-none' : undefined} />
            {isLocating ? 'Locating…' : 'Find chargers near me'}
          </button>
        </div>

        {/* ── Stats (.pstats) ────────────────────────────────── */}
        <dl className="mt-[30px] grid w-full grid-cols-3 rounded-[22px] sm:flex sm:w-auto sm:justify-center border border-white/[0.09] bg-white/[0.03]">
          <Stat
            icon={<MapPin aria-hidden="true" className="h-[17px] w-[17px] text-volt" />}
            value={shown}
            total={shown === total ? undefined : total}
            label="shown on map"
          />
          <Stat
            icon={<Zap aria-hidden="true" className="h-[17px] w-[17px] fill-volt text-volt" />}
            value={portsInstalled}
            label="ports installed"
            divided
          />
          <Stat value={cities.length} label={cities.length === 1 ? 'city' : 'cities'} divided />
        </dl>
      </div>
    </header>
  )
}

function Stat({
  icon,
  value,
  total,
  label,
  divided = false,
}: {
  icon?: React.ReactNode
  value: number
  total?: number
  label: string
  divided?: boolean
}) {
  return (
    <div className={cn('grid content-start justify-items-center gap-1.5 px-2 py-3 sm:px-[34px] sm:py-4', divided && 'border-l border-white/[0.09]')}>
      <dt className="sr-only">{label}</dt>
      <dd className="contents">
        <b className="inline-flex items-center gap-1.5 font-mono text-[22px] font-semibold leading-none tabular-nums text-white sm:text-[30px]">
          {icon}
          {value}
          {total !== undefined ? <span className="text-sm font-medium text-white/40">/ {total}</span> : null}
        </b>
        <span aria-hidden="true" className="max-w-[7rem] text-balance font-mono text-[11px] sm:max-w-none sm:whitespace-nowrap font-semibold uppercase leading-snug tracking-[0.16em] text-white/50">
          {label}
        </span>
      </dd>
    </div>
  )
}
