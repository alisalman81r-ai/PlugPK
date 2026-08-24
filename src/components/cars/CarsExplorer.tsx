// src/components/cars/CarsExplorer.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { useFavouriteCars } from '@/hooks/useFavouriteCars'
import {
  EMPTY_FILTERS,
  filterCars,
  filtersToParams,
  paramsToFilters,
  searchCars,
  type CarFilterState,
  type CarSort,
} from '@/lib/cars'

import { BrandRail } from './BrandRail'
import { CarHero } from './CarHero'
import { CarsBrowser } from './CarsBrowser'

/**
 * The whole discovery experience, and the single owner of its state.
 *
 * Search, filters and sort live here because three separate surfaces read them
 * — the hero's search box and brand select, the brand rail, and the sidebar and
 * sort in the results — and any of those holding its own copy is how two
 * controls end up disagreeing about what is being shown.
 *
 * State is mirrored into the URL. Without that a filtered view cannot be sent
 * to anybody, bookmarked, or returned to with the back button, which are the
 * three things somebody does after finding a car they like. The URL is the
 * source on first load and a reflection afterwards:
 *
 *   - Initial state is read from the query string, so a shared link opens the
 *     view it describes.
 *   - Changes are written with replace(), not push(), so typing five characters
 *     leaves one history entry rather than five — the back button should exit
 *     the page, not walk backwards through a search.
 *   - scroll: false, because Next scrolls to the top on navigation by default
 *     and the results are below the fold; without it every keystroke would
 *     yank the page upward.
 */

export interface CarsExplorerProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  /**
   * Rendered between the hero and the catalogue.
   *
   * A slot rather than an import, because the insights are computed on the
   * server from the full dataset and never change with the filters — passing
   * the finished element keeps that work out of the client bundle.
   */
  insights?: React.ReactNode
}

export function CarsExplorer({
  cars,
  brands,
  categories,
  connectors,
  insights,
}: CarsExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Seeded from the URL exactly once.
   *
   * A useState initialiser rather than an effect that syncs both ways: two-way
   * binding between state and the address bar fights itself, and the only
   * moment the URL needs to win is the first render.
   */
  const initial = React.useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [query, setQuery] = React.useState(initial.query)
  const [filters, setFilters] = React.useState<CarFilterState>(initial.filters)
  const [sort, setSort] = React.useState<CarSort>(initial.sort)
  const [savedOnly, setSavedOnly] = React.useState(false)

  const favourites = useFavouriteCars()
  const resultsRef = React.useRef<HTMLDivElement>(null)

  /**
   * Write the state back to the address bar.
   *
   * Deferred rather than immediate: on a long filter interaction this fires on
   * every keystroke, and router.replace is not free. A short timeout collapses
   * a burst of typing into one navigation.
   */
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = filtersToParams(query, filters, sort)
      const next = params.toString()
      if (next === window.location.search.replace(/^\?/, '')) return
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, filters, sort, pathname, router])

  /** Brand counts for the rail, computed with the brand facet itself removed. */
  const brandCounts = React.useMemo(() => {
    const base = filterCars(searchCars(cars, query), { ...filters, brands: [] })
    const out: Record<string, number> = {}
    for (const brand of brands) out[brand] = base.filter((car) => car.brand === brand).length
    return out
  }, [cars, query, filters, brands])

  /**
   * The hero select shows a brand only when exactly one is chosen — with two
   * ticked there is no single value a `<select>` could honestly display, so it
   * falls back to "All brands" rather than implying the other is off.
   */
  const heroBrand = filters.brands.length === 1 ? (filters.brands[0] ?? null) : null

  const shown = React.useMemo(() => {
    const matched = filterCars(searchCars(cars, query), filters)
    return savedOnly ? matched.filter((car) => favourites.ids.includes(car.id)) : matched
  }, [cars, query, filters, savedOnly, favourites.ids])

  const stats = React.useMemo(
    () => [
      { value: String(shown.length), label: shown.length === cars.length ? 'Cars' : 'Matches' },
      { value: String(new Set(shown.map((car) => car.brand)).size), label: 'Brands' },
      { value: String(shown.filter((car) => car.category === 'EV').length), label: 'Full EV' },
    ],
    [shown, cars.length],
  )

  const scrollToResults = () =>
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <CarHero
        query={query}
        onQueryChange={setQuery}
        brand={heroBrand}
        onBrandChange={(brand) =>
          setFilters((current) => ({ ...current, brands: brand ? [brand] : [] }))
        }
        brands={brands}
        stats={stats}
        onSubmit={scrollToResults}
      />

      {insights}

      <section ref={resultsRef} className="scroll-mt-4 bg-white py-12 lg:py-16">
        <div className="container-plug">
          <BrandRail
            brands={brands}
            counts={brandCounts}
            selected={filters.brands}
            /**
             * One brand at a time, and tapping the active one clears it.
             *
             * It used to accumulate, which made the rail and the hero's brand
             * select contradict each other: the select can only hold one value,
             * so picking a second brand in the rail left it showing "All
             * brands" while two were active. Single-select makes the two
             * controls the same control.
             *
             * The sidebar checkboxes still allow several — that is a filter
             * panel, where combining is the point. The rail is a shortcut, and
             * a shortcut that needs a second tap to undo the first is not one.
             */
            onToggle={(brand) =>
              setFilters((current) => ({
                ...current,
                brands: current.brands.length === 1 && current.brands[0] === brand ? [] : [brand],
              }))
            }
            onClear={() => setFilters((current) => ({ ...current, brands: [] }))}
          />

          <div className="mt-12">
            <CarsBrowser
              cars={cars}
              categories={categories}
              connectors={connectors}
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              favouriteIds={favourites.ids}
              onToggleFavourite={(car) => favourites.toggle(car.id)}
              savedOnly={savedOnly}
              onSavedOnlyChange={setSavedOnly}
            />
          </div>
        </div>
      </section>
    </>
  )
}

export { EMPTY_FILTERS }
