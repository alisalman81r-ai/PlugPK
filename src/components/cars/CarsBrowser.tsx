// src/components/cars/CarsBrowser.tsx
'use client'

import { ChevronDown, GitCompareArrows, X } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Btn, ChipCount, btnClass, chipClass } from '@/components/v2/ui'
import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { gsap, prefersReduced } from '@/lib/gsap'
import {
  EMPTY_FILTERS,
  SORT_LABELS,
  filterCars,
  hasActiveFilters,
  searchCars,
  sortCars,
  type CarFilterState,
  type CarSort,
} from '@/lib/cars'
import { cn } from '@/lib/utils'

import { CarCard } from './CarCard'
import { TweenCount, useCarEntrance, useIsoLayoutEffect } from './car-motion'
import { CAR_ENTRANCE_ITEM } from './car-ui'
import { CarFilters } from './CarFilters'
import { MAX_COMPARE, useComparedCars } from './compare-selection'

/**
 * The catalogue (landing-v2's .catalog): powertrain chips and the filter
 * button, an inline filter panel, the count / active filters / sort row, the
 * card grid and "Show more".
 *
 * Query, filters and sort are owned by CarsExplorer, which mirrors them into
 * the URL. The panel, the comparison tray and paging are local.
 *
 * The order of operations is search, then filter, then sort: sorting first
 * would be wasted work, and filtering before searching would make the counts
 * describe a list the visitor cannot see.
 */

export interface CarsBrowserProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  query: string
  onQueryChange: (query: string) => void
  filters: CarFilterState
  onFiltersChange: (filters: CarFilterState) => void
  sort: CarSort
  onSortChange: (sort: CarSort) => void
  favouriteIds: string[]
  onToggleFavourite: (car: Car) => void
  /** Restricts the grid to saved cars. */
  savedOnly: boolean
  onSavedOnlyChange: (value: boolean) => void
}

/**
 * Cards per page. Filters, search and sort run over the whole catalogue; only
 * the drawing is paged, so a phone is not handed a hundred cards at once.
 */
const PAGE_SIZE = 24

/** Spelled out, for the chip's tooltip and its accessible name. */
const CATEGORY_TITLE: Record<CarCategory, string> = {
  EV: 'Fully electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
  Hybrid: 'Hybrid, no plug',
}

/** How many of the panel's specification filters are on. */
function specFilterCount(filters: CarFilterState): number {
  return (
    filters.connectors.length +
    (filters.minBattery !== null ? 1 : 0) +
    (filters.minRange !== null ? 1 : 0) +
    (filters.minPower !== null ? 1 : 0)
  )
}

export function CarsBrowser({
  cars,
  brands,
  categories,
  connectors,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  favouriteIds,
  onToggleFavourite,
  savedOnly,
  onSavedOnlyChange,
}: CarsBrowserProps) {
  /* The panel: open is the button's state (aria-expanded); shown is whether
     the panel is in the page (its hidden attribute), which on closing stays
     true until the panel has finished folding away. */
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [panelShown, setPanelShown] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panelMoved = React.useRef(false)
  const gridRef = React.useRef<HTMLUListElement>(null)
  // Remembered across pages and refreshes — see compare-selection.ts.
  const comparison = useComparedCars()
  const compared = comparison.ids
  const [visible, setVisible] = React.useState(PAGE_SIZE)

  const searched = React.useMemo(() => searchCars(cars, query), [cars, query])
  const results = React.useMemo(() => {
    const matched = filterCars(searched, filters)
    // Saving is a property of the visitor, not the car, so it is applied here
    // rather than folded into the filter state the URL carries.
    const scoped = savedOnly ? matched.filter((car) => favouriteIds.includes(car.id)) : matched
    return sortCars(scoped, sort)
  }, [searched, filters, sort, savedOnly, favouriteIds])

  /*
    The count on each powertrain chip, with the category itself removed: with
    EV selected, the number on PHEV has to mean "how many if you switched".
  */
  const categoryCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, categories: [] })
    const out: Record<string, number> = { all: base.length }
    for (const category of categories) out[category] = base.filter((car) => car.category === category).length
    return out
  }, [searched, filters, categories])

  /* The same for the brand chips in the panel: brand removed. */
  const brandCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, brands: [] })
    const out: Record<string, number> = {}
    for (const car of base) out[car.brand] = (out[car.brand] ?? 0) + 1
    return out
  }, [searched, filters])

  const specCount = specFilterCount(filters)
  const panelCount = specCount + filters.brands.length
  const isFiltered = hasActiveFilters(filters) || query.trim().length > 0 || savedOnly

  // Back to the first page whenever the set being drawn changes.
  const resultsKey = JSON.stringify([query, filters, sort, savedOnly])
  React.useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [resultsKey])

  const page = results.slice(0, visible)
  const remaining = results.length - page.length

  // Cards rise in as they scroll into view; a new result set brings them all
  // in again, "Show more" only the new ones (page-cars.js animateIn).
  useCarEntrance(gridRef)

  /*
    The filter panel (page-cars.js): opening unfolds it from no height over
    0.55s on expo.out while its chips pop up 12px one after another on
    back.out(1.6); closing folds it away in 0.3s on power2.in, then hides it.
    Reduced motion shows and hides it outright.
  */
  useIsoLayoutEffect(() => {
    if (!panelMoved.current) return
    const panel = panelRef.current
    if (!panel) return
    gsap.killTweensOf(panel)
    if (panelOpen) {
      if (prefersReduced()) return
      gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.55, ease: 'expo.out', clearProps: 'height' })
      gsap.from(panel.querySelectorAll('button[aria-pressed]'), {
        y: 12,
        autoAlpha: 0,
        duration: 0.5,
        ease: 'back.out(1.6)',
        stagger: 0.012,
        delay: 0.05,
      })
    } else if (prefersReduced()) {
      setPanelShown(false)
    } else {
      gsap.to(panel, {
        height: 0,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setPanelShown(false)
          gsap.set(panel, { clearProps: 'all' })
        },
      })
    }
  }, [panelOpen])

  const togglePanel = () => {
    panelMoved.current = true
    if (!panelOpen) setPanelShown(true)
    setPanelOpen(!panelOpen)
  }

  const reset = () => {
    onQueryChange('')
    onFiltersChange(EMPTY_FILTERS)
    onSavedOnlyChange(false)
  }

  const clearSpecs = () =>
    onFiltersChange({ ...filters, connectors: [], minBattery: null, minRange: null, minPower: null })

  return (
    /* Room under the grid for the comparison tray while it is up, so the last
       row's buttons are never underneath it. */
    <div className={cn(compared.length > 0 && 'pb-28')}>
      {/* ── Powertrain chips and the filter button ─────────────── */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Scroll sideways on a phone rather than wrap: a second row of chips
            pushes the cars further down for no gain. */}
        <div
          role="group"
          aria-label="Powertrain"
          className="-mr-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pl-0.5 pr-6 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] [scrollbar-width:none] sm:mr-0 [&::-webkit-scrollbar]:hidden"
        >
          <TypeChip
            on={filters.categories.length === 0 && !savedOnly}
            onClick={() => {
              onFiltersChange({ ...filters, categories: [] })
              onSavedOnlyChange(false)
            }}
            count={categoryCounts.all ?? 0}
          >
            All
          </TypeChip>
          {categories.map((category) => (
            <TypeChip
              key={category}
              on={filters.categories.length === 1 && filters.categories[0] === category}
              onClick={() => onFiltersChange({ ...filters, categories: [category] })}
              count={categoryCounts[category] ?? 0}
              title={CATEGORY_TITLE[category]}
            >
              {category}
            </TypeChip>
          ))}
          {/* Absent until there is something in it — a Saved chip reading zero
              is an empty promise on a first visit. */}
          {favouriteIds.length > 0 ? (
            <>
              <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 self-center bg-ink/15" />
              <TypeChip on={savedOnly} onClick={() => onSavedOnlyChange(!savedOnly)} count={favouriteIds.length}>
                Saved
              </TypeChip>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-controls="car-filter-panel"
          aria-label={panelCount > 0 ? `Filters, ${panelCount} on` : 'Filters'}
          className={cn(
            'relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-[1.5px] [transition:background-color_.25s,border-color_.25s,color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)] active:scale-95',
            panelOpen ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink hover:border-ink/30',
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2.2" />
              <circle cx="8" cy="17" r="2.2" />
            </g>
          </svg>
          {panelCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute right-[9px] top-[9px] h-[9px] w-[9px] rounded-full bg-volt shadow-[0_0_0_2px_#0B0C0E]"
            />
          ) : null}
        </button>
      </div>

      {/* ── The filter panel (.fpanel), inline under the bar ─────── */}
      <div
        ref={panelRef}
        id="car-filter-panel"
        hidden={!panelShown}
        className="mt-4 overflow-hidden rounded-3xl border border-ink/10 bg-white p-4 shadow-e1 sm:px-[22px] sm:pb-[22px] sm:pt-5"
      >
        <CarFilters
          filters={filters}
          onChange={onFiltersChange}
          brands={brands}
          brandCounts={brandCounts}
          connectors={connectors}
          onClearAll={reset}
          canClear={isFiltered}
        />
      </div>

      {/* ── Count, active filters, sort (.toolbar) ──────────────── */}
      <div className="mb-6 mt-[26px] grid grid-cols-[1fr_auto] items-center gap-3.5 md:flex md:flex-wrap md:justify-between">
        <p aria-live="polite" className="text-[15px] text-muted">
          <b className="font-mono font-semibold tabular-nums text-ink">
            <TweenCount value={results.length} />
          </b>{' '}
          {results.length === 1 ? 'car' : 'cars'}
          {results.length !== cars.length ? (
            <>
              {' '}
              of <span className="font-mono tabular-nums">{cars.length}</span>
            </>
          ) : null}
        </p>

        {isFiltered ? (
          <div className="col-span-2 row-start-2 flex min-w-0 flex-1 flex-wrap items-center gap-1.5 md:col-auto md:row-auto">
            {query.trim() ? <ActiveTag onRemove={() => onQueryChange('')}>&ldquo;{query.trim()}&rdquo;</ActiveTag> : null}
            {filters.brands.map((brand) => (
              <ActiveTag
                key={brand}
                onRemove={() => onFiltersChange({ ...filters, brands: filters.brands.filter((b) => b !== brand) })}
              >
                {brand}
              </ActiveTag>
            ))}
            {specCount > 0 ? (
              <ActiveTag onRemove={clearSpecs}>
                {specCount} {specCount === 1 ? 'filter' : 'filters'}
              </ActiveTag>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="min-h-[34px] px-1.5 text-[13px] font-medium text-muted underline underline-offset-[3px] transition-colors hover:text-ink"
            >
              Clear all
            </button>
          </div>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        <label className="flex items-center gap-2.5">
          <span className="hidden font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted md:inline">Sort by</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CarSort)}
              aria-label="Sort cars"
              className="h-11 cursor-pointer appearance-none rounded-full border-[1.5px] border-ink/10 bg-white pl-[18px] pr-10 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] hover:border-ink/30 focus-visible:border-ink focus-visible:shadow-focus"
            >
              {(Object.keys(SORT_LABELS) as CarSort[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            />
          </span>
        </label>
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      {results.length > 0 ? (
        <>
          {/* Keyed by the result set: a new search, filter or sort is a new
              grid, as the design redraws it, and its cards come in afresh. */}
          <ul
            key={resultsKey}
            ref={gridRef}
            aria-label="Cars"
            className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2 sm:gap-[clamp(14px,1.6vw,22px)] min-[1101px]:grid-cols-3"
          >
            {page.map((car, index) => (
              <li key={car.id} className={cn('min-w-0', CAR_ENTRANCE_ITEM)}>
                <CarCard
                  car={car}
                  isCompared={compared.includes(car.id)}
                  onToggleCompare={(item) => comparison.toggle(item.id)}
                  compareDisabled={compared.length >= MAX_COMPARE}
                  isFavourite={favouriteIds.includes(car.id)}
                  onToggleFavourite={onToggleFavourite}
                  priority={index < 3}
                />
              </li>
            ))}
          </ul>

          {remaining > 0 ? (
            <div className="mt-10 grid justify-items-center gap-2.5">
              <Btn variant="ink" size="lg" magnetic={false} onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                Show {Math.min(remaining, PAGE_SIZE)} more
              </Btn>
              <small className="font-mono text-[12.5px] tracking-[0.02em] text-muted" aria-live="polite">
                Showing {page.length} of {results.length}
              </small>
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid justify-items-center gap-4 rounded-[28px] border-[1.5px] border-dashed border-ink/15 px-5 py-16 text-center">
          <p className="font-display text-[26px] leading-[1.1] text-ink">
            {savedOnly && favouriteIds.length === 0 ? 'Nothing saved yet' : 'No cars match these filters.'}
          </p>
          <p className="-mt-1 max-w-xs text-sm leading-relaxed text-muted">
            {savedOnly && favouriteIds.length === 0
              ? 'Tap the heart on a car to keep it here while you browse.'
              : 'Try a different brand, or loosen one of the filters.'}
          </p>
          <Btn variant="ink" size="sm" magnetic={false} onClick={reset}>
            Clear all filters
          </Btn>
        </div>
      )}

      {/* ── Comparison tray ────────────────────────────────────────
          A floating ink pill, above the mobile tab bar rather than under it,
          with the safe-area inset the bar carries too. */}
      {compared.length > 0 ? (
        <div
          data-theme="dark"
          className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6"
        >
          <div className="flex w-full max-w-[560px] items-center gap-2 rounded-full bg-ink py-2 pl-5 pr-2 text-white shadow-e4 ring-1 ring-white/10">
            <p className="min-w-0 flex-1 truncate text-sm text-white/70">
              <b className="font-mono font-semibold text-white">{compared.length}</b> selected
              <span className="hidden text-white/45 sm:inline"> · up to {MAX_COMPARE}</span>
            </p>
            <button
              type="button"
              onClick={comparison.clear}
              className="h-11 shrink-0 rounded-full px-3.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Clear
            </button>
            {/* Its own URL, so a comparison can be shared and survives a
                refresh. Two cars minimum. */}
            <Link
              href={`/cars/compare?ids=${compared.join(',')}`}
              aria-disabled={compared.length < 2}
              tabIndex={compared.length < 2 ? -1 : undefined}
              className={cn(
                btnClass('volt', 'sm', 'h-11 shrink-0 shadow-none'),
                compared.length < 2 && 'pointer-events-none bg-white/10 text-white/60',
              )}
            >
              <GitCompareArrows aria-hidden="true" />
              {compared.length < 2 ? 'Pick one more' : `Compare ${compared.length}`}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * One powertrain chip. The count is shown on every chip, zero included, so a
 * chip that would empty the grid says so before it is tapped.
 */
function TypeChip({
  on,
  onClick,
  count,
  title,
  children,
}: {
  on: boolean
  onClick: () => void
  count: number
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      aria-label={title ? `${title}, ${count}` : undefined}
      className={chipClass(on, cn('h-11 shrink-0 px-3.5 sm:px-[18px]', count === 0 && !on && 'opacity-45'))}
    >
      {children}
      <ChipCount on={on}>
        <TweenCount value={count} />
      </ChipCount>
    </button>
  )
}

/** A removable tag for something that is narrowing the grid (.atag). */
function ActiveTag({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-[34px] max-w-full items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-2 text-[13px] font-medium text-white [transition:background-color_.25s,color_.25s] hover:bg-volt hover:text-ink"
    >
      <span className="truncate">{children}</span>
      <X size={14} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">Remove filter</span>
    </button>
  )
}
