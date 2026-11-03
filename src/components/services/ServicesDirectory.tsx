// src/components/services/ServicesDirectory.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { ServiceCategoryTabs } from '@/components/services/ServiceCategoryTabs'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { ServiceGrid } from '@/components/services/ServiceGrid'
import { WRAP } from '@/components/v2/ui'
import { useServices } from '@/hooks/useServices'
import type { EVService } from '@/lib/types'

/**
 * The filterable directory: tabs, filter bar and grid over one shared state.
 *
 * Lifted out of the page so the page itself can be a server component and read
 * the services from the database. It was a client page importing MOCK_SERVICES,
 * which is why approving a service in the admin never made it appear here —
 * this listing was not connected to the table at all, while the category and
 * detail pages were.
 *
 * Everything below is unchanged from that version except where the data comes
 * from. It still owns all filter state, because the tabs, the filter bar and
 * the grid have to share it, and it still sits inside the Suspense boundary
 * useSearchParams requires.
 */
export function ServicesDirectory({ services }: { services: EVService[] }) {
  const searchParams = useSearchParams()

  const {
    filteredServices,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    sortBy,
    setSortBy,
    categoryCount,
  } = useServices({
    services,
    initialQuery: searchParams.get('q') ?? '',
    initialCity: searchParams.get('city') ?? 'all',
  })

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const clearFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedCity('all')
  }

  return (
    <>
      <ServiceCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCount={categoryCount}
      />

      <section
        id="service-results"
        aria-label="EV services"
        data-theme="light"
        className="pb-[clamp(64px,7vw,96px)] pt-8 sm:pt-12"
      >
        <div className={WRAP}>
        <ServiceFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={filteredServices.length}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <ServiceGrid
          services={filteredServices}
          isLoading={isLoading}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onClearFilters={clearFilters}
        />

        {/* A status, not a button: there is no "load more" behind it. */}
        {!isLoading && filteredServices.length >= 6 ? (
          <div className="mt-9 text-center">
            <small className="inline-flex h-9 items-center rounded-full border border-ink/10 bg-white px-4 font-mono text-[12.5px] font-medium text-muted">
              All {filteredServices.length} services shown
            </small>
          </div>
        ) : null}
        </div>
      </section>
    </>
  )
}
