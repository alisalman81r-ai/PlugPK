// src/components/cars/CarsExplorer.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { useFavouriteCars } from '@/hooks/useFavouriteCars'
import { filtersToParams, paramsToFilters, type CarFilterState, type CarSort } from '@/lib/cars'

import { CarsBrowser } from './CarsBrowser'

/**
 * The cars page, and the single owner of its state.
 *
 * A title, a toolbar and the grid — the cars start on the first screen. Search,
 * filters and sort live here and are mirrored into the URL, so a filtered view
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

  return (
    <section className="bg-slate-50 pb-20 pt-8 sm:pt-12 lg:pt-14">
      <div className="container-plug">
        <header className="mb-7 sm:mb-9">
          <h1 className="font-display text-[2.5rem] font-black leading-none tracking-[-0.035em] text-slate-900 sm:text-[3.25rem]">
            Cars
          </h1>
          <p className="mt-3 max-w-2xl text-ui-lg leading-relaxed text-slate-600">
            {cars.length} electric, plug-in hybrid and hybrid cars on sale in Pakistan — prices, range and charging,
            as published.
          </p>
        </header>

        <CarsBrowser
          cars={cars}
          brands={brands}
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
  )
}

