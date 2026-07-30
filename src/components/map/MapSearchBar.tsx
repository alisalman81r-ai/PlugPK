// src/components/map/MapSearchBar.tsx
'use client'

import { ChevronRight, MapPin, Search, X } from 'lucide-react'
import * as React from 'react'

import { MOCK_STATIONS } from '@/lib/mock-data'
import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  resultCount: number
  className?: string
  onSelectStation?: (station: Station) => void
}

const MAX_SUGGESTIONS = 6

export function MapSearchBar({
  value,
  onChange,
  onClear,
  resultCount,
  className,
  onSelectStation,
}: MapSearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const suggestions = React.useMemo(() => {
    const query = value.trim().toLowerCase()
    if (query.length < 2) return []

    return MOCK_STATIONS.filter((station) =>
      [station.name, station.address.city, station.address.area]
        .join(' ')
        .toLowerCase()
        .includes(query),
    ).slice(0, MAX_SUGGESTIONS)
  }, [value])

  // Close the dropdown when focus or a click leaves the component.
  React.useEffect(() => {
    if (!isFocused) return

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isFocused])

  const showDropdown = isFocused && value.trim().length >= 2

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition-shadow duration-200',
          'shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
          'focus-within:border-blue-300 focus-within:shadow-[0_4px_24px_rgba(37,99,235,0.15)]',
        )}
      >
        <Search size={20} className="shrink-0 text-slate-400" aria-hidden="true" />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search city or station..."
          aria-label="Search stations"
          className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
        />

        {value.length > 0 ? (
          <>
            <span className="mr-2 shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-plug-blue-600">
              {resultCount} found
            </span>
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[280px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {suggestions.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No stations found</p>
          ) : (
            suggestions.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => {
                  onSelectStation?.(station)
                  setIsFocused(false)
                }}
                className="flex h-14 w-full items-center gap-3 border-b border-slate-50 px-4 text-left transition-colors duration-150 last:border-b-0 hover:bg-slate-50"
              >
                <span className="shrink-0 rounded-lg bg-blue-50 p-1.5">
                  <MapPin size={16} className="text-plug-blue-600" aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {station.name}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {station.address.area}, {station.address.city}
                  </span>
                </span>

                <ChevronRight size={14} className="shrink-0 text-slate-300" aria-hidden="true" />
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
