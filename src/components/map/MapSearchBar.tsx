// src/components/map/MapSearchBar.tsx
'use client'

import { Search, X } from 'lucide-react'
import * as React from 'react'

import { PhotoFrame, StatusDot } from '@/components/ui'
import { MOCK_STATIONS } from '@/lib/mock-data'
import type { Station } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

export interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  resultCount: number
  className?: string
  onSelectStation?: (station: Station) => void
}

const MAX_SUGGESTIONS = 6
const LISTBOX_ID = 'map-search-suggestions'
const optionId = (index: number) => `${LISTBOX_ID}-option-${index}`

/**
 * Splits a label around the matched query so the matching run can be marked.
 * Returns the three pieces rather than HTML, so nothing is ever injected.
 */
function splitOnMatch(label: string, query: string): [string, string, string] {
  const at = label.toLowerCase().indexOf(query.toLowerCase())
  if (at === -1 || query.length === 0) return [label, '', '']
  return [label.slice(0, at), label.slice(at, at + query.length), label.slice(at + query.length)]
}

export function MapSearchBar({
  value,
  onChange,
  onClear,
  resultCount,
  className,
  onSelectStation,
}: MapSearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const query = value.trim()

  const suggestions = React.useMemo(() => {
    const needle = query.toLowerCase()
    if (needle.length < 2) return []

    return MOCK_STATIONS.filter((station) =>
      [station.name, station.address.city, station.address.area]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    ).slice(0, MAX_SUGGESTIONS)
  }, [query])

  const showDropdown = isFocused && query.length >= 2

  // A new query invalidates the highlighted row.
  React.useEffect(() => {
    setActiveIndex(-1)
  }, [query])

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

  // Keep the keyboard-highlighted row inside the scroll area.
  React.useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const node = listRef.current.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const select = (station: Station) => {
    onSelectStation?.(station)
    setIsFocused(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsFocused(false)
      setActiveIndex(-1)
      return
    }

    if (!showDropdown || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      const station = suggestions[activeIndex]
      if (station) {
        event.preventDefault()
        select(station)
      }
    }
  }

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
          role="combobox"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search city or station..."
          aria-label="Search stations"
          aria-expanded={showDropdown}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
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
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={18} />
            </button>
          </>
        ) : null}
      </div>

      {/* Announced separately so the count reaches a screen reader without
          the visual badge having to be read on every keystroke. */}
      <span aria-live="polite" className="sr-only">
        {showDropdown
          ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'}`
          : ''}
      </span>

      {showDropdown ? (
        <div
          ref={listRef}
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Station suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Nothing matches &ldquo;{query}&rdquo;
            </p>
          ) : (
            suggestions.map((station, index) => {
              const [before, match, after] = splitOnMatch(station.name, query)
              const isActive = index === activeIndex
              const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

              return (
                <button
                  key={station.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => select(station)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100',
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                    <PhotoFrame
                      src={station.coverPhoto}
                      alt=""
                      sizes="44px"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {before}
                      {match ? <mark className="bg-transparent text-plug-blue-600">{match}</mark> : null}
                      {after}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-slate-400">
                        {station.address.area}, {station.address.city}
                      </span>
                      {maxPower > 0 ? (
                        <span className="shrink-0 font-mono text-xs text-slate-400">
                          {maxPower} kW
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <StatusDot status={station.status} size="sm" />
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
