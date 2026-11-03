// src/components/map/MapExplorer.tsx
'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import { scrollToEl, useIsoLayoutEffect, usePopIn } from '@/components/map/motion'
import { useStations } from '@/hooks/useStations'
import { gsap, prefersReduced } from '@/lib/gsap'
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

/**
 * The selected station's card rises in like the design's map popup
 * (page-map.js openPopup). Keyed by station, so each new pick replays it.
 */
function PopIn({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  usePopIn(ref)
  return (
    <div ref={ref} className={className}>
      {children}
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

  /**
   * page-map.js: asked from the hero, a position that arrives also glides the
   * page down to the map. The geolocation timeout is 8s, so a position landing
   * within 12s of the request is this request's answer.
   */
  const heroLocateAt = useRef(0)

  /** Asks for a position and sorts by it; the spinner stops either way. */
  const handleLocateMe = useCallback(() => {
    setIsLocating(true)
    locate(() => setIsLocating(false))
  }, [locate])

  const handleLocateFromHero = useCallback(() => {
    heroLocateAt.current = Date.now()
    handleLocateMe()
  }, [handleLocateMe])

  useEffect(() => {
    if (!userLocation || !heroLocateAt.current) return
    const recent = Date.now() - heroLocateAt.current < 12_000
    heroLocateAt.current = 0
    if (recent) scrollToEl(mapRef.current)
  }, [userLocation])

  /**
   * Selecting from the grid brings the map back into view (page-map.js
   * select from a card): only when the frame is not already on screen, with
   * the same Lenis glide.
   */
  const handleSelectFromResults = useCallback(
    (station: Station) => {
      setSelectedStation(station)
      const frame = mapRef.current
      if (!frame) return
      const r = frame.getBoundingClientRect()
      if (r.top < 60 || r.bottom > window.innerHeight + 40) scrollToEl(frame)
    },
    [setSelectedStation],
  )

  /**
   * A pin picked on the map nudges its card in the grid (page-map.js select
   * from a pin): the card springs from 97% back to full size.
   */
  const [pinPick, setPinPick] = useState<{ id: string; n: number } | null>(null)
  const handleSelectFromMap = useCallback(
    (station: Station) => {
      setSelectedStation(station)
      setPinPick((prev) => ({ id: station.id, n: (prev?.n ?? 0) + 1 }))
    },
    [setSelectedStation],
  )

  // page-map.js: Escape puts the selection down.
  useEffect(() => {
    if (!selectedStation) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedStation(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedStation, setSelectedStation])

  /**
   * The map frame rises into place as it scrolls in (page-map.js:
   * from y 40, opacity 0, 1.2s, expo.out, at "top 95%").
   */
  useIsoLayoutEffect(() => {
    const frame = mapRef.current
    if (!frame || prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.from(frame, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: frame, start: 'top 95%' },
      })
    })
    return () => ctx.revert()
  }, [])

  /** A shared ?q= link opens the map on what it matches, not the whole country. */
  const [fitOnLoad] = useState(() => Boolean(searchParams.get('q')?.trim()))

  /** Enter in the search field: the field lets go and the page glides to the map. */
  const handleSearchSubmit = useCallback(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    scrollToEl(mapRef.current)
  }, [])

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
    onSubmit: handleSearchSubmit,
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
        onLocateMe={handleLocateFromHero}
        isLocating={isLocating}
        search={<MapSearchBar {...searchProps} idPrefix="map-search" />}
      />

      {/* ── Refine ─────────────────────────────────────────────
          Lifted out of the hero's lower edge: it carries on from the search
          field above it, and a filter that changes what the map shows has to
          be visible while the map is. data-lift: it rises in after the hero. */}
      <div data-lift="" className={`relative z-10 ${RAIL_LIFT} ${WRAP}`}>
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
                onStationSelect={handleSelectFromMap}
                onMapClick={() => setSelectedStation(null)}
                userLocation={userLocation}
                fitOnLoad={fitOnLoad}
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
                <PopIn key={selectedStation.id} className="pointer-events-auto w-full max-w-[440px]">
                  <StationPreviewCard
                    station={selectedStation}
                    distanceKm={selectedWithDistance?.distanceKm}
                    onClose={() => setSelectedStation(null)}
                    onNavigate={handleNavigate}
                  />
                </PopIn>
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
          pinPick={pinPick}
          isLoading={isLoading}
          onResetFilters={resetFilters}
          hasUserLocation={userLocation !== null}
        />
      </section>

      {/* Phone: the selected station docks above the tab bar, where a thumb
          already is, instead of over the middle of the map. */}
      {selectedStation ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-3 pb-3 lg:hidden">
          <PopIn key={selectedStation.id}>
            <StationPreviewCard
              station={selectedStation}
              distanceKm={selectedWithDistance?.distanceKm}
              onClose={() => setSelectedStation(null)}
              onNavigate={handleNavigate}
            />
          </PopIn>
        </div>
      ) : null}
    </div>
  )
}
