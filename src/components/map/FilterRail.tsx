// src/components/map/FilterRail.tsx
'use client'

import { Check, ChevronDown, RotateCcw, SlidersHorizontal, Star } from '@/components/ui/icons'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { AmenityType, ConnectorType, StationFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FLABEL, btnClass, chipClass } from '@/components/v2/ui'
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
 * It is the landing-v2 "Refine the map" sheet, lifted into the hero. On a
 * phone the same groups stack inside it, as the design draws them, so every
 * filter is one tap away on every screen.
 */

export interface FilterRailProps {
  filters: StationFilters
  onUpdateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  onResetFilters: () => void
  activeFilterCount: number
  resultCount: number
  totalCount: number
  className?: string
}

export function FilterRail({
  filters,
  onUpdateFilter,
  onResetFilters,
  activeFilterCount,
  resultCount,
  totalCount,
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
      aria-labelledby="filter-rail-title"
      data-theme="light"
      className={cn(
        // The landing-v2 .lift: a paper sheet lifted into the ink hero.
        'relative overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-e4 sm:rounded-[32px]',
        className,
      )}
    >
      {/*
        The count lives in this header rather than over the map: it is the
        answer to the controls it sits with, and a figure set over a map is a
        figure a pin can slide behind.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-ink/10 bg-[linear-gradient(90deg,#F4F3EE,#fff)] px-[18px] py-[18px] sm:gap-5 sm:px-7 sm:py-[22px]">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-ink/10 bg-chalk text-ink sm:h-[46px] sm:w-[46px]"
          >
            <SlidersHorizontal size={20} />
          </span>
          <div className="min-w-0">
            <h2 id="filter-rail-title" className="font-display text-[22px] leading-[1.1] text-ink sm:text-[26px]">
              Refine the map
            </h2>
            <p aria-live="polite" className="mt-1 text-sm text-muted">
              Showing <b className="font-mono font-semibold text-ink">{resultCount}</b> of{' '}
              <span className="font-mono">{totalCount}</span> {totalCount === 1 ? 'station' : 'stations'}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors duration-200 hover:bg-chalk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:h-[42px]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Clear
              <ChipCount>{activeFilterCount}</ChipCount>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsExpanded((open) => !open)}
            aria-expanded={isExpanded}
            aria-controls="filter-rail-more"
            className={btnClass('ink', 'sm', 'h-11 flex-1 sm:h-[42px] sm:flex-none')}
          >
            {isExpanded ? 'Fewer filters' : 'More filters'}
            <ChevronDown
              aria-hidden="true"
              className={cn('!h-4 !w-4 transition-transform duration-[400ms] ease-out', isExpanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/*
        Dividers rather than cards: the three groups are one control surface
        read across. Three columns from xl; below that connector and "show
        only" share a row and the speed control takes the full width under
        them; on a phone they stack.
      */}
      <div className="grid md:grid-cols-[1fr_auto] xl:grid-cols-[auto_auto_1fr]">
        <Group label="Connector" className="md:col-start-1 md:row-start-1">
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

        <Group
          label="Charging speed"
          className="border-t border-ink/10 md:col-span-2 md:row-start-2 xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:border-l xl:border-t-0"
        >
          {/* A segmented control, because the speeds are one ordered choice
              rather than five independent toggles — and the kW range sits under
              each label so nobody has to guess what "Rapid" means. */}
          <div role="radiogroup" aria-label="Charging speed" className="flex w-full gap-0.5 rounded-2xl bg-stone p-1 xl:inline-flex xl:w-auto">
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
                    'grid min-w-0 flex-1 justify-items-center gap-0.5 rounded-xl px-0.5 py-2 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-200 sm:px-3 sm:text-sm xl:min-w-[84px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                    selected ? 'bg-white text-ink shadow-e1' : 'text-muted hover:text-ink',
                  )}
                >
                  {option.label}
                  <small
                    className={cn(
                      'whitespace-nowrap font-mono text-[9px] font-medium tracking-[-0.03em] sm:text-[10px] sm:tracking-normal',
                      selected ? 'text-volt-ink' : 'text-fog',
                    )}
                  >
                    {option.range}
                  </small>
                </button>
              )
            })}
          </div>
        </Group>

        <Group label="Show only" className="border-t border-ink/10 md:col-start-2 md:row-start-1 md:border-l md:border-t-0 xl:col-start-3">
          <div className="flex flex-wrap gap-2">
            {/* No "Available now" chip. It filtered on a status column that only
                changes when someone edits it — plugpk has no live connection to
                the hardware — so it hid stations on a guess. A rating floor
                rather than an opening-hours claim: nothing in the data records
                24/7 opening. */}
            <Chip
              active={filters.minRating >= 4}
              onClick={() => onUpdateFilter('minRating', filters.minRating >= 4 ? 0 : 4)}
              check={false}
            >
              <Star
                aria-hidden="true"
                className={filters.minRating >= 4 ? 'fill-[#F5A524] text-[#F5A524]' : undefined}
              />
              Rated 4+
            </Chip>
          </div>
        </Group>
      </div>

      {/* ── The folded pair ──────────────────────────────────────── */}
      {isExpanded ? (
        <div
          id="filter-rail-more"
          className="grid animate-fade-in border-t border-ink/10 bg-white md:grid-cols-[1fr_auto]"
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
                    check={false}
                  >
                    <Icon aria-hidden="true" />
                    {amenity.label}
                  </Chip>
                )
              })}
            </div>
          </Group>

          <Group label="Minimum rating" className="border-t border-ink/10 md:border-l md:border-t-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onUpdateFilter('minRating', filters.minRating === value ? 0 : value)
                    }
                    onMouseEnter={() => setHoverRating(value)}
                    aria-label={`Minimum ${value} star${value === 1 ? '' : 's'}`}
                    aria-pressed={filters.minRating === value}
                    className="grid h-10 w-9 place-items-center rounded-lg transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <Star
                      size={24}
                      aria-hidden="true"
                      className={value <= displayRating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-ink/15'}
                    />
                  </button>
                ))}
              </div>
              <span className="whitespace-nowrap font-mono text-xs font-semibold text-muted">
                {filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+ stars` : 'Any rating'}
              </span>
            </div>
          </Group>
        </div>
      ) : null}
    </section>
  )
}

/** One labelled cell of the sheet (.mfilter__grp). */
function Group({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('grid min-w-0 content-start gap-3.5 px-[18px] pb-5 pt-[18px] sm:px-7 sm:pb-[26px] sm:pt-[22px]', className)}
    >
      <p className={cn(FLABEL, 'text-[11px]')}>{label}</p>
      {children}
    </div>
  )
}

function ChipCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-ink px-[7px] py-0.5 font-mono text-[11px] font-semibold text-volt">{children}</span>
  )
}

/**
 * The .chip: white with a hairline at rest, ink when pressed — with a volt
 * tick that springs in, so the state reads by shape as well as by colour.
 */
function Chip({
  active,
  onClick,
  check = true,
  children,
}: {
  active: boolean
  onClick: () => void
  /** The sliding tick; off for chips that lead with their own icon. */
  check?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={chipClass(
        active,
        'h-11 sm:h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
      )}
    >
      {check ? (
        <Check
          aria-hidden="true"
          className={cn(
            'shrink-0 text-volt transition-[width,opacity,margin] duration-300 ease-spring',
            active ? '!w-3.5 opacity-100' : '-mr-2 !w-0 opacity-0',
          )}
        />
      ) : null}
      {children}
    </button>
  )
}
