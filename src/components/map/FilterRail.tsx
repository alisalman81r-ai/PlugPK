// src/components/map/FilterRail.tsx
'use client'

import { ChevronDown, RotateCcw, SlidersHorizontal, Star, Zap } from 'lucide-react'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { AmenityType, ConnectorType, StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AMENITY_OPTIONS, CONNECTOR_LABEL, SPEED_OPTIONS } from './filter-options'

/**
 * The filter rail: every filter, laid out horizontally above the map.
 *
 * The map used to sit to the right of a 380px column holding the filters and
 * the results list stacked on top of each other. That column cost the map a
 * third of the widest part of the screen — the part a map actually uses — and
 * it buried the results under five filter groups the reader had to scroll past.
 *
 * So the map takes the centre of the page and the controls read left to right
 * on the line above it, in the order a driver asks them: which plug, how fast,
 * what else. Above rather than below, because a control that changes what the
 * map shows has to be reachable while the map is still on screen — under the
 * map, every filter meant scrolling away from the thing being filtered. The two
 * rarer cuts — amenities and a rating floor — stay folded behind "More
 * filters", because they are the third question, not the first, and an
 * always-open row of sixteen chips makes the common path look complicated.
 *
 * It renders inside the same white mount as the map card (see the map page), so
 * its own edge is a hairline ring rather than a border-and-shadow of its own.
 *
 * The phone gets the same filters stacked in a sheet (FilterSections); both
 * surfaces read their options from filter-options.ts.
 */

export interface FilterRailProps {
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  onResetFilters: () => void
  activeFilterCount: number
  resultCount: number
  totalCount: number
  /**
   * Opens the phone filter sheet.
   *
   * Below lg the rail keeps only its header: the same groups stacked would put
   * 350px of controls between the search field and the map on a screen that
   * shows one card at a time. The sheet holds them instead (FilterSections),
   * and both are driven by the same filter state, so the two can only ever
   * disagree about layout.
   */
  onOpenSheet: () => void
  className?: string
}

export function FilterRail({
  filters,
  onUpdateFilter,
  onResetFilters,
  activeFilterCount,
  resultCount,
  totalCount,
  onOpenSheet,
  className,
}: FilterRailProps) {
  /**
   * Opens itself once a folded filter is actually set.
   *
   * Otherwise a shared /map link carrying an amenity filter renders a rail that
   * looks unfiltered while the results are cut in half — the one state a filter
   * bar must never be in.
   */
  const hasFoldedFilter = filters.amenities.length > 0 || filters.minRating > 0
  const [isExpanded, setIsExpanded] = React.useState(hasFoldedFilter)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (hasFoldedFilter) setIsExpanded(true)
  }, [hasFoldedFilter])

  const toggleConnector = (type: ConnectorType) => {
    onUpdateFilter(
      'connectorTypes',
      filters.connectorTypes.includes(type)
        ? filters.connectorTypes.filter((entry) => entry !== type)
        : [...filters.connectorTypes, type],
    )
  }

  const toggleAmenity = (type: AmenityType) => {
    onUpdateFilter(
      'amenities',
      filters.amenities.includes(type)
        ? filters.amenities.filter((entry) => entry !== type)
        : [...filters.amenities, type],
    )
  }

  const displayRating = hoverRating ?? filters.minRating

  return (
    <section
      aria-label="Filter stations"
      className={cn(
        'overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-slate-900/10',
        className,
      )}
    >
      {/*
        The count lives in this header rather than over the map: it is the
        answer to the controls it sits with, and a figure set over a map is a
        figure a pin can slide behind.
      */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
        {/* Outlined, like every other icon holder on the site. The filter chips
            below keep their tint, and deliberately — a fill there means "this
            filter is on", which is state the user needs to see. This glyph
            labels the panel and carries no state, so a fill only competed with
            the ones that do. */}
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-300 text-slate-500"
        >
          <SlidersHorizontal size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
            Refine the map
          </h2>
          <p aria-live="polite" className="text-ui-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{resultCount}</span> of{' '}
            {totalCount} {totalCount === 1 ? 'station' : 'stations'}
          </p>
        </div>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 text-ui-sm font-semibold text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Clear
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-plug-blue-600 px-1.5 font-mono text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          </button>
        ) : null}

        {/* Phone: the whole set, in a sheet. */}
        <button
          type="button"
          onClick={onOpenSheet}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-ui-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:hidden"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-plug-blue-600 px-1.5 font-mono text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        {/* Desktop: the folded pair, in place. */}
        <button
          type="button"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          aria-controls="filter-rail-more"
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-ui-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:inline-flex"
        >
          {isExpanded ? 'Fewer filters' : 'More filters'}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </button>
      </div>

      {/*
        Dividers rather than cards: the three groups are one control surface
        read across, and three bordered boxes in a row would compete with the
        map card directly below.
      */}
      <div className="hidden divide-y divide-slate-100 lg:grid lg:grid-cols-[1.3fr_1.4fr_1fr] lg:divide-x lg:divide-y-0">
        <Group label="Connector">
          <div className="flex flex-wrap gap-2">
            {CONNECTOR_TYPES.map((type) => (
              <Chip
                key={type}
                active={filters.connectorTypes.includes(type)}
                onClick={() => toggleConnector(type)}
              >
                {CONNECTOR_LABEL[type]}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Charging speed">
          {/* A segmented control, because the speeds are one ordered choice
              rather than five independent toggles — and the kW range sits under
              each label so nobody has to guess what "Rapid" means. */}
          <div
            role="radiogroup"
            aria-label="Charging speed"
            className="scrollbar-hide flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1"
          >
            {SPEED_OPTIONS.map((option) => {
              const selected = filters.chargingSpeed === option.value

              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onUpdateFilter('chargingSpeed', option.value)}
                  className={cn(
                    'min-w-0 flex-1 rounded-xl px-3 py-2 text-center transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                    selected ? 'bg-white shadow-e1' : 'hover:bg-white/60',
                  )}
                >
                  <span
                    className={cn(
                      'block whitespace-nowrap text-ui-sm font-bold',
                      selected ? 'text-plug-blue-700' : 'text-slate-600',
                    )}
                  >
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block whitespace-nowrap font-mono text-[10px]',
                      selected ? 'text-plug-blue-500' : 'text-slate-400',
                    )}
                  >
                    {option.range}
                  </span>
                </button>
              )
            })}
          </div>
        </Group>

        <Group label="Show only">
          <div className="flex flex-wrap gap-2">
            <Chip
              active={filters.availableOnly}
              onClick={() => onUpdateFilter('availableOnly', !filters.availableOnly)}
            >
              <Zap size={13} aria-hidden="true" />
              Available now
            </Chip>
            {/* A rating floor rather than an opening-hours claim: nothing in
                the data records 24/7 opening, so a "24/7" chip would be a
                filter that could never be honest. */}
            <Chip
              active={filters.minRating >= 4}
              onClick={() => onUpdateFilter('minRating', filters.minRating >= 4 ? 0 : 4)}
            >
              <Star size={13} aria-hidden="true" />
              Rated 4+
            </Chip>
          </div>
        </Group>
      </div>

      {/* ── The folded pair ──────────────────────────────────────── */}
      {isExpanded ? (
        <div
          id="filter-rail-more"
          className="hidden animate-fade-in border-t border-slate-100 bg-slate-50/60 lg:grid lg:grid-cols-[1fr_auto] lg:divide-x lg:divide-slate-100"
        >
          <Group label="Nearby amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon

                return (
                  <Chip
                    key={amenity.type}
                    active={filters.amenities.includes(amenity.type)}
                    onClick={() => toggleAmenity(amenity.type)}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {amenity.label}
                  </Chip>
                )
              })}
            </div>
          </Group>

          <Group label="Minimum rating">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onUpdateFilter('minRating', filters.minRating === value ? 0 : value)
                    }
                    onMouseEnter={() => setHoverRating(value)}
                    aria-label={`Minimum ${value} star${value === 1 ? '' : 's'}`}
                    className="rounded transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                  >
                    <Star
                      size={24}
                      aria-hidden="true"
                      className={
                        value <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="whitespace-nowrap text-ui-sm text-slate-500">
                {filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+ stars` : 'Any rating'}
              </span>
            </div>
          </Group>
        </div>
      ) : null}
    </section>
  )
}

/** One labelled cell of the rail. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="min-w-0 px-5 py-4 sm:px-6">
      <p className="mb-3 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      {children}
    </div>
  )
}

/**
 * The rail's one control shape.
 *
 * Selected state carries colour, a border and a shadow together rather than
 * colour alone, so it still reads on a phone in daylight and to a reader who
 * cannot separate blue from grey.
 */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-ui-sm font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        active
          ? 'border-plug-blue-300 bg-plug-blue-50 text-plug-blue-700 shadow-[0_1px_2px_rgba(37,99,235,0.12)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      {children}
    </button>
  )
}
