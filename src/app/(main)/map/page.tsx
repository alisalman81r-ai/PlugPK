// src/app/(main)/map/page.tsx
'use client'

import dynamic from 'next/dynamic'

import { FaqSection } from '@/components/shared/FaqSection'
import { MAP_FAQS } from '@/lib/faqs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useMemo, useRef, useState } from 'react'

import { FilterRail } from '@/components/map/FilterRail'
import { MapControls } from '@/components/map/MapControls'
import { MapHero } from '@/components/map/MapHero'
import { MapSearchBar } from '@/components/map/MapSearchBar'
import { MobileFilterSheet } from '@/components/map/MobileFilterSheet'
import { PIN_LEGEND } from '@/components/map/StationPin'
import { StationPreviewCard } from '@/components/map/StationPreviewCard'
import { StationResults } from '@/components/map/StationResults'
import { useStations } from '@/hooks/useStations'
import type { Station } from '@/lib/types'

/**
 * The page is one centred column, not a split view.
 *
 * The map used to sit in the right-hand two thirds of a flex row, with a 380px
 * rail of filters and results pinned to its left. That gave the most spatial
 * element on the site the smaller half of the screen, and it stacked the
 * filters on top of the results inside a column too narrow for either.
 *
 * Now it reads top to bottom: refine, then map, then results. The filter rail
 * is the card lifted out of the dark hero band — controls belong with the
 * search field they extend, and a filter that changes what the map shows has to
 * be visible while the map is — and the map sits directly under it in a
 * matching frame. Both wear the same mount, so the pair reads as one console
 * rather than two unrelated panels, and everything keeps to one measure so the
 * rail, the map and the results grid share their left and right edges down the
 * whole page.
 */

/** One measure for the whole page, so nothing steps out of line. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * The map's working height.
 *
 * A flat 27rem on a phone: viewport units there are a moving target while the
 * browser chrome collapses, and a map that resizes under a scrolling thumb is
 * worse than one that is slightly short. From sm up it scales with the screen
 * but stops at 46rem — the rail now sits above the map rather than below it,
 * so the fold has to hold both.
 */
const MAP_HEIGHT = 'h-[27rem] sm:h-[clamp(28rem,68vh,46rem)]'

/**
 * The frame both cards wear.
 *
 * A thin white mount around the content, the way a photograph is framed. On the
 * rail it separates the controls from the dark band they overlap; on the map it
 * does the same job against the page. Shared rather than copied, because the
 * moment the two frames differ they stop reading as one console.
 */
const MOUNT =
  'rounded-[2rem] border border-white/20 bg-white/90 p-1.5 shadow-e4 backdrop-blur-sm sm:p-2'

/**
 * How far the rail is pulled up into the dark band above it.
 *
 * Deliberately less than half its height. The rail is a fraction of the map's
 * height — on a phone it collapses to just its header — so the map's old
 * -mt-32 would have floated the whole card inside the dark band with nothing
 * anchoring it to the page. It straddles the edge instead, at every width.
 */
const RAIL_LIFT = '-mt-14 sm:-mt-16 lg:-mt-20'

function MapExplorerFallback() {
  return (
    <div className="bg-slate-50">
      <div className="h-[400px] rounded-b-[2rem] bg-slate-950 sm:rounded-b-[2.5rem] lg:h-[430px]" />
      {/* The same two mounts, in the same order, at the same heights as the real
          thing — so nothing changes shape or shifts the page the moment the
          client takes over. */}
      <div className={`relative ${RAIL_LIFT} ${STAGE}`}>
        <div className={MOUNT}>
          <div className="h-[4.5rem] rounded-[1.6rem] bg-white ring-1 ring-slate-900/10 lg:h-[11rem]" />
        </div>
      </div>
      <div className={`${STAGE} mt-5 sm:mt-6`}>
        <div className={MOUNT}>
          <div
            className={`${MAP_HEIGHT} flex items-center justify-center overflow-hidden rounded-[1.6rem] bg-slate-100 ring-1 ring-slate-900/10`}
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
          </div>
        </div>
      </div>
      <div className={`${STAGE} py-10`}>
        <div className="h-24 rounded-3xl border border-slate-200/80 bg-white shadow-e2" />
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
    <div className="relative flex h-full w-full items-center justify-center bg-slate-100">
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
  const mapRef = useRef<HTMLDivElement>(null)

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

  /**
   * Selecting from the grid brings the map back into view.
   *
   * With the results below the map rather than beside it, a click down the page
   * used to move a pin the reader could not see — the selection appeared to do
   * nothing at all.
   */
  const handleSelectFromResults = useCallback((station: Station) => {
    setSelectedStation(station)
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [setSelectedStation])

  const selectedWithDistance = selectedStation
    ? stationsWithDistance.find((item) => item.id === selectedStation.id)
    : undefined

  /**
   * City names for the copy, most-covered first.
   *
   * From the unfiltered list, so the paragraph describes what the site covers
   * rather than what the current filter shows — and ordered by how many
   * stations each has, so the three the copy names are the three worth naming.
   */
  const cities = useMemo(() => {
    const counts = new Map<string, number>()
    for (const station of stations) {
      const city = station.address.city
      counts.set(city, (counts.get(city) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city)
  }, [stations])

  /** Counted from what is on the map right now, not from the whole database. */
  const availableNow = useMemo(
    () => filteredStations.filter((station) => station.status === 'available').length,
    [filteredStations],
  )

  return (
    <div className="bg-slate-50">
      <MapHero
        total={stations.length}
        shown={filteredStations.length}
        cities={cities}
        availableNow={availableNow}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        search={
          <MapSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            resultCount={filteredStations.length}
            onSelectStation={setSelectedStation}
          />
        }
      />

      {/* ── Refine ─────────────────────────────────────────
          The rail is what now lifts out of the dark band: it carries on from the
          search field directly above it, and putting the controls here means the
          map never has to be scrolled away from to change what it shows. */}
      <div className={`relative z-10 ${RAIL_LIFT} ${STAGE}`}>
        <div className={MOUNT}>
          <FilterRail
            filters={filters}
            onUpdateFilter={updateFilter}
            onResetFilters={resetFilters}
            activeFilterCount={activeFilterCount}
            resultCount={filteredStations.length}
            totalCount={stations.length}
            onOpenSheet={() => setIsMobileFilterOpen(true)}
          />
        </div>
      </div>

      {/* ── The map ─────────────────────────────────────────
          Directly under the rail, in the matching mount, so the controls and the
          surface they act on read as one console rather than two panels. */}
      <div className={`${STAGE} mt-5 sm:mt-6`}>
        <div className={MOUNT}>
          <div
            ref={mapRef}
            className={`relative ${MAP_HEIGHT} overflow-hidden rounded-[1.6rem] bg-slate-100 ring-1 ring-slate-900/10`}
          >
            <MapView
              stations={filteredStations}
              selectedStation={selectedStation}
              onStationSelect={setSelectedStation}
              onMapClick={() => setSelectedStation(null)}
              userLocation={userLocation}
            />

            {/*
              One floating control: locate-me. Search and every filter already sit
              in the band and the rail above, so nothing else has to be laid over
              the map. Top-right, because the SDK owns both bottom corners —
              attribution on the left, zoom on the right.
            */}
            <div className="absolute right-4 top-4 z-20">
              <MapControls
                onFilterClick={() => setIsMobileFilterOpen(true)}
                activeFilterCount={activeFilterCount}
                resultCount={filteredStations.length}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
                showFilterButton={false}
              />
            </div>

            {/* The pins carry three colours; this is where they are named.
                Hidden on the smallest screens, where it would cost more map than
                it explains. */}
            <div className="absolute left-4 top-4 z-20 hidden sm:block">
              <div className="glass flex items-center gap-3.5 rounded-2xl border border-white/60 px-3.5 py-2 shadow-e3">
                {PIN_LEGEND.map((entry) => (
                  <span key={entry.status} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${entry.colorClass}`}
                    />
                    <span className="text-ui-xs font-semibold text-slate-700">{entry.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Desktop preview card floats over the map it belongs to. */}
            {selectedStation ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden justify-center p-5 lg:flex">
                <div className="pointer-events-auto w-full max-w-[440px] animate-fade-in">
                  <StationPreviewCard
                    station={selectedStation}
                    distanceKm={selectedWithDistance?.distanceKm}
                    onClose={() => setSelectedStation(null)}
                    onViewDetails={handleViewDetails}
                    onNavigate={handleNavigate}
                  />
                </div>
              </div>
            ) : null}
          </div>
          </div>
      </div>

      {/* ── Results ─────────────────────────────────────────
          A plain section on the page: the two framed cards above are the map and
          the controls that drive it, and a third mount here would flatten the
          pair into a stack of equal panels. */}
      <div className={`${STAGE} pb-20 pt-10 lg:pt-12`}>
        <StationResults
          stations={stationsWithDistance}
          selectedStation={selectedStation}
          onStationSelect={handleSelectFromResults}
          isLoading={isLoading}
          onResetFilters={resetFilters}
          hasUserLocation={userLocation !== null}
        />
      </div>

      {/* Phone: the selected station docks above the tab bar, where a thumb
          already is, instead of over the middle of the map. */}
      {selectedStation ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 animate-slide-up px-3 pb-3 lg:hidden">
          <StationPreviewCard
            station={selectedStation}
            distanceKm={selectedWithDistance?.distanceKm}
            onClose={() => setSelectedStation(null)}
            onViewDetails={handleViewDetails}
            onNavigate={handleNavigate}
          />
        </div>
      ) : null}

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

      <FaqSection items={MAP_FAQS} title="Common questions about the map" />
    </>
  )
}
