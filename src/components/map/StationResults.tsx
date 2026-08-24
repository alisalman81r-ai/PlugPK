// src/components/map/StationResults.tsx
'use client'

import { ChevronDown, List } from 'lucide-react'
import * as React from 'react'

import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SORT_OPTIONS, type SortKey } from './filter-options'
import { NoResults, StationListItem, StationListSkeleton } from './StationList'

/**
 * The results, as a grid under the map.
 *
 * They used to be a single 380px column beside the map, which made every card
 * a narrow strip and put the fourth result below the fold. Across the full
 * width of the page the same cards fit three to a row, so a reader sees nine
 * stations at once instead of two and a half.
 *
 * The list starts at one screenful and grows on request rather than rendering
 * every station at once: a filter that matches sixty stations should not cost
 * sixty photographs before the reader has decided to look past the first nine.
 */

const PAGE_SIZE = 9

export interface StationResultsProps {
  stations: (Station & { distanceKm?: number })[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  isLoading?: boolean
  onResetFilters?: () => void
  /** True once geolocation has landed — "nearest first" is a lie without it. */
  hasUserLocation?: boolean
  className?: string
}

export function StationResults({
  stations,
  selectedStation,
  onStationSelect,
  isLoading = false,
  onResetFilters,
  hasUserLocation = false,
  className,
}: StationResultsProps) {
  const [sortBy, setSortBy] = React.useState<SortKey>('nearest')
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  // A new filter or a new search is a new list: showing result 37 of the
  // previous one would be answering a question nobody is still asking.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [stations, sortBy])

  const sorted = React.useMemo(() => {
    const copy = [...stations]

    if (sortBy === 'rating') return copy.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'recent') {
      return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    }
    // `nearest` keeps the distance ordering already applied upstream.
    return copy
  }, [stations, sortBy])

  const visible = sorted.slice(0, visibleCount)
  const remaining = sorted.length - visible.length

  return (
    <section aria-label="Station results" className={cn('min-w-0', className)}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
            <List size={13} aria-hidden="true" />
            Results
          </p>
          <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {isLoading
              ? 'Loading stations…'
              : `${stations.length} ${stations.length === 1 ? 'station' : 'stations'} on the map`}
          </h2>
          <p className="mt-1.5 text-ui text-slate-500">
            {hasUserLocation
              ? 'Sorted by distance from you. Tap a card to place it on the map.'
              : 'Tap a card to place it on the map, or allow location for distances.'}
          </p>
        </div>

        {/* A real select rather than a menu of buttons: three options is
            exactly the case the native control was made for, and it comes with
            keyboard and screen-reader behaviour already correct. */}
        <label className="relative shrink-0">
          <span className="sr-only">Sort stations</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="h-11 cursor-pointer appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-10 text-ui-sm font-semibold text-slate-700 shadow-e1 outline-none transition-colors duration-150 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </label>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StationListSkeleton count={6} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-6 shadow-e1">
          <NoResults onClearFilters={onResetFilters} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((station) => (
              <StationListItem
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onClick={onStationSelect}
                distanceKm={station.distanceKm}
              />
            ))}
          </div>

          {remaining > 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-ui font-semibold text-slate-800 shadow-e1 transition-all duration-200 hover:border-plug-blue-200 hover:bg-plug-blue-50 hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
              >
                Show {Math.min(remaining, PAGE_SIZE)} more
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <p className="font-mono text-ui-xs text-slate-400">
                {visible.length} of {sorted.length} shown
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
