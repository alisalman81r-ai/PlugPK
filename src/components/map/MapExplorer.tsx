// src/components/map/MapExplorer.tsx
'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FilterRail } from '@/components/map/FilterRail'
import { MapControls } from '@/components/map/MapControls'
import { MapHero } from '@/components/map/MapHero'
import { MapSearchBar } from '@/components/map/MapSearchBar'
import { MobileFilterSheet } from '@/components/map/MobileFilterSheet'
import { PIN_LEGEND } from '@/components/map/StationPin'
import { StationPreviewCard } from '@/components/map/StationPreviewCard'
import { StationResults } from '@/components/map/StationResults'
import { useStations } from '@/hooks/useStations'
import { isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { getPortAvailability } from '@/lib/utils'

/**
 * The map page's interactive half. The page itself is a Server Component that
 * reads the listings from the database and hands them in as `stations`.
 *
 * ── Layout ─────────────────────────────────────────────────────────────
 *
 * On a desktop it reads top to bottom: the dark band with the search, the
 * filter rail lifted out of its lower edge, then the map in a matching mount,
 * then the results. Everything keeps to one measure so the three share their
 * left and right edges.
 *
 * On a phone that order put the map below the fold — the band and the rail
 * filled the first screen, and the thing the page is for started under the
 * thumb. So below `md` the map comes first, full width, with the search laid
 * over its top edge; the band (with its copy cut to one sentence) and the rail
 * follow it. The DOM order is the phone's, and `order-*` restores the desktop
 * one, so a screen reader meets the map and its search first everywhere.
 */

/** One measure for the whole page, so nothing steps out of line. */
export const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * The map's working height.
 *
 * On a phone, 62svh: the small-viewport unit is the height with the browser
 * chrome showing, so it does not resize under a scrolling thumb the way vh
 * does — that was the reason this used to be a flat 27rem. With the map now
 * first on the page it can take most of the screen, with a floor for short
 * landscape phones. From md up it scales with the screen but stops at 46rem —
 * the rail sits above the map there, so the fold has to hold both.
 */
export const MAP_HEIGHT = 'h-[62svh] min-h-[22rem] md:h-[clamp(28rem,68vh,46rem)] md:min-h-0'

/**
 * The frame both cards wear on a desktop: a thin white mount around the
 * content, the way a photograph is framed. Shared rather than copied, because
 * the moment the two frames differ they stop reading as one console. On a
 * phone the map goes edge to edge instead — a mount there is 12px of map lost
 * on each side.
 */
export const MOUNT =
  'rounded-[2rem] border border-white/20 bg-white/90 p-1.5 shadow-e4 backdrop-blur-sm sm:p-2'

/**
 * How far the rail is pulled up into the dark band above it. Deliberately less
 * than half its height, so it straddles the edge instead of floating inside
 * the band with nothing anchoring it to the page.
 */
export const RAIL_LIFT = '-mt-14 sm:-mt-16 lg:-mt-20'

// Dynamic import prevents SSR issues: both map SDKs need `window`.
const MapView = dynamic(() => import('@/components/map/MapView').then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <MapGrid label="Loading the map…" />,
})

/**
 * A faint grid rather than a blank grey field: it reads as a map arriving
 * rather than as a panel that failed. Shared by the chunk loader and the
 * idle-wait placeholder, so the handover is one continuous surface.
 */
function MapGrid({ label }: { label?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(5,36,30,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(5,36,30,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
      />
      {label ? (
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
          <p className="text-ui-sm font-medium text-slate-500">{label}</p>
        </div>
      ) : null}
    </div>
  )
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

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
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
    <div className="flex flex-col bg-slate-50">
      {/* ── The map ─────────────────────────────────────────
          First in the DOM and first on a phone; third on a desktop, directly
          under the rail in the matching mount. */}
      <div className="relative order-1 md:order-3 md:mt-6">
        <div className="md:mx-auto md:w-full md:max-w-[1400px] md:px-6 lg:px-10">
          <div className="md:rounded-[2rem] md:border md:border-white/20 md:bg-white/90 md:p-2 md:shadow-e4 md:backdrop-blur-sm">
            <div
              ref={mapRef}
              // Reaching for the map is a clear enough request to skip the wait.
              onPointerEnter={bootMapNow}
              onPointerDown={bootMapNow}
              onFocusCapture={bootMapNow}
              className={`relative ${MAP_HEIGHT} overflow-hidden bg-slate-100 md:rounded-[1.6rem] md:ring-1 md:ring-slate-900/10`}
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
                  <MapGrid />
                </div>
              )}

              {/* Locate-me, top-right: the SDK owns both bottom corners —
                  attribution on the left, zoom on the right. On a phone it
                  drops below the overlaid search. */}
              <div className="absolute right-4 top-[5.25rem] z-20 md:top-4">
                <MapControls
                  onFilterClick={() => setIsMobileFilterOpen(true)}
                  activeFilterCount={activeFilterCount}
                  resultCount={filteredStations.length}
                  onLocateMe={handleLocateMe}
                  isLocating={isLocating}
                  showFilterButton={false}
                />
              </div>

              {/* The pins carry two colours; this is where they are named.
                  Hidden on the smallest screens, where it would cost more map
                  than it explains. */}
              <div className="absolute left-4 top-4 z-20 hidden md:block">
                <div className="glass flex items-center gap-3.5 rounded-2xl border border-white/60 px-3.5 py-2 shadow-e3">
                  {PIN_LEGEND.map((entry) => (
                    <span key={entry.key} className="flex items-center gap-1.5">
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
                      onNavigate={handleNavigate}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Phone: the search sits over the top of the map. Outside the
            clipped frame, so its suggestions can drop below the map's edge
            instead of being cut off by it. */}
        <div className="absolute inset-x-3 top-3 z-30 md:hidden">
          <MapSearchBar {...searchProps} idPrefix="map-search-mobile" />
        </div>
      </div>

      {/* ── The band ───────────────────────────────────────── */}
      <div className="order-2 md:order-1">
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
      </div>

      {/* ── Refine ─────────────────────────────────────────
          Lifted out of the band's lower edge: it carries on from the search
          field above it, and a filter that changes what the map shows has to
          be visible while the map is. */}
      <div className={`relative z-10 order-3 md:order-2 ${RAIL_LIFT} ${STAGE}`}>
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

      {/* ── Results ─────────────────────────────────────────
          A plain section on the page: the framed cards above are the map and
          the controls that drive it. */}
      <div className={`order-4 ${STAGE} pb-20 pt-10 lg:pt-12`}>
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
