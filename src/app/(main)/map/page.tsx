// src/app/(main)/map/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'

import { FilterPanel } from '@/components/map/FilterPanel'
import { MapControls } from '@/components/map/MapControls'
import { MapSearchBar } from '@/components/map/MapSearchBar'
import { MobileFilterSheet } from '@/components/map/MobileFilterSheet'
import { MobileStationSheet } from '@/components/map/MobileStationSheet'
import { StationPreviewCard } from '@/components/map/StationPreviewCard'
import { useStations } from '@/hooks/useStations'
import type { Station } from '@/lib/types'

/** Holds the split layout while the client subtree mounts, so the panel and
 *  map area do not pop in at different moments. */
function MapExplorerFallback() {
  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">
      <div className="hidden w-[400px] shrink-0 border-r border-slate-200 bg-white lg:block" />
      <div className="flex flex-1 items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
      </div>
    </div>
  )
}

// Dynamic import prevents SSR issues: the Google Maps SDK needs `window`.
const MapView = dynamic(() => import('@/components/map/MapView').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-1 items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-plug-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Loading map...</p>
      </div>
    </div>
  ),
})

/**
 * useSearchParams forces this subtree to render on the client, so it lives
 * inside its own Suspense boundary rather than opting the whole route out
 * of static rendering.
 */
function MapExplorer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    filters,
    isLoading,
    selectedStation,
    setSelectedStation,
    updateFilter,
    resetFilters,
    activeFilterCount,
    searchQuery,
    setSearchQuery,
    userLocation,
    stationsWithDistance,
    filteredStations,
  } = useStations({ initialQuery: searchParams.get('q') ?? '' })

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const handleNavigate = useCallback((station: Station) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
      '_blank',
      'noopener,noreferrer',
    )
  }, [])

  const handleViewDetails = useCallback(
    (station: Station) => {
      router.push(`/station/${station.slug}`)
    },
    [router],
  )

  const handleLocateMe = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      () => setIsLocating(false),
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  const selectedWithDistance = selectedStation
    ? stationsWithDistance.find((item) => item.id === selectedStation.id)
    : undefined

  return (
    <div className="relative flex h-[calc(100vh-72px)] overflow-hidden">
      {/* ── Desktop left panel ───────────────────────────────── */}
      <div className="hidden lg:flex">
        <FilterPanel
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          resultCount={filteredStations.length}
          stations={stationsWithDistance}
          selectedStation={selectedStation}
          onStationSelect={setSelectedStation}
          isLoading={isLoading}
          header={
            <MapSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              resultCount={filteredStations.length}
              onSelectStation={setSelectedStation}
            />
          }
        />
      </div>

      {/* ── Map area ─────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Mobile floating controls */}
        <div className="absolute inset-x-4 top-4 z-20 flex items-center gap-3 lg:hidden">
          <MapSearchBar
            className="flex-1"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            resultCount={filteredStations.length}
            onSelectStation={setSelectedStation}
          />
        </div>

        <div className="absolute right-4 top-[84px] z-20 lg:hidden">
          <MapControls
            onFilterClick={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
            resultCount={filteredStations.length}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
          />
        </div>

        {/* Desktop locate control */}
        <div className="absolute right-5 top-5 z-20 hidden lg:block">
          <MapControls
            onFilterClick={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
            resultCount={filteredStations.length}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
            className="[&>button:first-child]:hidden"
          />
        </div>

        <MapView
          stations={filteredStations}
          selectedStation={selectedStation}
          onStationSelect={setSelectedStation}
          onMapClick={() => setSelectedStation(null)}
          userLocation={userLocation}
        />

        {/* Desktop preview card floats over the map */}
        {selectedStation ? (
          <div className="absolute bottom-6 left-1/2 z-20 hidden w-[420px] -translate-x-1/2 lg:block">
            <StationPreviewCard
              station={selectedStation}
              distanceKm={selectedWithDistance?.distanceKm}
              onClose={() => setSelectedStation(null)}
              onViewDetails={handleViewDetails}
              onNavigate={handleNavigate}
            />
          </div>
        ) : null}
      </div>

      {/* ── Mobile sheets ────────────────────────────────────── */}
      <MobileStationSheet
        stations={stationsWithDistance}
        selectedStation={selectedStation}
        onStationSelect={setSelectedStation}
        onClearSelection={() => setSelectedStation(null)}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onNavigate={handleNavigate}
        onResetFilters={resetFilters}
      />

      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onResetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        resultCount={filteredStations.length}
      />
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapExplorerFallback />}>
      <MapExplorer />
    </Suspense>
  )
}
