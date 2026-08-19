// src/components/services/ServiceFilters.tsx
'use client'

import { LayoutGrid, LayoutList, Loader2, Search } from 'lucide-react'

import { Skeleton } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type ServiceSortOption = 'rating' | 'name' | 'reviews'
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

const SELECT_CLASS =
  'h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 text-ui font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus-visible:border-plug-blue-500 focus-visible:ring-2 focus-visible:ring-plug-blue-500/40'

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
  return (
    <div className="flex flex-col items-stretch gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-36" />
            <Loader2 size={16} className="animate-spin text-plug-blue-600" aria-hidden="true" />
          </>
        ) : (
          // The figure carries the weight, the noun stays quiet — it is the
          // number that changes as you filter, so it is the part worth
          // reading.
          <p className="text-ui text-slate-500">
            <span className="font-bold tabular-nums text-slate-900">{resultCount}</span>{' '}
            service{resultCount === 1 ? '' : 's'} found
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-ui text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-plug-blue-500 focus-visible:ring-2 focus-visible:ring-plug-blue-500/40 sm:w-56 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>

        <select
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
          aria-label="Filter by city"
          className={SELECT_CLASS}
        >
          <option value="all">All Cities</option>
          {PAKISTAN_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as ServiceSortOption)}
          aria-label="Sort services"
          className={SELECT_CLASS}
        >
          <option value="rating">Top Rated</option>
          <option value="name">A to Z</option>
          <option value="reviews">Most Reviewed</option>
        </select>

        {/*
          A labelled segmented control.

          This was two 32px icon-only squares with a 4px gap and 4px of
          padding around them — about a fifth of the control's area was dead
          space that looks clickable and is not, and nothing said what either
          icon did until you had already pressed one. Both buttons now carry
          their word, fill the control's full height, and sit flush against
          each other so there is no gap to miss through.
        */}
        <div
          role="group"
          aria-label="View mode"
          className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1"
        >
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
              className={cn(
                'flex h-full items-center gap-1.5 rounded-lg px-3 text-ui-sm font-semibold transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                viewMode === mode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon size={15} className="shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
