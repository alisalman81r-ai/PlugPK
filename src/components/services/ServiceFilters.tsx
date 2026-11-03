// src/components/services/ServiceFilters.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

import { LayoutGrid, LayoutList, Loader2, Search } from '@/components/ui/icons'

import { Skeleton } from '@/components/ui'
import { SearchSelect } from '@/components/ui/SearchSelect'
import { SEG, segButtonClass } from '@/components/v2/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

import { useCountBounce } from './services-motion'

/**
 * A to Z, Z to A, or by city (landing-v2's #svSort). "Top Rated" and "Most
 * Reviewed" are gone: they sorted on seeded figures that no review stands
 * behind.
 */
export type ServiceSortOption = 'name' | 'za' | 'city'
export type ServiceViewMode = 'grid' | 'list'

export interface ServiceFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCity: string
  onCityChange: (city: string) => void
  sortBy: ServiceSortOption
  onSortChange: (sort: ServiceSortOption) => void
  resultCount: number
  isLoading: boolean
  viewMode: ServiceViewMode
  onViewModeChange: (mode: ServiceViewMode) => void
}

/**
 * The pill controls of landing-v2's toolbar (.sv-q, .sortsel): border and
 * focus ring over .2s, no hover state.
 */
const PILL =
  'h-11 rounded-full border-[1.5px] border-ink/10 bg-white text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-ink focus-visible:shadow-focus'

/** page-services.js: the search box waits 200ms after the last keystroke. */
const SEARCH_DEBOUNCE = 200

export function ServiceFilters({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  sortBy,
  onSortChange,
  resultCount,
  isLoading,
  viewMode,
  onViewModeChange,
}: ServiceFiltersProps) {
  /*
    What is typed, as against what is applied. Every applied change reorders
    the grid with Flip, so it is applied once typing pauses, not per key.
  */
  const [draft, setDraft] = useState(searchQuery)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const latest = useRef(searchQuery)
  latest.current = searchQuery

  // Applied from elsewhere (the hero search, Clear filters): show it here.
  useEffect(() => {
    setDraft((current) => (current.trim() === searchQuery ? current : searchQuery))
  }, [searchQuery])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onType = (value: string) => {
    setDraft(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const next = value.trim()
      if (next !== latest.current) onSearchChange(next)
    }, SEARCH_DEBOUNCE)
  }

  const countRef = useCountBounce<HTMLElement>(resultCount)

  return (
    <div className="mb-[26px] flex flex-col items-stretch gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-36" />
            <Loader2 size={16} className="animate-spin text-ink" aria-hidden="true" />
          </>
        ) : (
          // The figure carries the weight, the noun stays quiet — it is the
          // number that changes as you filter.
          <p aria-live="polite" className="text-[15px] text-muted">
            <b ref={countRef} className="font-mono text-base font-semibold tabular-nums text-ink">
              {resultCount}
            </b>{' '}
            service{resultCount === 1 ? '' : 's'} found
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 items-center gap-2.5 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 flex items-center sm:min-w-[220px] sm:flex-1 xl:w-[230px] xl:flex-none">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(event) => onType(event.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
            autoComplete="off"
            className={cn(
              PILL,
              'w-full pl-[42px] pr-4 font-normal placeholder:text-fog [&::-webkit-search-cancel-button]:appearance-none',
              // .sv-q input: border and ring over .2s, width over .4s.
              '[transition:border-color_.2s,box-shadow_.2s,width_.4s_cubic-bezier(.16,1,.3,1)] focus:border-ink focus:shadow-focus',
            )}
          />
        </div>

        {/* The same in-window city list as the hero — a native select of
            103 cities runs off the screen. */}
        <SearchSelect
          value={selectedCity}
          onChange={onCityChange}
          ariaLabel="Filter by city"
          allLabel="All Cities"
          options={PAKISTAN_CITIES}
          searchPlaceholder="Type a city"
          className={cn(PILL, 'w-full px-[18px] hover:border-ink/10 focus-visible:ring-0 sm:w-44')}
        />

        <div className="relative">
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as ServiceSortOption)}
            aria-label="Sort services"
            className={cn(PILL, 'w-full cursor-pointer appearance-none pl-[18px] pr-10 sm:w-auto')}
          >
            <option value="name">A to Z</option>
            <option value="za">Z to A</option>
            <option value="city">By city</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 -mt-1.5 h-[7px] w-[7px] rotate-45 border-b-2 border-r-2 border-muted"
          />
        </div>

        {/* A labelled segmented control: both buttons carry their word. */}
        <div role="group" aria-label="View mode" className={cn(SEG, 'col-span-2 flex sm:inline-flex')}>
          {(
            [
              { mode: 'grid', label: 'Grid', title: 'Grid view', Icon: LayoutGrid },
              { mode: 'list', label: 'List', title: 'List view', Icon: LayoutList },
            ] as const
          ).map(({ mode, label, title, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              title={title}
              aria-label={title}
              aria-pressed={viewMode === mode}
              className={segButtonClass(
                viewMode === mode,
                // .seg button: background, colour and shadow over .25s.
                'flex h-10 flex-1 flex-row items-center justify-center gap-[7px] px-3.5 py-0 duration-[250ms] focus-visible:outline-none focus-visible:shadow-focus sm:h-9 sm:flex-none',
              )}
            >
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
