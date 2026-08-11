// src/app/services/page.tsx
'use client'

import { useState } from 'react'

import { ServiceCategoryTabs } from '@/components/services/ServiceCategoryTabs'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { ServiceGrid } from '@/components/services/ServiceGrid'
import { ServiceHero } from '@/components/services/ServiceHero'
import { useServices } from '@/hooks/useServices'
import { MOCK_SERVICES } from '@/lib/mock-data'

export default function ServicesPage() {
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
  } = useServices()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const clearFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedCity('all')
  }

  return (
    <>
      <ServiceHero totalServices={MOCK_SERVICES.length} />

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
