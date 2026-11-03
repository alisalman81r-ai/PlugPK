// src/components/map/MapSearchBar.tsx
'use client'

import { Search, X } from '@/components/ui/icons'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import type { Station } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

export interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  resultCount: number
  className?: string
  onSelectStation?: (station: Station) => void
  /** Enter with no suggestion highlighted: the search is done (page-map.js form submit). */
  onSubmit?: () => void
  /**
   * The list the suggestions are drawn from — the same one the map shows.
   *
   * This searched MOCK_STATIONS, a fixture compiled into the bundle, so the
   * dropdown offered six sample stations whatever the map held, and never a
   * business listing.
   */
  stations: readonly Station[]
  /**
   * Distinguishes two instances on one page (the phone's overlay and the
   * desktop band), whose listbox ids would otherwise collide.
   */
  idPrefix?: string
}

const MAX_SUGGESTIONS = 6

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
  onSubmit,
  stations,
  idPrefix = 'map-search',
}: MapSearchBarProps) {
  const LISTBOX_ID = `${idPrefix}-suggestions`
  const optionId = (index: number) => `${LISTBOX_ID}-option-${index}`
  const [isFocused, setIsFocused] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const query = value.trim()

  const suggestions = React.useMemo(() => {
    const needle = query.toLowerCase()
    if (needle.length < 2) return []

    return stations.filter((station) =>
      [station.name, station.address.city, station.address.area]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    ).slice(0, MAX_SUGGESTIONS)
  }, [query, stations])

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
    const node = listRef.current.querySelector<HTMLElement>(`#${CSS.escape(`${LISTBOX_ID}-option-${activeIndex}`)}`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, LISTBOX_ID])

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

    if (event.key === 'Enter' && activeIndex < 0 && onSubmit) {
      event.preventDefault()
      setIsFocused(false)
      onSubmit()
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
          // The landing-v2 .psearch: a white pill with a volt glow beneath it.
          'flex h-[58px] items-center gap-2 rounded-full bg-white pl-[18px] pr-[7px] text-left transition-shadow duration-200 sm:h-16 sm:pl-5',
          'shadow-[0_24px_60px_-24px_rgba(212,255,58,.35)]',
          'focus-within:shadow-[0_0_0_4px_rgba(212,255,58,.35),0_24px_60px_-24px_rgba(212,255,58,.35)]',
        )}
      >
        <Search size={20} className="mr-1 shrink-0 text-[#8a8e95]" aria-hidden="true" />

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
          className="h-full min-w-0 flex-1 border-none bg-transparent text-base text-ink outline-none placeholder:text-[#8a8e95]"
        />

        {value.length > 0 ? (
          <>
            <span className="shrink-0 rounded-full bg-chalk px-2.5 py-1 font-mono text-[11px] font-semibold text-muted">
              {resultCount} found
            </span>
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted [transition:background-color_.25s,color_.25s] hover:bg-chalk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
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
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[320px] overflow-y-auto rounded-[22px] border border-ink/10 bg-white p-1.5 text-left shadow-e4"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
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
                    'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors duration-100',
                    isActive ? 'bg-chalk' : 'hover:bg-paper',
                  )}
                >
                  <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone">
                    <PhotoFrame
                      src={station.coverPhoto}
                      alt=""
                      sizes="44px"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {before}
                      {match ? <mark className="rounded-[4px] bg-volt-tint px-0.5 text-ink">{match}</mark> : null}
                      {after}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-muted">
                        {station.address.area}, {station.address.city}
                      </span>
                      {maxPower > 0 ? (
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {maxPower} kW
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
