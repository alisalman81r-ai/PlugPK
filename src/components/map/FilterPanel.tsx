// src/components/map/FilterPanel.tsx
'use client'

import {
  Bed,
  Check,
  Coffee,
  DoorOpen,
  ParkingSquare,
  ShoppingBag,
  Star,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { AmenityType, ChargingSpeed, ConnectorType, Station, StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StationListItem, StationListSkeleton } from './StationList'

type SortKey = 'nearest' | 'rating' | 'recent'

const SPEED_OPTIONS: { value: ChargingSpeed | null; label: string; range: string }[] = [
  { value: null, label: 'All', range: 'Any speed' },
  { value: 'slow', label: 'Slow', range: 'Up to 7 kW' },
  { value: 'fast', label: 'Fast', range: '7 – 50 kW' },
  { value: 'rapid', label: 'Rapid', range: '50 – 150 kW' },
  { value: 'ultra', label: 'Ultra', range: '150 kW+' },
]

const AMENITY_OPTIONS: { type: AmenityType; label: string; icon: LucideIcon }[] = [
  { type: 'restaurant', label: 'Restaurant', icon: Utensils },
  { type: 'hotel', label: 'Hotel', icon: Bed },
  { type: 'parking', label: 'Parking', icon: ParkingSquare },
  { type: 'washroom', label: 'Washroom', icon: DoorOpen },
  { type: 'wifi', label: 'WiFi', icon: Wifi },
  { type: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { type: 'prayer', label: 'Prayer', icon: Star },
  { type: 'cafe', label: 'Café', icon: Coffee },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{children}</p>
  )
}

export interface FilterSectionsProps {
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
}

/**
 * The filter controls themselves, shared verbatim between the desktop
 * FilterPanel and the mobile bottom sheet so the two can never drift.
 */
export function FilterSections({ filters, onUpdateFilter }: FilterSectionsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  const toggleConnector = (type: ConnectorType) => {
    const next = filters.connectorTypes.includes(type)
      ? filters.connectorTypes.filter((item) => item !== type)
      : [...filters.connectorTypes, type]
    onUpdateFilter('connectorTypes', next)
  }

  const toggleAmenity = (type: AmenityType) => {
    const next = filters.amenities.includes(type)
      ? filters.amenities.filter((item) => item !== type)
      : [...filters.amenities, type]
    onUpdateFilter('amenities', next)
  }

  const displayRating = hoverRating ?? filters.minRating

  return (
    <>
      {/* ── Connector type ─────────────────────────────────────── */}
      <div className="border-b border-slate-50 px-5 py-4">
        <SectionLabel>Connector Type</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CONNECTOR_TYPES.map((type) => {
            const selected = filters.connectorTypes.includes(type)

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleConnector(type)}
                aria-pressed={selected}
                className={cn(
                  'inline-flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-medium transition-all duration-150',
                  selected
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                {selected ? <Check size={14} className="shrink-0" aria-hidden="true" /> : null}
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Charging speed ─────────────────────────────────────── */}
      <div className="border-b border-slate-50 px-5 py-4">
        <SectionLabel>Charging Speed</SectionLabel>
        <div className="flex flex-col gap-2">
          {SPEED_OPTIONS.map((option) => {
            const selected = filters.chargingSpeed === option.value

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onUpdateFilter('chargingSpeed', option.value)}
                aria-pressed={selected}
                className="flex h-10 items-center justify-between rounded-xl px-3 transition-colors duration-150 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2',
                      selected ? 'border-plug-blue-600' : 'border-slate-300 bg-white',
                    )}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-plug-blue-600" /> : null}
                  </span>
                  <span className="text-sm text-slate-700">{option.label}</span>
                </span>
                <span className="text-xs text-slate-400">{option.range}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Availability ───────────────────────────────────────── */}
      <div className="border-b border-slate-50 px-5 py-4">
        <SectionLabel>Availability</SectionLabel>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">Available Now Only</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.availableOnly}
            aria-label="Available now only"
            onClick={() => onUpdateFilter('availableOnly', !filters.availableOnly)}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              filters.availableOnly ? 'bg-plug-blue-600' : 'bg-slate-200',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200',
                filters.availableOnly ? 'translate-x-[23px]' : 'translate-x-[3px]',
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Minimum rating ─────────────────────────────────────── */}
      <div className="border-b border-slate-50 px-5 py-4">
        <SectionLabel>Minimum Rating</SectionLabel>
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdateFilter('minRating', filters.minRating === value ? 0 : value)}
              onMouseEnter={() => setHoverRating(value)}
              aria-label={`Minimum ${value} star${value === 1 ? '' : 's'}`}
              className="cursor-pointer rounded transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Star
                size={28}
                className={value <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+ stars` : 'Any rating'}
        </p>
      </div>

      {/* ── Amenities ──────────────────────────────────────────── */}
      <div className="border-b border-slate-50 px-5 py-4">
        <SectionLabel>Nearby Amenities</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const selected = filters.amenities.includes(amenity.type)
            const Icon = amenity.icon

            return (
              <button
                key={amenity.type}
                type="button"
                onClick={() => toggleAmenity(amenity.type)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-150',
                  selected
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{amenity.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export interface FilterPanelProps {
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  onResetFilters: () => void
  activeFilterCount: number
  resultCount: number
  /** The list below the filters — not in the original prop list, but the
   *  panel cannot render its station list without them. */
  stations: (Station & { distanceKm?: number })[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  isLoading?: boolean
  header?: React.ReactNode
}

export function FilterPanel({
  filters,
  onUpdateFilter,
  onResetFilters,
  activeFilterCount,
  resultCount,
  stations,
  selectedStation,
  onStationSelect,
  isLoading = false,
  header,
}: FilterPanelProps) {
  const [sortBy, setSortBy] = React.useState<SortKey>('nearest')

  const sorted = React.useMemo(() => {
    const copy = [...stations]

    if (sortBy === 'rating') return copy.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'recent') {
      return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    }
    // `nearest` keeps the distance ordering already applied upstream.
    return copy
  }, [stations, sortBy])

  return (
    <div className="scrollbar-hide flex h-[calc(100vh-72px)] w-[380px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      {header ? <div className="border-b border-slate-100 p-4">{header}</div> : null}

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
        <span className="flex items-center">
          <span className="text-base font-bold text-slate-900">Filters</span>
          {activeFilterCount > 0 ? (
            <span className="ml-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-plug-blue-600 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </span>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-sm font-medium text-plug-blue-600 hover:text-plug-blue-700 hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FilterSections filters={filters} onUpdateFilter={onUpdateFilter} />

      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <span className="text-sm font-semibold text-slate-700">{resultCount} stations found</span>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          aria-label="Sort stations"
          className="cursor-pointer rounded-lg border-none bg-transparent text-sm text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="nearest">Nearest first</option>
          <option value="rating">Top rated</option>
          <option value="recent">Recently added</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5">
        {isLoading ? (
          <StationListSkeleton count={4} />
        ) : sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No stations match these filters.
          </p>
        ) : (
          sorted.map((station) => (
            <StationListItem
              key={station.id}
              station={station}
              isSelected={selectedStation?.id === station.id}
              onClick={onStationSelect}
              distanceKm={station.distanceKm}
            />
          ))
        )}
      </div>
    </div>
  )
}
