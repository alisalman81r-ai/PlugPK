// src/components/map/FilterSections.tsx
'use client'

import { Check, Star } from 'lucide-react'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { AmenityType, ConnectorType, StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AMENITY_OPTIONS, CONNECTOR_LABEL, SPEED_OPTIONS } from './filter-options'

/**
 * The stacked filter controls, for the mobile filter sheet.
 *
 * The desktop map lays the same filters out as a horizontal rail above the map
 * (FilterRail): a 380px column is the wrong shape for a wide screen, but it is
 * exactly right inside a phone sheet. Both surfaces read their options from
 * filter-options.ts, so the two can never name the same filter differently.
 */

/**
 * A filter group's name.
 *
 * Was 12px grey uppercase, which put the label below the controls it names in
 * the visual hierarchy — the reader saw a row of chips and had to look for what
 * they were for. Display face at full ink now, matching the section headings
 * across the car pages so the whole site names things one way.
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-display text-base font-bold tracking-tight text-slate-900">
      {children}
    </p>
  )
}

export interface FilterSectionsProps {
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
}

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
                {CONNECTOR_LABEL[type]}
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
