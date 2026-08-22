// src/components/cars/CarsExplorer.tsx
'use client'

import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { EMPTY_FILTERS, filterCars, searchCars, type CarFilterState } from '@/lib/cars'

import { CarHero } from './CarHero'
import { CarsBrowser } from './CarsBrowser'

/**
 * The dark hero and the white results, sharing one search box.
 *
 * The hero's input and brand select are the page's only search controls, so the
 * state has to live above both — otherwise the toolbar below would need its own
 * input and the two could disagree about what is being searched for.
 *
 * The brand select writes into the same `filters.brands` array the sidebar
 * checkboxes use, rather than a separate field. That is what keeps them honest:
 * picking BYD in the hero ticks BYD in the sidebar, and unticking it there
 * empties the hero select. Two controls over one value, not two values.
 */

export interface CarsExplorerProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  priceBounds: { min: number; max: number }
}

export function CarsExplorer({
  cars,
  brands,
  categories,
  connectors,
  priceBounds,
}: CarsExplorerProps) {
  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<CarFilterState>(EMPTY_FILTERS)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  /**
   * The hero select shows a brand only when exactly one is chosen.
   *
   * With two ticked in the sidebar there is no single value a `<select>` could
   * honestly display, so it falls back to "All brands" rather than picking one
   * of them and implying the other is off.
   */
  const heroBrand = filters.brands.length === 1 ? (filters.brands[0] ?? null) : null

  const stats = React.useMemo(() => {
    const shown = filterCars(searchCars(cars, query), filters)
    return [
      // Reflects what is on screen, so the rail never disagrees with the grid.
      { value: String(shown.length), label: shown.length === cars.length ? 'Cars' : 'Matches' },
      { value: String(new Set(shown.map((car) => car.brand)).size), label: 'Brands' },
      { value: String(shown.filter((car) => car.category === 'EV').length), label: 'Full EV' },
    ]
  }, [cars, query, filters])

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
        // Scrolls rather than submits: the filtering already happened on the
        // keystroke, so the only useful thing left is to show the results.
        onSubmit={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <section ref={resultsRef} className="scroll-mt-8 bg-white py-14 lg:py-20">
        <div className="container-plug">
          <CarsBrowser
            cars={cars}
            brands={brands}
            categories={categories}
            connectors={connectors}
            priceBounds={priceBounds}
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </section>
    </>
  )
}
