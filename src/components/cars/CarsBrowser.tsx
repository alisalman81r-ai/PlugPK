// src/components/cars/CarsBrowser.tsx
'use client'

import {
  Car as CarIcon,
  ChevronDown,
  GitCompareArrows,
  Search,
  SlidersHorizontal,
  X,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { AnimatedIcon, Button, buttonClasses } from '@/components/ui'
import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
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
import { CarFilters } from './CarFilters'
import { MAX_COMPARE, useComparedCars } from './compare-selection'

/**
 * The catalogue: one toolbar, one grid.
 *
 * The toolbar carries the cuts a buyer makes first — a search, the powertrain,
 * the brand — in one row above the grid, so the cars start on the first screen
 * instead of below a hero. The finer filters (battery, range, power, plug) are
 * behind the filter button in a panel, since few visitors reach for them and
 * a permanent sidebar cost the grid a third of its width.
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

const CATEGORY_LABEL: Record<CarCategory, string> = {
  EV: 'EV',
  PHEV: 'PHEV',
  REEV: 'REEV',
  Hybrid: 'Hybrid',
}

/** Spelled out, for the pill's tooltip and its accessible name. */
const CATEGORY_TITLE: Record<CarCategory, string> = {
  EV: 'Fully electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
  Hybrid: 'Hybrid, no plug',
}

/** How many of the panel's filters are on, for the badge on its button. */
function panelFilterCount(filters: CarFilterState): number {
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
  const [panelOpen, setPanelOpen] = React.useState(false)
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
    The count on each powertrain pill, with the category itself removed: with
    EV selected, the number on PHEV has to mean "how many if you switched".
  */
  const categoryCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, categories: [] })
    const out: Record<string, number> = { all: base.length }
    for (const category of categories) out[category] = base.filter((car) => car.category === category).length
    return out
  }, [searched, filters, categories])

  const panelCount = panelFilterCount(filters)
  const isFiltered = hasActiveFilters(filters) || query.trim().length > 0 || savedOnly
  const selectedBrand = filters.brands.length === 1 ? (filters.brands[0] ?? '') : ''

  // Back to the first page whenever the set being drawn changes.
  const resultsKey = JSON.stringify([query, filters, sort, savedOnly])
  React.useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [resultsKey])

  const page = results.slice(0, visible)
  const remaining = results.length - page.length

  const reset = () => {
    onQueryChange('')
    onFiltersChange(EMPTY_FILTERS)
    onSavedOnlyChange(false)
  }

  /*
    The panel is a modal: the page behind it must not scroll, and Escape closes
    it. Escape is bound on the document because focus is not inside the panel
    until something in it has been tabbed to.
  */
  React.useEffect(() => {
    if (!panelOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  return (
    /* Room under the grid for the comparison tray while it is up, so the last
       row's buttons are never underneath it. More below lg, where the tray sits
       on top of the mobile tab bar. */
    <div className={cn(compared.length > 0 && 'pb-40 lg:pb-24')}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <label className="relative block w-full lg:w-[20rem] lg:shrink-0">
          <span className="sr-only">Search cars</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by car or brand…"
            className={cn(
              'h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-11 text-ui text-slate-900',
              'placeholder:text-slate-400 outline-none transition-colors',
              'hover:border-slate-300 focus:border-plug-blue-500 focus:ring-4 focus:ring-plug-cyan-500/15',
              '[&::-webkit-search-cancel-button]:appearance-none',
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </label>

        {/* The powertrain pills scroll sideways on a phone rather than wrap: a
            second row of pills pushes the cars further down for no gain. */}
        <div className="-mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          <Pill
            active={filters.categories.length === 0 && !savedOnly}
            onClick={() => {
              onFiltersChange({ ...filters, categories: [] })
              onSavedOnlyChange(false)
            }}
            count={categoryCounts.all ?? 0}
          >
            All
          </Pill>
          {categories.map((category) => (
            <Pill
              key={category}
              active={filters.categories.length === 1 && filters.categories[0] === category}
              onClick={() => onFiltersChange({ ...filters, categories: [category] })}
              count={categoryCounts[category] ?? 0}
              title={CATEGORY_TITLE[category]}
            >
              {CATEGORY_LABEL[category]}
            </Pill>
          ))}
          {/* Absent until there is something in it — a Saved pill reading zero
              is an empty promise on a first visit. */}
          {favouriteIds.length > 0 ? (
            <>
              <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-slate-300" />
              <Pill active={savedOnly} onClick={() => onSavedOnlyChange(!savedOnly)} count={favouriteIds.length}>
                Saved
              </Pill>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
          <label className="relative flex-1 lg:flex-none">
            <span className="sr-only">Brand</span>
            <select
              value={selectedBrand}
              onChange={(event) =>
                onFiltersChange({ ...filters, brands: event.target.value ? [event.target.value] : [] })
              }
              className={cn(SELECT, 'w-full lg:w-auto lg:min-w-[10.5rem]', selectedBrand && 'border-slate-900')}
            >
              {/* Several brands can arrive in a shared link; say so rather than
                  show "All brands" while the grid is cut to them. */}
              {filters.brands.length > 1 ? <option value="">{filters.brands.length} brands</option> : null}
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </label>

          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-label={panelCount > 0 ? `More filters, ${panelCount} on` : 'More filters'}
            aria-haspopup="dialog"
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white text-slate-700 transition-colors',
              'hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
              panelCount > 0 ? 'border-slate-900' : 'border-slate-200',
            )}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {panelCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-plug-cyan-500 px-1 text-[0.6875rem] font-bold text-plug-navy-950">
                {panelCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* ── Results line ───────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p aria-live="polite" className="mr-1 text-ui-sm text-slate-500">
            <span className="font-bold text-slate-900">{results.length}</span>{' '}
            {results.length === 1 ? 'car' : 'cars'}
            {results.length !== cars.length ? <> of {cars.length}</> : null}
          </p>
          {query.trim() ? <Chip onRemove={() => onQueryChange('')}>&ldquo;{query.trim()}&rdquo;</Chip> : null}
          {filters.brands.map((brand) => (
            <Chip
              key={brand}
              onRemove={() => onFiltersChange({ ...filters, brands: filters.brands.filter((b) => b !== brand) })}
            >
              {brand}
            </Chip>
          ))}
          {panelCount > 0 ? (
            <Chip
              onRemove={() =>
                onFiltersChange({ ...filters, connectors: [], minBattery: null, minRange: null, minPower: null })
              }
            >
              {panelCount} {panelCount === 1 ? 'filter' : 'filters'}
            </Chip>
          ) : null}
          {isFiltered ? (
            <button
              type="button"
              onClick={reset}
              className="px-1 text-ui-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <label className="relative flex items-center gap-2 text-ui-sm text-slate-500">
          <span className="hidden sm:inline">Sort by</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CarSort)}
              aria-label="Sort cars"
              className="h-10 appearance-none rounded-full bg-transparent pl-3 pr-8 text-ui-sm font-semibold text-slate-900 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
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
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </span>
        </label>
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      {results.length > 0 ? (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {page.map((car, index) => (
              <CarCard
                key={car.id}
                car={car}
                isCompared={compared.includes(car.id)}
                onToggleCompare={(item) => comparison.toggle(item.id)}
                compareDisabled={compared.length >= MAX_COMPARE}
                isFavourite={favouriteIds.includes(car.id)}
                onToggleFavourite={onToggleFavourite}
                priority={index < 3}
              />
            ))}
          </div>

          {remaining > 0 ? (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
                className="inline-flex h-12 items-center rounded-full bg-dark-base px-7 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
              >
                Show {Math.min(remaining, PAGE_SIZE)} more
              </button>
              <p className="text-ui-xs text-slate-500" aria-live="polite">
                Showing {page.length} of {results.length}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 flex flex-col items-center rounded-[1.75rem] bg-slate-100 px-6 py-16 text-center">
          <AnimatedIcon motion="pop" standalone>
            <CarIcon size={40} className="text-slate-300" aria-hidden="true" />
          </AnimatedIcon>
          <p className="mt-4 text-ui-lg font-bold text-slate-900">
            {savedOnly && favouriteIds.length === 0 ? 'Nothing saved yet' : 'No cars match that'}
          </p>
          <p className="mt-1.5 max-w-xs text-ui-sm leading-relaxed text-slate-500">
            {savedOnly && favouriteIds.length === 0
              ? 'Tap the heart on a car to keep it here while you browse.'
              : 'Try a different brand, or loosen one of the filters.'}
          </p>
          <Button variant="secondary" onClick={reset} className="mt-5">
            Clear everything
          </Button>
        </div>
      )}

      {/* ── Filter panel ───────────────────────────────────────────
          A bottom sheet on a phone and a side panel from lg. z-[60], above the
          mobile tab bar, which would otherwise cover the "Show N cars" button. */}
      {panelOpen ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 bg-plug-navy-900/40 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[1.75rem] bg-white shadow-e4 lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[26rem] lg:rounded-l-[1.75rem] lg:rounded-tr-none">
            <div className="shrink-0 px-6 pt-3 lg:hidden">
              <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4 lg:pt-6">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900">Filters</h2>
              <div className="flex items-center gap-1">
                {panelCount > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onFiltersChange({ ...filters, connectors: [], minBattery: null, minRange: null, minPower: null })
                    }
                  >
                    Reset
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close filters"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border-y border-slate-100 px-6 py-4">
              <CarFilters filters={filters} onChange={onFiltersChange} connectors={connectors} />
            </div>

            <div className="shrink-0 p-6">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-dark-base text-ui font-semibold text-white transition-colors hover:bg-plug-blue-600"
              >
                Show {results.length} {results.length === 1 ? 'car' : 'cars'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Comparison tray ────────────────────────────────────────
          Above the mobile tab bar rather than under it, with the safe-area
          inset the bar carries too. */}
      {compared.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-y border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_-12px_rgba(5,36,30,0.25)] backdrop-blur lg:bottom-0 lg:border-b-0">
          <div className="container-plug flex flex-wrap items-center justify-between gap-3">
            <p className="whitespace-nowrap text-ui-sm text-slate-600">
              <span className="font-bold text-slate-900">{compared.length}</span> selected
              <span className="hidden text-slate-400 xs:inline"> · up to {MAX_COMPARE}</span>
            </p>

            <div className="flex flex-1 items-center justify-end gap-2">
              <Button variant="ghost" size="md" onClick={comparison.clear}>
                Clear
              </Button>
              {/* Its own URL, so a comparison can be shared and survives a
                  refresh. Two cars minimum. */}
              <Link
                href={`/cars/compare?ids=${compared.join(',')}`}
                aria-disabled={compared.length < 2}
                tabIndex={compared.length < 2 ? -1 : undefined}
                className={cn(
                  buttonClasses({ size: 'md' }),
                  'shrink-0 text-ui-sm',
                  compared.length < 2 && 'pointer-events-none bg-slate-200 text-slate-600',
                )}
              >
                <GitCompareArrows size={15} aria-hidden="true" />
                {compared.length < 2 ? 'Pick one more' : `Compare ${compared.length}`}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** The brand select's pill. */
const SELECT = cn(
  'h-12 appearance-none rounded-full border border-slate-200 bg-white pl-5 pr-10 text-ui font-semibold text-slate-900',
  'outline-none transition-colors hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-plug-blue-500',
)

/**
 * One powertrain pill. The count is shown on every pill, zero included, so a
 * pill that would empty the grid says so before it is tapped.
 */
function Pill({
  active,
  onClick,
  count,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      aria-label={title ? `${title}, ${count}` : undefined}
      className={cn(
        'inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-ui font-semibold transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        active
          ? 'border-dark-base bg-dark-base text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900',
        count === 0 && !active && 'opacity-45',
      )}
    >
      {children}
      <span className={cn('text-ui-xs tabular-nums', active ? 'text-white/60' : 'text-slate-400')}>{count}</span>
    </button>
  )
}

/** A removable chip for something that is narrowing the grid. */
function Chip({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-200/70 py-1.5 pl-3 pr-2 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
    >
      <span className="truncate">{children}</span>
      <X size={12} aria-hidden="true" className="shrink-0 text-slate-500" />
      <span className="sr-only">Remove</span>
    </button>
  )
}
