// src/components/vehicles/VehicleSelector.tsx
'use client'

import { Car, Check, ChevronDown, Search, X } from 'lucide-react'
import * as React from 'react'

import { AnimatedIcon, TurnIcon } from '@/components/ui'
import type { Availability, Powertrain, Vehicle } from '@/data/pakistanVehicles'
import {
  getBrands,
  getVehicleLabel,
  getVehiclesGroupedByBrand,
  hasSpecs,
  searchVehicles,
} from '@/lib/vehicles'
import { cn } from '@/lib/utils'

/**
 * Brand → Model → Vehicle, over the Pakistan catalogue.
 *
 * Not a replacement for components/route/VehicleSelector, which does a
 * different job: that one picks from the ten cars with verified range figures
 * because the route planner needs a number to place charging stops with, and it
 * returns an EVModel. This browses all 145 rows of the catalogue and returns a
 * Vehicle. Pointing the route planner at this list would hand it 135 cars with
 * no range, so the two stay separate on purpose — the shared identity lives in
 * the data, not in one component doing both jobs.
 *
 * The two-step is a real narrowing, not a display trick: picking a brand
 * filters the model list, and the filters above narrow the brand list too, so a
 * brand with nothing left under the current filter disappears rather than
 * opening onto an empty panel.
 *
 * Search bypasses the brand step entirely. Someone who types "iX" wants the
 * BMW iX, not to be told to pick BMW first.
 */

export interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null
  onSelect: (vehicle: Vehicle | null) => void
  className?: string
}

type FilterId = 'all' | Powertrain | Availability

interface Filter {
  id: FilterId
  label: string
}

const FILTERS: Filter[] = [
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
  // One narrow union split by membership, so a new filter id only needs adding
  // to FILTERS and to whichever list it belongs in.
  if ((POWERTRAINS as string[]).includes(filter)) return vehicle.powertrain === filter
  return vehicle.availability === filter
}

const AVAILABILITY_LABEL: Record<Availability, string> = {
  official: 'Official',
  imported: 'Imported',
  'rare-import': 'Rare import',
}

export function VehicleSelector({ selectedVehicle, onSelect, className }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [filter, setFilter] = React.useState<FilterId>('all')
  const [query, setQuery] = React.useState('')
  const [brand, setBrand] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  /** Same dismissal behaviour as the route planner's picker. */
  React.useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isSearching = query.trim().length > 0

  /** Everything the current filter and query allow. */
  const matches = React.useMemo(
    () => searchVehicles(query).filter((vehicle) => matchesFilter(vehicle, filter)),
    [query, filter],
  )

  /** Brands that still have something under the current filter. */
  const brands = React.useMemo(() => {
    if (filter === 'all') return getBrands()
    return Array.from(new Set(matches.map((vehicle) => vehicle.brand))).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [filter, matches])

  const models = React.useMemo(
    () => (brand ? matches.filter((vehicle) => vehicle.brand === brand) : []),
    [brand, matches],
  )

  /** While searching the brand step is skipped, so results group themselves. */
  const grouped = React.useMemo(() => getVehiclesGroupedByBrand(matches), [matches])

  // A brand can stop existing when the filter changes; drop the dead selection
  // rather than leaving the panel showing an empty model list.
  React.useEffect(() => {
    if (brand && !brands.includes(brand)) setBrand(null)
  }, [brand, brands])

  const choose = (vehicle: Vehicle) => {
    onSelect(vehicle)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* ── The field ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex h-[52px] w-full items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-left transition-all duration-150',
          isOpen ? 'border-blue-500 shadow-focus' : 'border-slate-200 hover:border-slate-300',
        )}
      >
        <Car size={20} className="shrink-0 text-slate-400" aria-hidden="true" />

        <span className="min-w-0 flex-1">
          {selectedVehicle ? (
            <>
              <span className="block truncate text-ui font-medium text-slate-900">
                {getVehicleLabel(selectedVehicle)}
              </span>
              <span className="block text-ui-xs text-slate-400">
                {selectedVehicle.powertrain} ·{' '}
                {AVAILABILITY_LABEL[selectedVehicle.availability]}
              </span>
            </>
          ) : (
            <span className="text-ui text-slate-400">Select a vehicle</span>
          )}
        </span>

        <TurnIcon active={isOpen} className="text-slate-400">
          <ChevronDown size={18} aria-hidden="true" />
        </TurnIcon>
      </button>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e3">
          {/* ── Search ─────────────────────────────────────────── */}
          <div className="border-b border-slate-100 p-3">
            <div className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-blue-500/40 transition-shadow focus-within:ring-2">
              <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brand, model or PHEV…"
                aria-label="Search vehicles"
                className="w-full border-none bg-transparent text-ui-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {/* ── Filters. Wraps rather than scrolls, so nothing is
                   hidden off the edge on a narrow screen. ─────── */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FILTERS.map((option) => {
                const isActive = filter === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setFilter(option.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-ui-xs font-semibold transition-colors duration-150',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Brand → Model, or flat results while searching ── */}
          {isSearching ? (
            <div className="scrollbar-hide max-h-[300px] overflow-y-auto" role="listbox">
              {grouped.length > 0 ? (
                grouped.map(([brandName, vehicles]) => (
                  <div key={brandName}>
                    <p className="sticky top-0 bg-slate-50 px-4 py-2 text-ui-xs font-bold uppercase tracking-widest text-slate-400">
                      {brandName}
                    </p>
                    {vehicles.map((vehicle) => (
                      <VehicleRow
                        key={vehicle.id}
                        vehicle={vehicle}
                        isSelected={selectedVehicle?.id === vehicle.id}
                        onChoose={choose}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          ) : (
            /* Two panes side by side once there is room; stacked below that,
               where a 50/50 split would leave both columns too narrow to read
               a model name in. */
            <div className="grid max-h-[320px] grid-cols-1 sm:grid-cols-[minmax(0,7rem)_1fr]">
              <div className="scrollbar-hide max-h-[140px] overflow-y-auto border-b border-slate-100 sm:max-h-[320px] sm:border-b-0 sm:border-r">
                {brands.map((brandName) => {
                  const isActive = brand === brandName

                  return (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => setBrand(brandName)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-ui-sm transition-colors duration-100',
                        isActive
                          ? 'bg-slate-50 font-semibold text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <span className="truncate">{brandName}</span>
                      {isActive ? (
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-plug-blue-600" />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="scrollbar-hide max-h-[180px] overflow-y-auto sm:max-h-[320px]" role="listbox">
                {brand ? (
                  models.map((vehicle) => (
                    <VehicleRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      isSelected={selectedVehicle?.id === vehicle.id}
                      onChoose={choose}
                    />
                  ))
                ) : (
                  <div className="flex h-full min-h-[140px] flex-col items-center justify-center p-6 text-center">
                    <AnimatedIcon motion="pop" standalone>
                      <Car size={28} className="text-slate-200" aria-hidden="true" />
                    </AnimatedIcon>
                    <p className="mt-2 text-ui-sm text-slate-400">
                      Pick a brand to see its models
                    </p>
                    <p className="mt-1 text-ui-xs text-slate-400">
                      {matches.length} vehicles available
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedVehicle ? (
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setIsOpen(false)
              }}
              className="w-full border-t border-slate-100 py-3 text-ui-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-6 text-center">
      <Car size={32} className="mx-auto text-slate-200" aria-hidden="true" />
      <p className="mt-2 text-ui-sm text-slate-400">No vehicles found</p>
    </div>
  )
}

interface VehicleRowProps {
  vehicle: Vehicle
  isSelected: boolean
  onChoose: (vehicle: Vehicle) => void
}

function VehicleRow({ vehicle, isSelected, onChoose }: VehicleRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onChoose(vehicle)}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors duration-100 hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block truncate text-ui-sm font-semibold text-slate-900">
          {vehicle.model}
        </span>
        <span className="mt-0.5 block text-ui-xs text-slate-400">
          {vehicle.powertrain} · {AVAILABILITY_LABEL[vehicle.availability]} · {vehicle.bodyType}
          {/* Says so where a verified range exists, rather than printing a
              figure this catalogue does not hold. */}
          {hasSpecs(vehicle.id) ? ' · specs available' : ''}
        </span>
      </span>

      {isSelected ? (
        <span className="shrink-0 rounded-full bg-blue-50 p-1">
          <Check size={16} className="text-plug-blue-600" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  )
}
