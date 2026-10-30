// src/components/cars/CarsExplorer.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { useFavouriteCars } from '@/hooks/useFavouriteCars'
import { filtersToParams, paramsToFilters, type CarFilterState, type CarSort } from '@/lib/cars'

import { CarHero } from './CarHero'
import { CarsBrowser } from './CarsBrowser'

/**
 * The cars page, and the single owner of its state.
 *
 * The dark hero every directory opens with, holding the search and the brand,
 * then the toolbar and the grid. Search, filters and sort live here, because
 * the hero and the toolbar both write them, and are mirrored into the URL so a
 * filtered view
 * can be sent to somebody, bookmarked, or returned to with the back button:
 *
 *   - Initial state is read from the query string, so a shared link opens the
 *     view it describes.
 *   - Changes are written with replace(), not push(), so typing five characters
 *     leaves one history entry rather than five.
 *   - scroll: false, because Next scrolls to the top on navigation by default
 *     and every keystroke would otherwise move the page.
 */

export interface CarsExplorerProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
}

export function CarsExplorer({ cars, brands, categories, connectors }: CarsExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /* Seeded from the URL exactly once. Two-way binding between state and the
     address bar fights itself; the URL only needs to win on the first render. */
  const initial = React.useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString()), cars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [query, setQuery] = React.useState(initial.query)
  const [filters, setFilters] = React.useState<CarFilterState>(initial.filters)
  const [sort, setSort] = React.useState<CarSort>(initial.sort)
  const [savedOnly, setSavedOnly] = React.useState(false)

  const favourites = useFavouriteCars()

  /* Written back after a short pause, so a burst of typing is one navigation. */
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = filtersToParams(query, filters, sort).toString()
      if (next === window.location.search.replace(/^\?/, '')) return
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, filters, sort, pathname, router])

  const resultsRef = React.useRef<HTMLElement>(null)
  const heroBrand = filters.brands.length === 1 ? (filters.brands[0] ?? null) : null

  /* The hero's figures describe the catalogue as a whole, not the filtered
     grid: the grid has its own live count right above it. */
  const stats = React.useMemo(
    () => [
      { value: String(cars.length), label: 'Cars' },
      { value: String(brands.length), label: 'Brands' },
      { value: String(cars.filter((car) => car.category === 'EV').length), label: 'Full EV' },
    ],
    [cars, brands],
  )

  return (
    <>
      <CarHero
        query={query}
        onQueryChange={setQuery}
        brand={heroBrand}
        onBrandChange={(brand) => setFilters((current) => ({ ...current, brands: brand ? [brand] : [] }))}
        brands={brands}
        stats={stats}
        onSubmit={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <section ref={resultsRef} className="scroll-mt-20 bg-slate-50 pb-20 pt-8 sm:pt-10">
        <div className="container-plug">
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
      </section>
    </>
  )
}

