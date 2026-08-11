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
  'h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

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
    <div className="flex flex-col items-stretch gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-36" />
            <Loader2 size={16} className="animate-spin text-plug-blue-600" aria-hidden="true" />
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-700">
            {resultCount} service{resultCount === 1 ? '' : 's'} found
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-52"
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

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150',
              viewMode === 'grid'
                ? 'bg-plug-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            <LayoutGrid size={16} />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150',
              viewMode === 'list'
                ? 'bg-plug-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
