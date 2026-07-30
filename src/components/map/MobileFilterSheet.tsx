// src/components/map/MobileFilterSheet.tsx
'use client'

import * as React from 'react'

import type { StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FilterSections } from './FilterPanel'

export interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  onResetFilters: () => void
  activeFilterCount: number
  resultCount: number
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onUpdateFilter,
  onResetFilters,
  activeFilterCount,
  resultCount,
}: MobileFilterSheetProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden"
        />
      ) : null}

      <div
        aria-hidden={!isOpen}
        className={cn(
          'scrollbar-hide fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white transition-transform duration-[350ms] ease-decelerate lg:hidden',
          isOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full',
        )}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 pb-4 pt-3">
          <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-slate-200" />

          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <span className="text-lg font-bold text-slate-900">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="ml-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-plug-blue-600 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </span>

            <span className="flex items-center gap-4">
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  tabIndex={isOpen ? undefined : -1}
                  className="text-sm font-medium text-plug-blue-600 hover:underline"
                >
                  Clear all
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                tabIndex={isOpen ? undefined : -1}
                className="h-9 rounded-lg bg-plug-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
              >
                Done
              </button>
            </span>
          </div>
        </div>

        <div className="pb-8">
          <FilterSections filters={filters} onUpdateFilter={onUpdateFilter} />

          <p className="px-5 pt-4 text-sm font-semibold text-slate-700">
            {resultCount} stations found
          </p>
        </div>
      </div>
    </>
  )
}
