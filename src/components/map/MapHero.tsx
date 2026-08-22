// src/components/map/MapHero.tsx
'use client'

import { Clock, LocateFixed, SlidersHorizontal, Zap } from 'lucide-react'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { ChargingSpeed, ConnectorType, StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The map's opening band: heading, copy, search, quick filters.
 *
 * Everything a visitor needs to start sits above the map rather than beside it.
 * The route used to drop straight into a split view with no heading at all,
 * which left nothing to orient by and nothing for a crawler to index on a page
 * whose content is a canvas element.
 *
 * The copy is written from the data, never typed in: the station and city
 * counts and the city names all come from what is actually in the database. A
 * paragraph claiming coverage the map cannot show is the one thing on a page
 * like this that destroys trust, and a hardcoded figure is wrong the first time
 * a station is added.
 *
 * Filters are split by frequency, not by category. The pills are the cuts
 * almost everybody makes — speed, and where I am — and the tray beneath holds
 * connector and power, which is the next question. Anything rarer (amenities, a
 * rating floor) stays behind the All filters button, so the common path is two
 * taps and the rare one is still reachable.
 *
 * Dark, matching the car and services heroes, so the map below reads as a
 * bright working surface set into the site.
 */

export interface MapHeroProps {
  total: number
  shown: number
  /** City names from the data, for the copy and the count. */
  cities: string[]
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  activeFilterCount: number
  onOpenAllFilters: () => void
  onLocateMe: () => void
  isLocating: boolean
  /** The search field, passed in so this owns layout and not behaviour. */
  search: React.ReactNode
}

/**
 * The quick speed cuts.
 *
 * DC fast covers rapid and ultra together, because "DC" is how a driver thinks
 * about it and nobody arrives wanting to separate 50 kW from 150 kW before
 * they have seen the map.
 */
const SPEED_PILLS: Array<{ label: string; speed: ChargingSpeed | null }> = [
  { label: 'All', speed: null },
  { label: 'DC fast', speed: 'rapid' },
  { label: 'AC', speed: 'fast' },
]

/** Round figures a driver reads off a charger, not the raw kW in the data. */
const POWER_STEPS: Array<{ label: string; speed: ChargingSpeed | null }> = [
  { label: 'Any', speed: null },
  { label: 'Slow', speed: 'slow' },
  { label: 'Fast', speed: 'fast' },
  { label: 'Rapid', speed: 'rapid' },
  { label: 'Ultra', speed: 'ultra' },
]

const CONNECTOR_LABEL: Record<ConnectorType, string> = {
  CCS2: 'CCS2',
  CHAdeMO: 'CHAdeMO',
  Type2: 'Type 2',
  Type1: 'Type 1',
  GBT: 'GB/T',
}

export function MapHero({
  total,
  shown,
  cities,
  filters,
  onUpdateFilter,
  activeFilterCount,
  onOpenAllFilters,
  onLocateMe,
  isLocating,
  search,
}: MapHeroProps) {
  const toggleConnector = (type: ConnectorType) => {
    onUpdateFilter(
      'connectorTypes',
      filters.connectorTypes.includes(type)
        ? filters.connectorTypes.filter((entry) => entry !== type)
        : [...filters.connectorTypes, type],
    )
  }

  /** Named cities for the copy, with the rest summarised rather than listed. */
  const named = cities.slice(0, 3)
  const others = cities.length - named.length

  return (
    <header className="relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 -z-10 h-80 w-80 rounded-full bg-plug-blue-600/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-72 w-72 rounded-full bg-plug-cyan-500/20 blur-[110px]"
      />

      <div className="container-plug py-7 lg:py-9">
        {/* The accent bar makes the heading an object rather than a line of
            text, and it is the one place brand colour appears at this size. */}
        <div className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-1 w-1 shrink-0 rounded-full bg-gradient-to-b from-plug-cyan-400 to-plug-blue-600"
          />

          <div className="min-w-0">
            <h1 className="font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-white">
              EV chargers near you —{' '}
              <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
                Pakistan&apos;s live charging map
              </span>
            </h1>

            {/* Every figure here is counted from the data. */}
            <p className="mt-3 max-w-2xl text-pretty text-ui leading-relaxed text-white/65">
              {total === 0 ? (
                <>No stations are listed yet. As operators add chargers they appear here.</>
              ) : (
                <>
                  {total} charging {total === 1 ? 'station' : 'stations'} on one live map
                  {named.length > 0 ? (
                    <>
                      {' '}
                      across {named.join(', ')}
                      {others > 0 ? ` and ${others} more ${others === 1 ? 'city' : 'cities'}` : ''}
                    </>
                  ) : null}
                  . Filter by connector and speed, tap{' '}
                  <span className="font-semibold text-white/85">Near me</span> for the closest
                  ones, and get one-tap directions — no app needed.
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────────────── */}
        <div className="mt-6 max-w-2xl">{search}</div>

        {/* ── Quick filters ──────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {SPEED_PILLS.map((pill) => (
            <Pill
              key={pill.label}
              active={filters.chargingSpeed === pill.speed}
              onClick={() => onUpdateFilter('chargingSpeed', pill.speed)}
            >
              {pill.label}
            </Pill>
          ))}

          <Pill active={activeFilterCount > 0} onClick={onOpenAllFilters}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            All filters
            {activeFilterCount > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-plug-blue-600 px-1 font-mono text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Pill>

          {/* Accented, because this is the action the page is named after. */}
          <button
            type="button"
            onClick={onLocateMe}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-4 text-ui-sm font-bold text-slate-950 transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <LocateFixed
              size={14}
              aria-hidden="true"
              className={isLocating ? 'animate-spin-slow' : undefined}
            />
            {isLocating ? 'Locating…' : 'Near me'}
          </button>

          <p aria-live="polite" className="ml-auto shrink-0 text-ui-sm text-white/60">
            <span className="font-bold text-white">{shown}</span>
            {shown !== total ? <span className="text-white/40"> of {total}</span> : null}{' '}
            {shown === 1 ? 'station' : 'stations'}
          </p>
        </div>

        {/* ── The tray ───────────────────────────────────────── */}
        <div className="mt-4 grid gap-x-8 gap-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-[auto_auto_auto] lg:justify-start">
          <TrayGroup label="Connector">
            {CONNECTOR_TYPES.map((type) => (
              <Chip
                key={type}
                active={filters.connectorTypes.includes(type)}
                onClick={() => toggleConnector(type)}
              >
                {CONNECTOR_LABEL[type]}
              </Chip>
            ))}
          </TrayGroup>

          <TrayGroup label="Charging speed">
            {POWER_STEPS.map((step) => (
              <Chip
                key={step.label}
                active={filters.chargingSpeed === step.speed}
                onClick={() => onUpdateFilter('chargingSpeed', step.speed)}
              >
                {step.label}
              </Chip>
            ))}
          </TrayGroup>

          <TrayGroup label="Show only">
            <Chip
              active={filters.availableOnly}
              onClick={() => onUpdateFilter('availableOnly', !filters.availableOnly)}
            >
              <Zap size={12} aria-hidden="true" />
              Available now
            </Chip>
            <Chip
              active={filters.minRating >= 4}
              // A rating floor rather than an opening-hours claim: the data has
              // ratings, and nothing here records 24/7 opening, so a "24/7"
              // chip would be a filter that could never be honest.
              onClick={() => onUpdateFilter('minRating', filters.minRating >= 4 ? 0 : 4)}
            >
              <Clock size={12} aria-hidden="true" />
              Rated 4+
            </Chip>
          </TrayGroup>
        </div>
      </div>
    </header>
  )
}

function TrayGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-2.5 text-ui-xs font-bold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

/** The larger control, for the row above the tray. */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-ui-sm font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        active
          ? 'border-white/70 bg-white text-slate-950'
          : 'border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-sm hover:border-white/35 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

/** The smaller control, inside the tray. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-ui-xs font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        active
          ? 'border-plug-cyan-400/60 bg-plug-cyan-400/15 text-plug-cyan-200'
          : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
