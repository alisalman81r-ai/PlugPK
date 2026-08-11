// src/app/services/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { ServiceCategoryTabs } from '@/components/services/ServiceCategoryTabs'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { ServiceGrid } from '@/components/services/ServiceGrid'
import { ServiceHero } from '@/components/services/ServiceHero'
import { useServices } from '@/hooks/useServices'
import { MOCK_SERVICES } from '@/lib/mock-data'

/**
 * Owns all filter state. The tabs, filter bar and grid must share it, so they
 * all live here — inside the Suspense boundary useSearchParams requires.
 */
function ServicesDirectory() {
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

      <div id="service-results" className="container-plug">
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

        {!isLoading && filteredServices.length >= 6 ? (
          <div className="mb-20 mt-12 text-center">
            <button
              type="button"
              disabled
              className="h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-400"
            >
              All {filteredServices.length} services shown
            </button>
          </div>
        ) : (
          <div className="mb-20" />
        )}
      </div>
    </>
  )
}

export default function ServicesPage() {
  return (
    <>
      <ServiceHero totalServices={MOCK_SERVICES.length} />

      {/* useSearchParams needs a Suspense boundary during static rendering. */}
      <Suspense
        fallback={
          <div className="container-plug py-20 text-center text-sm text-slate-400">
            Loading services...
          </div>
        }
      >
        <ServicesDirectory />
      </Suspense>
    </>
  )
}
