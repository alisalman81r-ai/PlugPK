// src/components/vehicles/VehicleCatalogue.tsx
'use client'

import { Car, Search, X, Zap } from 'lucide-react'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { AnimatedIcon, Badge, HoverMotion, type BadgeVariant } from '@/components/ui'
import type { Availability, Powertrain, Vehicle } from '@/data/pakistanVehicles'
import type { DbVehicle } from '@/lib/db/serialize'
import { filterVehiclesByQuery, getVehiclesGroupedByBrand } from '@/lib/vehicles'
import { cn } from '@/lib/utils'

/**
 * Every car in the catalogue, on one page.
 *
 * The selector this sits beside is a form field — it answers "which one is
 * mine". This answers "what is out there", which is a different question and
 * needs the whole list visible rather than hidden behind a dropdown.
 *
 * Grouped by brand rather than one flat grid: a reader scanning for a BMW wants
 * the seven of them together, and a brand heading gives the eye somewhere to
 * rest every few rows. Groups appear only when they have a card left after
 * filtering, so no heading ever sits above an empty row.
 *
 * All filtering is client-side over rows the page fetched once. The catalogue
 * is small enough to hold, and a round trip per keystroke would make the search
 * feel broken on a slow connection.
 */

export interface VehicleCatalogueProps {
  vehicles: DbVehicle[]
}

type FilterId = 'all' | Powertrain | Availability

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'BEV', label: 'EV' },
  { id: 'PHEV', label: 'PHEV' },
  { id: 'EREV', label: 'EREV' },
  { id: 'official', label: 'Official' },
  { id: 'imported', label: 'Imported' },
  { id: 'rare-import', label: 'Rare import' },
]

const POWERTRAINS: Powertrain[] = ['BEV', 'PHEV', 'EREV']

function matchesFilter(vehicle: Vehicle, filter: FilterId): boolean {
  if (filter === 'all') return true
  if ((POWERTRAINS as string[]).includes(filter)) return vehicle.powertrain === filter
  return vehicle.availability === filter
}

/** Blue for battery-only, amber for one with an engine still in it. */
const POWERTRAIN_VARIANT: Record<Powertrain, BadgeVariant> = {
  BEV: 'blue',
  PHEV: 'amber',
  EREV: 'purple',
}

const AVAILABILITY_LABEL: Record<Availability, string> = {
  official: 'Officially sold',
  imported: 'Imported',
  'rare-import': 'Rare import',
}

export function VehicleCatalogue({ vehicles }: VehicleCatalogueProps) {
  const [filter, setFilter] = React.useState<FilterId>('all')
  const [query, setQuery] = React.useState('')

  const matches = React.useMemo(
    () =>
      filterVehiclesByQuery(vehicles, query).filter((vehicle) => matchesFilter(vehicle, filter)),
    [vehicles, query, filter],
  )

  const grouped = React.useMemo(() => getVehiclesGroupedByBrand(matches), [matches])
  const isFiltered = filter !== 'all' || query.trim().length > 0

  /**
   * Nothing in the catalogue at all is a different state from a search that
   * found nothing, and it gets different words. Offering a search box and seven
   * filters over an empty list would invite the reader to conclude their query
   * was at fault.
   */
  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <AnimatedIcon motion="pop" standalone>
          <Car size={44} className="mx-auto text-slate-200" aria-hidden="true" />
        </AnimatedIcon>
        <p className="mt-5 text-xl font-bold tracking-tight text-slate-900">
          No vehicles listed yet
        </p>
        <p className="mt-2.5 text-ui leading-relaxed text-slate-500">
          The catalogue is empty. Once vehicles are added they appear here, grouped by
          brand and searchable.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Search and filters ─────────────────────────────────── */}
      <div className="mx-auto max-w-2xl">
        <div className="flex h-13 items-center gap-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white px-4 transition-shadow focus-within:border-blue-500 focus-within:shadow-focus">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a brand, a model, or PHEV…"
            aria-label="Search vehicles"
            className="w-full border-none bg-transparent text-ui text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {FILTERS.map((option) => {
            const isActive = filter === option.id

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(option.id)}
                className={cn(
                  'rounded-full border-[1.5px] px-4 py-2 text-ui-sm font-semibold transition-colors duration-200',
                  isActive
                    ? 'border-slate-900 bg-plug-navy-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Counted from what is on screen, so it never disagrees with the grid. */}
      <p className="mt-8 text-center text-ui-sm text-slate-500">
        {matches.length === vehicles.length
          ? `${vehicles.length} vehicles`
          : `${matches.length} of ${vehicles.length} vehicles`}
        {grouped.length > 0 ? ` · ${grouped.length} brand${grouped.length === 1 ? '' : 's'}` : ''}
      </p>

      {/* ── The cars ───────────────────────────────────────────── */}
      {grouped.length > 0 ? (
        <div className="mt-12 flex flex-col gap-14">
          {grouped.map(([brand, brandVehicles]) => (
            <section key={brand}>
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-slate-200 pb-4">
                <h2 className="text-[1.75rem] font-black tracking-[-0.025em] text-slate-900">
                  {brand}
                </h2>
                <span className="shrink-0 font-mono text-ui-xs tabular-nums text-slate-400">
                  {brandVehicles.length}{' '}
                  {brandVehicles.length === 1 ? 'model' : 'models'}
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {brandVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <AnimatedIcon motion="pop" standalone>
            <Car size={40} className="text-slate-200" aria-hidden="true" />
          </AnimatedIcon>
          <p className="mt-4 text-ui font-semibold text-slate-600">Nothing matches that</p>
          <p className="mt-1.5 max-w-xs text-ui-sm leading-relaxed text-slate-400">
            Try a brand name, a model, or one of the filters above.
          </p>
          {isFiltered ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
              className="mt-5 rounded-full border-[1.5px] border-slate-300 px-5 py-2 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function VehicleCard({ vehicle }: { vehicle: DbVehicle }) {
  return (
    <HoverMotion className={FRAME}>
      <div className={cn(FACE, 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <span className="text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {vehicle.brand}
          </span>
          <Badge variant={POWERTRAIN_VARIANT[vehicle.powertrain]} size="sm">
            {vehicle.powertrain}
          </Badge>
        </div>

        <span aria-hidden="true" className={cn('mt-4 block', CAP_RULE)} />

        <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-slate-900">
          {vehicle.model}
        </h3>

        <p className="mt-1.5 text-ui-sm capitalize text-slate-500">
          {vehicle.bodyType} · {AVAILABILITY_LABEL[vehicle.availability]}
        </p>

        {/*
          The range only appears when the row actually has one. Most rows have
          no verified figure, and a dash or a zero in this slot would read as a
          spec rather than as a gap.
        */}
        <div className="mt-auto pt-5">
          {vehicle.rangeKm ? (
            <span className="flex items-center gap-1.5 border-t border-slate-100 pt-4 text-ui-sm font-semibold text-slate-700">
              <AnimatedIcon motion="pulse">
                <Zap size={13} className="text-plug-blue-600" aria-hidden="true" />
              </AnimatedIcon>
              {vehicle.rangeKm} km range
              {vehicle.batteryCapacityKwh ? (
                <span className="font-normal text-slate-400">
                  · {vehicle.batteryCapacityKwh} kWh
                </span>
              ) : null}
            </span>
          ) : (
            <span className="block border-t border-slate-100 pt-4 text-ui-xs text-slate-400">
              No verified range yet
            </span>
          )}
        </div>
      </div>
    </HoverMotion>
  )
}
