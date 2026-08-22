// src/app/(main)/map/page.tsx
'use client'

import dynamic from 'next/dynamic'

import { FaqSection } from '@/components/shared/FaqSection'
import { MAP_FAQS } from '@/lib/faqs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'

import { FilterPanel } from '@/components/map/FilterPanel'
import { MapControls } from '@/components/map/MapControls'
import { MapHeader } from '@/components/map/MapHeader'
import { MapSearchBar } from '@/components/map/MapSearchBar'
import { MobileFilterSheet } from '@/components/map/MobileFilterSheet'
import { MobileStationSheet } from '@/components/map/MobileStationSheet'
import { StationPreviewCard } from '@/components/map/StationPreviewCard'
import { useStations } from '@/hooks/useStations'
import type { Station } from '@/lib/types'

/**
 * Holds the split layout while the client subtree mounts.
 *
 * The panel width here has to match FilterPanel's exactly. It was 400px against
 * the panel's 380px, so the map and everything in it jumped 20px sideways the
 * moment the client subtree took over — the kind of shift that reads as the
 * page being broken rather than loading.
 */
const PANEL_WIDTH = 'w-[380px]'

function MapExplorerFallback() {
  return (
    <div className="flex h-below-nav flex-col overflow-hidden">
      <div className="h-[76px] shrink-0 border-b border-white/10 bg-slate-950 lg:h-[84px]" />
      <div className="flex min-h-0 flex-1">
        <div
          className={`hidden shrink-0 border-r border-slate-200 bg-white lg:block ${PANEL_WIDTH}`}
        />
        <div className="flex flex-1 items-center justify-center bg-slate-100">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  )
}

// Dynamic import prevents SSR issues: the Google Maps SDK needs `window`.
const MapView = dynamic(() => import('@/components/map/MapView').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    /* A faint grid rather than a blank grey field: it reads as a map arriving
       rather than as a panel that failed, and it gives the spinner something
       to sit on. */
    <div className="relative flex h-full flex-1 items-center justify-center bg-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
        <p className="text-ui-sm font-medium text-slate-500">Loading the map…</p>
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
    stations,
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

  // City lives on the address, not the station. Counted from the unfiltered
  // list so the figure describes coverage rather than the current filter.
  const cities = new Set(stations.map((station) => station.address.city)).size

  return (
    /**
     * A flex column, so the header sizes itself and the map takes the rest.
     * Hardcoding a height for the header and subtracting it here would be a
     * third magic number alongside the nav's 72px, and it would be wrong the
     * first time the copy wrapped to two lines on a narrow screen.
     */
    <div className="flex h-below-nav flex-col overflow-hidden">
      <MapHeader total={stations.length} shown={filteredStations.length} cities={cities} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
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
          {/* No Filters button here: the panel beside it is always open on
              desktop, so the only control worth floating over the map is
              locate-me. */}
          <MapControls
            onFilterClick={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
            resultCount={filteredStations.length}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
            showFilterButton={false}
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
    <>
      <Suspense fallback={<MapExplorerFallback />}>
        <MapExplorer />
      </Suspense>

      {/* Below the explorer rather than inside it: the map fills the viewport
          by design, so the questions sit one scroll further down instead of
          competing with it for space. */}
      <FaqSection items={MAP_FAQS} title="Common questions about the map" />
    </>
  )
}
