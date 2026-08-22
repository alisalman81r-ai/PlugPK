// src/components/map/MapControls.tsx
'use client'

import { LocateFixed, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface MapControlsProps {
  onFilterClick: () => void
  activeFilterCount: number
  resultCount: number
  onLocateMe: () => void
  isLocating: boolean
  /**
   * Whether to offer the Filters button.
   *
   * Explicit, because the desktop layout used to hide it with
   * `[&>button:first-child]:hidden` from the page — which silently coupled that
   * page to the order of the buttons in here. Adding a control at the front
   * would have hidden the wrong one.
   */
  showFilterButton?: boolean
  className?: string
}

export function MapControls({
  onFilterClick,
  activeFilterCount,
  resultCount,
  onLocateMe,
  isLocating,
  showFilterButton = true,
  className,
}: MapControlsProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showFilterButton ? (
        <button
        type="button"
        onClick={onFilterClick}
        aria-label={`Filters, ${resultCount} stations found`}
        className={cn(
          'flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-lg transition-colors duration-150 hover:bg-slate-50',
          activeFilterCount > 0 ? 'text-blue-700' : 'text-slate-700',
        )}
      >
        <SlidersHorizontal size={18} className="shrink-0" aria-hidden="true" />
        Filters
        {activeFilterCount > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-plug-blue-600 text-xs font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onLocateMe}
        aria-label="Find my location"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-colors duration-150 hover:bg-slate-50"
      >
        <LocateFixed
          size={20}
          className={cn(isLocating ? 'animate-spin-slow text-plug-blue-600' : 'text-slate-600')}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
