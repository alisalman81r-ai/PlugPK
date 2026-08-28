// src/app/(main)/routes/page.tsx
'use client'

import { Bookmark, BookmarkCheck, ChevronLeft, Route as RouteIcon, Share2 } from 'lucide-react'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'

import { PopularRoutes } from '@/components/route/PopularRoutes'
import { RouteHero } from '@/components/route/RouteHero'
import { RouteHowItWorks } from '@/components/route/RouteHowItWorks'
import { RouteInputForm } from '@/components/route/RouteInputForm'
import { RouteResultsView } from '@/components/route/RouteResultsView'
import { SaveRouteModal } from '@/components/route/SaveRouteModal'
import { FaqSection } from '@/components/shared/FaqSection'
import { ROUTES_FAQS } from '@/lib/faqs'
import { MOCK_EV_MODELS, MOCK_STATIONS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { PopularRoute } from '@/lib/route-distances'
import { useRoutePlanner } from '@/hooks/useRoutePlanner'

/**
 * The planning page reads: orient, pick a known route, or fill in your own.
 *
 * Popular routes come before the form. Most people planning an EV drive in
 * Pakistan are on one of six corridors, and for them a tap should be the whole
 * interaction — previously those six sat at the very bottom, below the form and
 * below a three-step explainer, so the shortcut was the last thing anyone saw.
 *
 * Everything shares the map page's shape: one dark band, one measure down the
 * page, and the first card lifted up into the band so it reads as the thing the
 * page is for.
 */

/** One measure, matching /map, so the two pages line up edge for edge. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/** How far the popular-routes card is pulled up into the dark band. */
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export default function RoutesPage() {
  const planner = useRoutePlanner()
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const formRef = React.useRef<HTMLDivElement>(null)

  const handleShare = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied — nothing further to fall back to.
    }
  }, [])

  /**
   * Cities with a station, counted rather than claimed — the same figure the
   * map's hero shows, and for the same reason.
   */
  const cityCount = React.useMemo(
    () => new Set(MOCK_STATIONS.map((station) => station.address.city)).size,
    [],
  )

  /**
   * A tapped route fills the form in and takes the reader to it.
   *
   * Aligned to the top rather than the centre, with scroll-mt clearing the
   * fixed navbar: centring a form this tall on a laptop puts its first field
   * under the header, so the one thing the tap just filled in is the one thing
   * you cannot see.
   */
  const { setOrigin, setDestination } = planner
  const applyPopularRoute = React.useCallback(
    (route: PopularRoute) => {
      setOrigin(route.from)
      setDestination(route.to)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [setOrigin, setDestination],
  )

  const showResults = planner.hasCalculated && planner.plannedRoute !== null

  return (
    <>
      <div className="min-h-below-nav bg-slate-50">
        {showResults && planner.plannedRoute ? (
          <>
            <header className="rounded-b-[2rem] bg-plug-navy-950 pb-12 pt-10 sm:rounded-b-[2.5rem]">
              <div className={STAGE}>
                {/* Everything you can do to this result sits on one line: the
                    way back on the left, what to do with it on the right. */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <HeaderAction onClick={planner.resetRoute}>
                    <ChevronLeft size={15} aria-hidden="true" />
                    Plan another route
                  </HeaderAction>

                  <div className="flex flex-wrap items-center gap-2">
                    <HeaderAction
                      onClick={() => setIsSaveModalOpen(true)}
                      active={planner.isSaved}
                    >
                      <MorphIcon
                        active={planner.isSaved}
                        on={BookmarkCheck}
                        off={Bookmark}
                        size={15}
                      />
                      {planner.isSaved ? 'Saved' : 'Save route'}
                    </HeaderAction>

                    <HeaderAction onClick={handleShare}>
                      <Share2 size={15} aria-hidden="true" />
                      {copied ? 'Link copied' : 'Share'}
                    </HeaderAction>
                  </div>
                </div>

                <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold leading-tight tracking-tight text-white">
                  {planner.plannedRoute.origin}{' '}
                  <span className="text-plug-cyan-400">→</span>{' '}
                  {planner.plannedRoute.destination}
                </h1>
              </div>
            </header>

            <div className={`${STAGE} py-10 lg:py-12`}>
              <RouteResultsView route={planner.plannedRoute} />
            </div>

            <SaveRouteModal
              isOpen={isSaveModalOpen}
              onClose={() => setIsSaveModalOpen(false)}
              route={planner.plannedRoute}
              onConfirm={() => {
                planner.saveRoute()
                setIsSaveModalOpen(false)
              }}
            />
          </>
        ) : (
          <>
            <RouteHero
              vehicleCount={MOCK_EV_MODELS.length}
              stationCount={MOCK_STATIONS.length}
              cityCount={cityCount}
            />

            {/* ── Popular routes, lifted into the band ─────────────── */}
            <div className={`relative z-10 ${CARD_LIFT} ${STAGE}`}>
              <PopularRoutes onSelect={applyPopularRoute} />
            </div>

            {/* ── The planner ──────────────────────────────────────── */}
            <div id="route-planner" ref={formRef} className={`${STAGE} scroll-mt-24 pt-14 lg:pt-16`}>
              {/* Wider than a typical form column: at max-w-3xl it read as a
                  narrow strip stranded under the full-width card above it. */}
              <div className="mx-auto max-w-4xl">
                <RouteInputForm
                  origin={planner.origin}
                  destination={planner.destination}
                  selectedVehicle={planner.selectedVehicle}
                  batteryPercent={planner.batteryPercent}
                  isCalculating={planner.isCalculating}
                  canCalculate={planner.canCalculate}
                  onOriginChange={planner.setOrigin}
                  onDestinationChange={planner.setDestination}
                  onVehicleSelect={planner.setSelectedVehicle}
                  onBatteryChange={planner.setBatteryPercent}
                  onSwapLocations={planner.swapLocations}
                  onCalculate={planner.calculateRoute}
                />

                {planner.error ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-ui-sm font-medium text-rose-700"
                  >
                    {planner.error}
                  </p>
                ) : null}
              </div>
            </div>

            {/* ── How it works ─────────────────────────────────────── */}
            <div className={`${STAGE} py-16 lg:py-20`}>
              <RouteHowItWorks />
            </div>
          </>
        )}

        {planner.isCalculating ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/[0.92] backdrop-blur-md"
          >
            <RouteIcon size={48} className="animate-pulse text-plug-blue-600" aria-hidden="true" />

            <span className="h-1 w-[200px] overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full origin-left animate-grow-x rounded-full bg-gradient-brand [animation-duration:2s]" />
            </span>

            <span className="text-center">
              <span className="block font-display text-lg font-bold text-slate-900">
                Calculating your route…
              </span>
              <span className="mt-1 block text-ui-sm text-slate-500">
                Finding the best charging stops for your EV
              </span>
            </span>
          </div>
        ) : null}
      </div>

      <FaqSection items={ROUTES_FAQS} tone="white" title="Common questions about planning" />
    </>
  )
}

/**
 * One control shape for the dark results header.
 *
 * Three buttons that do different things should still look like siblings; the
 * saved state is the only one that reads differently, and it earns that by
 * being a state rather than an action.
 */
function HeaderAction({
  onClick,
  active = false,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-ui-sm font-semibold transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950',
        active
          ? 'border-plug-cyan-400/60 bg-plug-cyan-400/15 text-plug-cyan-200'
          : 'border-white/15 bg-white/[0.06] text-white/75 hover:border-white/30 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
