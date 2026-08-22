// src/components/cars/CarsBrowser.tsx
'use client'

import { Car as CarIcon, GitCompareArrows, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { AnimatedIcon } from '@/components/ui'
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

/**
 * Filters, sorting and the comparison tray, over one list.
 *
 * The search query and the filter object are owned by CarsExplorer above,
 * because the hero holds the only search box on the page. Sort, the drawer and
 * the comparison tray are local — nothing outside needs them, and lifting state
 * nobody else reads only makes the parent harder to follow.
 *
 * The filter panel, the sort select and the cards are all controlled, which is
 * what lets the mobile drawer and the desktop sidebar be the same component:
 * they read the same object, so opening the drawer never shows a different set
 * of choices than the sidebar had.
 *
 * The order of operations matters and is deliberate: search, then filter, then
 * sort. Sorting first would be wasted work, and filtering before searching
 * would make the brand counts describe a list the user cannot see.
 */

export interface CarsBrowserProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  priceBounds: { min: number; max: number }
  /** Owned by CarsExplorer, because the hero's input is the search box. */
  query: string
  onQueryChange: (query: string) => void
  filters: CarFilterState
  onFiltersChange: (filters: CarFilterState) => void
}

/** Four columns of specs is already dense on a phone; more would not read. */
const MAX_COMPARE = 4

export function CarsBrowser({
  cars,
  brands,
  categories,
  connectors,
  priceBounds,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: CarsBrowserProps) {
  const [sort, setSort] = React.useState<CarSort>('price-asc')
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [compared, setCompared] = React.useState<string[]>([])

  const searched = React.useMemo(() => searchCars(cars, query), [cars, query])
  const results = React.useMemo(
    () => sortCars(filterCars(searched, filters), sort),
    [searched, filters, sort],
  )

  /**
   * Counts shown beside each brand and category.
   *
   * Computed with that facet's own selection removed, which is what makes them
   * useful: with BYD checked, the count beside MG has to mean "how many if you
   * checked MG too", not zero.
   */
  const brandCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, brands: [] })
    const out: Record<string, number> = {}
    for (const brand of brands) out[brand] = base.filter((car) => car.brand === brand).length
    return out
  }, [searched, filters, brands])

  const categoryCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, categories: [] })
    const out: Record<string, number> = {}
    for (const category of categories) {
      out[category] = base.filter((car) => car.category === category).length
    }
    return out
  }, [searched, filters, categories])

  const isFiltered = hasActiveFilters(filters) || query.trim().length > 0

  const toggleCompare = (car: Car) => {
    setCompared((current) =>
      current.includes(car.id)
        ? current.filter((id) => id !== car.id)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, car.id],
    )
  }

  const reset = () => {
    onQueryChange('')
    onFiltersChange(EMPTY_FILTERS)
  }

  // The drawer is a fixed overlay, so the page behind it must not scroll —
  // otherwise a swipe on the backdrop moves the list instead of the drawer.
  React.useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  const panel = (
    <CarFilters
      filters={filters}
      onChange={onFiltersChange}
      brands={brands}
      categories={categories}
      connectors={connectors}
      priceBounds={priceBounds}
      brandCounts={brandCounts}
      categoryCounts={categoryCounts}
    />
  )

  return (
    // The comparison tray is fixed to the bottom of the viewport, so without
    // this the last row of cards sits underneath it and the final card's
    // buttons cannot be reached. Reserved only while the tray is up.
    <div className={cn(compared.length > 0 && 'pb-28 sm:pb-24')}>
      {/*
        ── Category segments ──────────────────────────────────────
        A segmented control above the results, not just checkboxes in the
        sidebar. Powertrain is the first cut almost every buyer makes, and
        making it a one-tap switch at the top of the grid is faster than
        opening a panel — on a phone the sidebar is behind a drawer, so
        without this the primary filter is two taps away.

        It writes into the same filters.categories array the sidebar uses, so
        the two never disagree.
      */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Segment
          active={filters.categories.length === 0}
          onClick={() => onFiltersChange({ ...filters, categories: [] })}
          count={searched.length}
        >
          All cars
        </Segment>

        {categories.map((category) => (
          <Segment
            key={category}
            active={filters.categories.length === 1 && filters.categories[0] === category}
            onClick={() => onFiltersChange({ ...filters, categories: [category] })}
            count={categoryCounts[category] ?? 0}
          >
            {CATEGORY_LABEL[category]}
          </Segment>
        ))}
      </div>

      {/* ── Results header ─────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className="text-ui-sm text-slate-500">
            <span className="font-bold text-slate-900">{results.length}</span>{' '}
            {results.length === 1 ? 'car' : 'cars'}
            {results.length !== cars.length ? (
              <span className="text-slate-400"> of {cars.length}</span>
            ) : null}
          </p>

          {/*
            What is being searched for, echoed as a removable chip rather than
            a second input. The hero holds the field; repeating it here would
            give the page two boxes that could disagree.
          */}
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <span className="truncate">&ldquo;{query}&rdquo;</span>
              <X size={12} aria-hidden="true" className="shrink-0 text-slate-500" />
            </button>
          ) : null}

          {hasActiveFilters(filters) ? (
            <button
              type="button"
              onClick={() => onFiltersChange(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Filters
              <X size={12} aria-hidden="true" className="shrink-0 text-slate-500" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-3">
          {/* Only on small screens — the sidebar is always visible above lg. */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-slate-300 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 lg:hidden"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
            {hasActiveFilters(filters) ? (
              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-white">
                on
              </span>
            ) : null}
          </button>

          <label className="relative flex h-12 items-center">
            <span className="sr-only">Sort cars</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CarSort)}
              className="h-12 w-full appearance-none rounded-xl border-[1.5px] border-slate-200 bg-white pl-4 pr-9 text-ui-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-500"
            >
              {(Object.keys(SORT_LABELS) as CarSort[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
            <SlidersHorizontal
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 text-slate-400"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[17.5rem_1fr] lg:gap-8 xl:gap-10">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          {/*
            A card, not a bare column. The controls previously floated against
            the page with nothing bounding them, so the sidebar and the results
            grid read as one undifferentiated field of small type. Sticky below
            the navbar so the filters stay reachable while a long grid scrolls.
          */}
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-20px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-ui font-bold tracking-tight text-slate-900">
                <SlidersHorizontal size={15} className="text-slate-400" aria-hidden="true" />
                Filters
              </h2>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={reset}
                  className="text-ui-xs font-semibold text-plug-blue-600 transition-colors hover:text-plug-blue-800"
                >
                  Reset all
                </button>
              ) : null}
            </div>

            <div className="px-5 py-4">{panel}</div>
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────── */}
        <div>
          {results.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  isCompared={compared.includes(car.id)}
                  onToggleCompare={toggleCompare}
                  compareDisabled={compared.length >= MAX_COMPARE}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <AnimatedIcon motion="pop" standalone>
                <CarIcon size={40} className="text-slate-200" aria-hidden="true" />
              </AnimatedIcon>
              <p className="mt-4 text-ui font-semibold text-slate-600">No cars match that</p>
              <p className="mt-1.5 max-w-xs text-ui-sm leading-relaxed text-slate-400">
                Try a different brand, or loosen one of the minimums.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-full border-[1.5px] border-slate-300 px-5 py-2 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900"
              >
                Clear everything
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* A sheet: header and the apply button pinned, only the controls
              between them scrolling — so the count and the way out stay on
              screen however far down the panel you are. */}
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-e4">
            <div className="shrink-0 px-6 pt-3">
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-10 rounded-full bg-slate-200"
              />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Filters</h2>
              <div className="flex items-center gap-3">
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-ui-sm font-semibold text-plug-blue-600"
                  >
                    Reset
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border-y border-slate-100 px-6 py-4">
              {panel}
            </div>

            <div className="shrink-0 p-6">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-full rounded-xl bg-slate-900 text-ui font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Show {results.length} {results.length === 1 ? 'car' : 'cars'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Comparison tray ────────────────────────────────────── */}
      {compared.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="container-plug flex flex-wrap items-center justify-between gap-3">
            <p className="text-ui-sm text-slate-600">
              <span className="font-bold text-slate-900">{compared.length}</span> selected
              <span className="text-slate-400"> · up to {MAX_COMPARE}</span>
            </p>

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompared([])}
                className="text-ui-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Clear
              </button>

              {/*
                The comparison lives at its own URL, carrying the ids in the
                query string. That makes a comparison shareable and survivable
                across a refresh, which a modal holding it in state would not be.
                Two cars minimum — comparing one car with nothing is just the
                detail page.
              */}
              <Link
                href={`/cars/compare?ids=${compared.join(',')}`}
                aria-disabled={compared.length < 2}
                className={cn(
                  'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ui-sm font-semibold transition-colors',
                  compared.length < 2
                    ? 'pointer-events-none bg-slate-200 text-slate-400'
                    : 'bg-slate-900 text-white hover:bg-slate-800',
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

const CATEGORY_LABEL: Record<CarCategory, string> = {
  EV: 'Electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
  Hybrid: 'Hybrid',
}

/**
 * One tab of the segmented control.
 *
 * A count on every segment, including zero — a tab that would return nothing
 * says so before it is tapped, which is kinder than an empty grid and a
 * "nothing matches" message.
 */
function Segment({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-ui-sm font-semibold transition-all duration-200',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_4px_14px_-6px_rgba(15,23,42,0.5)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900',
        count === 0 && !active && 'opacity-45',
      )}
    >
      {children}
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums',
          active ? 'text-white/60' : 'text-slate-400',
        )}
      >
        {count}
      </span>
    </button>
  )
}
