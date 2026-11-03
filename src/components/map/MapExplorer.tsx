// src/components/map/MapExplorer.tsx
'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FilterRail } from '@/components/map/FilterRail'
import { MapControls } from '@/components/map/MapControls'
import { MapHero } from '@/components/map/MapHero'
import { MapSearchBar } from '@/components/map/MapSearchBar'
import { MapLoadingMark } from '@/components/map/MapLoadingMark'
import { PIN_LEGEND } from '@/components/map/StationPin'
import { StationPreviewCard } from '@/components/map/StationPreviewCard'
import { StationResults } from '@/components/map/StationResults'
import { Zap } from '@/components/ui/icons'
import { WRAP } from '@/components/v2/ui'
import { MAP_HEIGHT, RAIL_LIFT } from '@/components/map/layout'
import { useStations } from '@/hooks/useStations'
import { isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { getPortAvailability } from '@/lib/utils'

/**
 * The map page's interactive half. The page itself is a Server Component that
 * reads the listings from the database and hands them in as `stations`.
 *
 * ── Layout (landing-v2 map.html) ───────────────────────────────────────
 *
 * Top to bottom on every screen: the ink hero with the search pill, the
 * "Refine the map" sheet lifted out of its lower edge, the map in a rounded
 * frame with a white halo, then the results grid. Everything keeps to the
 * design's 1320px measure so the three share their left and right edges.
 */


// Dynamic import prevents SSR issues: both map SDKs need `window`.
const MapView = dynamic(() => import('@/components/map/MapView').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <MapLoadingMark />,
})

/** The two legend entries' swatches: the same disc the pins carry. */
const LEGEND_SWATCH: Record<(typeof PIN_LEGEND)[number]['key'], string> = {
  fast: 'bg-ink text-volt',
  standard: 'bg-white text-ink shadow-[inset_0_0_0_1.5px_rgba(11,12,14,.35)]',
}

export interface MapExplorerProps {
  /** Database stations plus approved business listings, from the server page. */
  stations: Station[]
}

/**
 * useSearchParams forces this subtree to render on the client, so the page
 * wraps it in its own Suspense boundary rather than opting the whole route out
 * of static rendering.
 */
export function MapExplorer({ stations: allStations }: MapExplorerProps) {
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
    locate,
    stationsWithDistance,
    filteredStations,
  } = useStations({ stations: allStations, initialQuery: searchParams.get('q') ?? '' })

  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  /*
    ── The map boots after the page is usable, not before ──────────────

    Measured on a production build, arriving here used to spend 4.3 seconds in
    44 long tasks — one of them 650ms — and a blocked main thread does not
    answer clicks. The filters, the search field and every link in the header
    were on screen and dead while WebGL started up and the first tiles were
    decoded.

    So the chunk is allowed to land and mount only once the browser says it has
    nothing better to do. requestIdleCallback yields to input, so a click on a
    filter in the first second is handled before the map takes the thread. The
    2000ms timeout is the floor, not the target. Touching the frame overrides
    all of it — someone reaching for the map has said what they want.
  */
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (isMapReady) return

    // Safari has no requestIdleCallback; a short timer is the documented
    // stand-in and still clears the page's own hydration.
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => setIsMapReady(true), { timeout: 2000 })
        : window.setTimeout(() => setIsMapReady(true), 600)

    return () => {
      if (typeof window.cancelIdleCallback === 'function' && typeof idle === 'number') {
        window.cancelIdleCallback(idle)
      } else {
        window.clearTimeout(idle as number)
      }
    }
  }, [isMapReady])

  const bootMapNow = useCallback(() => setIsMapReady(true), [])

  const handleNavigate = useCallback((station: Station) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
      '_blank',
      'noopener,noreferrer',
    )
  }, [])

  /** Asks for a position and sorts by it; the spinner stops either way. */
  const handleLocateMe = useCallback(() => {
    setIsLocating(true)
    locate(() => setIsLocating(false))
  }, [locate])

  /**
   * Selecting from the grid brings the map back into view. With the results
   * below the map rather than beside it, a click down the page used to move a
   * pin the reader could not see.
   */
  const handleSelectFromResults = useCallback(
    (station: Station) => {
      setSelectedStation(station)
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    [setSelectedStation],
  )

  const selectedWithDistance = selectedStation
    ? stationsWithDistance.find((item) => item.id === selectedStation.id)
    : undefined

  /**
   * City names for the copy, most-covered first — from the unfiltered list, so
   * the paragraph describes what the site covers rather than what the current
   * filter shows.
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

  /** Installed ports on what the map shows right now. A count, not a reading. */
  const portsInstalled = useMemo(
    () => filteredStations.reduce((sum, station) => sum + getPortAvailability(station).total, 0),
    [filteredStations],
  )

  const exampleCount = useMemo(
    () => stations.filter((station) => isSampleListing(station.id)).length,
    [stations],
  )

  const searchProps = {
    value: searchQuery,
    onChange: setSearchQuery,
    onClear: () => setSearchQuery(''),
    resultCount: filteredStations.length,
    onSelectStation: setSelectedStation,
    stations,
  }

  return (
    <div className="bg-chalk">
      {/* Open the connections to the map's servers while the page settles, so
          the style, fonts and first tiles start sooner when the map boots. */}
      <link rel="preconnect" href="https://tiles.openfreemap.org" crossOrigin="anonymous" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <MapHero
        total={stations.length}
        shown={filteredStations.length}
        cities={cities}
        portsInstalled={portsInstalled}
        exampleCount={exampleCount}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        search={<MapSearchBar {...searchProps} idPrefix="map-search" />}
      />

      {/* ── Refine ─────────────────────────────────────────────
          Lifted out of the hero's lower edge: it carries on from the search
          field above it, and a filter that changes what the map shows has to
          be visible while the map is. */}
      <div className={`relative z-10 ${RAIL_LIFT} ${WRAP}`}>
        <FilterRail
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          resultCount={filteredStations.length}
          totalCount={stations.length}
        />
      </div>

      {/* ── The map ───────────────────────────────────────────── */}
      <section data-theme="light" aria-label="Charging map" className="pt-5 sm:pt-7">
        <div className={WRAP}>
          <div
            ref={mapRef}
            // Reaching for the map is a clear enough request to skip the wait.
            onPointerEnter={bootMapNow}
            onPointerDown={bootMapNow}
            onFocusCapture={bootMapNow}
            className={`relative isolate ${MAP_HEIGHT} overflow-hidden rounded-[28px] border border-ink/10 bg-[#ECEAE3] shadow-[0_1px_2px_rgba(11,12,14,.06),0_8px_24px_-12px_rgba(11,12,14,.18),0_0_0_5px_rgba(255,255,255,.55)] sm:rounded-[36px] sm:shadow-[0_1px_2px_rgba(11,12,14,.06),0_8px_24px_-12px_rgba(11,12,14,.18),0_0_0_8px_rgba(255,255,255,.55)]`}
          >
            {isMapReady ? (
              <MapView
                stations={filteredStations}
                selectedStation={selectedStation}
                onStationSelect={setSelectedStation}
                onMapClick={() => setSelectedStation(null)}
                userLocation={userLocation}
              />
            ) : (
              <div aria-hidden="true" className="absolute inset-0">
                <MapLoadingMark />
              </div>
            )}

            {/* Locate-me, top-right; the SDK's attribution keeps bottom-left
                and the zoom stack bottom-right. */}
            <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
              <MapControls
                onFilterClick={() => undefined}
                activeFilterCount={activeFilterCount}
                resultCount={filteredStations.length}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
                showFilterButton={false}
              />
            </div>

            {/* The pins carry two looks; this is where they are named. */}
            <div
              aria-label="Legend"
              className="absolute left-3 top-3 z-20 flex items-center gap-2.5 rounded-full border border-ink/10 bg-paper/90 py-1.5 pl-1.5 pr-2.5 font-mono text-[11px] font-semibold text-ink shadow-e1 backdrop-blur-[10px] sm:left-4 sm:top-4 sm:gap-3.5 sm:py-2 sm:pl-2.5 sm:pr-3.5 sm:text-xs"
            >
              {PIN_LEGEND.map((entry) => (
                <span key={entry.key} className="inline-flex items-center gap-[7px]">
                  <i
                    aria-hidden="true"
                    className={`grid h-5 w-5 place-items-center rounded-full ${LEGEND_SWATCH[entry.key]}`}
                  >
                    <Zap className="h-[11px] w-[11px] fill-current" />
                  </i>
                  {entry.label}
                </span>
              ))}
            </div>

            {/* Desktop preview card floats over the map it belongs to. */}
            {selectedStation ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden justify-center p-5 lg:flex">
                <div className="pointer-events-auto w-full max-w-[440px] animate-fade-in">
                  <StationPreviewCard
                    station={selectedStation}
                    distanceKm={selectedWithDistance?.distanceKm}
                    onClose={() => setSelectedStation(null)}
                    onNavigate={handleNavigate}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Results ───────────────────────────────────────────── */}
      <section
        id="results"
        data-theme="light"
        className={`${WRAP} pb-[clamp(40px,5vw,72px)] pt-[clamp(64px,7vw,104px)]`}
      >
        <StationResults
          stations={stationsWithDistance}
          selectedStation={selectedStation}
          onStationSelect={handleSelectFromResults}
          isLoading={isLoading}
          onResetFilters={resetFilters}
          hasUserLocation={userLocation !== null}
        />
      </section>

      {/* Phone: the selected station docks above the tab bar, where a thumb
          already is, instead of over the middle of the map. */}
      {selectedStation ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 animate-slide-up px-3 pb-3 lg:hidden">
          <StationPreviewCard
            station={selectedStation}
            distanceKm={selectedWithDistance?.distanceKm}
            onClose={() => setSelectedStation(null)}
            onNavigate={handleNavigate}
          />
        </div>
      ) : null}
    </div>
  )
}
