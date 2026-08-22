// src/components/cars/CarsBrowser.tsx
'use client'

import { Car as CarIcon, GitCompareArrows, Search, SlidersHorizontal, X } from 'lucide-react'
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
 * Search, filters, sorting and the comparison tray, over one list.
 *
 * State lives here and nowhere else — the filter panel, the sort select and the
 * cards are all controlled. That is what lets the mobile drawer and the desktop
 * sidebar be the same component: they read the same object, so opening the
 * drawer never shows a different set of choices than the sidebar had.
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
}

/** Four columns of specs is already dense on a phone; more would not read. */
const MAX_COMPARE = 4

export function CarsBrowser({
  cars,
  brands,
  categories,
  connectors,
  priceBounds,
}: CarsBrowserProps) {
  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<CarFilterState>(EMPTY_FILTERS)
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
    setQuery('')
    setFilters(EMPTY_FILTERS)
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
      onChange={setFilters}
      brands={brands}
      categories={categories}
      connectors={connectors}
      priceBounds={priceBounds}
      brandCounts={brandCounts}
      categoryCounts={categoryCounts}
    />
  )

  return (
    <div>
      {/* ── Search and sort ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 flex-1 items-center gap-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white px-4 transition-shadow focus-within:border-blue-500 focus-within:shadow-focus">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a brand or model — BYD, Tiggo, PHEV…"
            aria-label="Search cars"
            className="w-full border-none bg-transparent text-ui text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} aria-hidden="true" />
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

      <div className="mt-8 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h2 className="text-ui font-bold tracking-tight text-slate-900">Filters</h2>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={reset}
                  className="text-ui-xs font-semibold text-plug-blue-600 hover:underline"
                >
                  Reset
                </button>
              ) : null}
            </div>
            {panel}
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────── */}
        <div>
          <p className="mb-6 text-ui-sm text-slate-500">
            {results.length === cars.length
              ? `${cars.length} cars in the Pakistan market`
              : `${results.length} of ${cars.length} cars`}
          </p>

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

          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-e4">
            <div className="mb-6 flex items-center justify-between gap-4">
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

            {panel}

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-8 h-12 w-full rounded-xl bg-slate-900 text-ui font-semibold text-white"
            >
              Show {results.length} {results.length === 1 ? 'car' : 'cars'}
            </button>
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
