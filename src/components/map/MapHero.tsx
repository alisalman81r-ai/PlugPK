// src/components/map/MapHero.tsx
'use client'

import { LocateFixed, MapPin, Zap, type IconType } from '@/components/ui/icons'
import * as React from 'react'

/**
 * The map's opening band: heading, copy, search, and the figures behind them.
 *
 * Everything a visitor needs to start sits above the map rather than beside it.
 * The route used to drop straight into a split view with no heading at all,
 * which left nothing to orient by and nothing for a crawler to index on a page
 * whose content is a canvas element.
 *
 * It is deliberately short now. It used to carry a second copy of every filter
 * — speed pills and a tray of connector chips — which meant the same cut was
 * offered twice on one screen, once here and once in the panel. The filters all
 * live in one place, the rail lifted out of this band's lower edge (FilterRail);
 * this band orients, searches and hands over to it.
 *
 * Centred, because the map below is centred: a left-aligned heading over a
 * centred 1400px card reads as two layouts that were never shown each other.
 *
 * Every figure in the copy is counted from the data, never typed in. A
 * paragraph claiming coverage the map cannot show is the one thing on a page
 * like this that destroys trust, and a hardcoded number is wrong the first time
 * a station is added.
 *
 * Dark, matching the car and services heroes, so the map below reads as a
 * bright working surface set into the site.
 */

export interface MapHeroProps {
  total: number
  shown: number
  /** City names from the data, for the copy and the count. */
  cities: string[]
  /**
   * Ports installed across the stations shown.
   *
   * This was "free right now", counted from a status column. Plug.pk has no
   * live connection to any charger — the FAQ says so a scroll further down
   * this page — so the headline figure contradicted the page it sat on.
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
    <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-24 pt-10 sm:rounded-b-[2.5rem] sm:pb-28 lg:pb-32 lg:pt-14">
      {/*
        The decoration clips itself, and the band neither isolates nor hides its
        own overflow.
        Both matter because of what sits directly below: the filter rail is
        lifted up into this band's padding, so it paints above it — and the
        search suggestions have to paint above the rail. An `isolate` here would
        trap the dropdown's z-index inside the header, and `overflow-hidden`
        would cut it off at the header's bottom edge. Either one leaves a reader
        typing into a list they cannot see. The blobs still need clipping, so
        they get their own clipped layer instead.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        <div className="absolute -bottom-48 right-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
      </div>

      <div className="container-plug relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            <span className="block">EV chargers near you</span>
            <span className="block bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">all of Pakistan on one map</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
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
                .{' '}
                {/* The second sentence waits for room: on a phone the map comes
                    first and this band follows it, so it stays short. */}
                <span className="hidden sm:inline">
                  Search a city, filter by connector and speed, and get one-tap
                  directions — no app needed.
                </span>
              </>
            )}
          </p>

          {/* ── Search ───────────────────────────────────────────── */}
          {/* Desktop only: on a phone the same search is laid over the map,
              which comes first there. */}
          <div className="mx-auto mt-7 hidden max-w-xl md:block">{search}</div>

          {/* ── Locate ───────────────────────────────────────────── */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onLocateMe}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-5 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950"
            >
              <LocateFixed
                size={16}
                aria-hidden="true"
                className={isLocating ? 'animate-spin-slow' : undefined}
              />
              {isLocating ? 'Locating…' : 'Find chargers near me'}
            </button>
          </div>

          {/*
            The figures, on the line above the rail.
            Divided rather than boxed: three bordered cards here would read as
            the top row of the filter card that overlaps them.
          */}
          <dl className="mx-auto mt-8 grid max-w-lg grid-cols-3 items-start divide-x divide-white/10 sm:flex sm:items-center sm:justify-center">
            <Stat icon={MapPin} value={shown} total={shown === total ? undefined : total} label="shown on map" />
            <Stat icon={Zap} value={portsInstalled} label="ports installed" tone="cyan" />
            <Stat value={cities.length} label={cities.length === 1 ? 'city' : 'cities'} />
          </dl>
        </div>
      </div>
    </header>
  )
}

function Stat({
  icon: Icon,
  value,
  total,
  label,
  tone = 'plain',
}: {
  icon?: IconType
  value: number
  total?: number
  label: string
  tone?: 'plain' | 'cyan'
}) {
  return (
    <div className="px-2 py-1 text-center sm:px-5">
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
          {total !== undefined ? (
            <span className="font-mono text-ui-sm text-white/40">/ {total}</span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-balance text-ui-xs uppercase leading-snug tracking-[0.12em] text-white/45">
          {label}
        </span>
      </dd>
    </div>
  )
}
