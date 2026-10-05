// src/components/route/RoutesPlanner.tsx
'use client'

import { Bookmark, BookmarkCheck, ChevronLeft, Route as RouteIcon, Share2 } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'

import { PopularRoutes } from '@/components/route/PopularRoutes'
import { RouteHero } from '@/components/route/RouteHero'
import { RouteHowItWorks } from '@/components/route/RouteHowItWorks'
import { RouteInputForm } from '@/components/route/RouteInputForm'
import { RouteResultsView } from '@/components/route/RouteResultsView'
import { FaqSection } from '@/components/shared/FaqSection'
import { useRoutePlanner } from '@/hooks/useRoutePlanner'
import { saveMyRoute } from '@/lib/db/route-actions'
import { ROUTES_FAQS } from '@/lib/faqs'
import type { PopularRoute } from '@/lib/route-distances'
import { vehicleName, withArticle, type RouteVehicle } from '@/lib/route-plan'
import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'

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

export interface RoutesPlannerProps {
  /** The EVs the planner can route, read from the catalogue by the page. */
  vehicles: RouteVehicle[]
  /** Every listing the map shows — what the plan can stop at. */
  stations: Station[]
}

/** Signed in, signed out, or not known yet — the last is not the same as out. */
type Viewer = { name: string } | null | undefined

export function RoutesPlanner({ vehicles, stations }: RoutesPlannerProps) {
  const planner = useRoutePlanner(stations)

  /*
    Signed in? Asked of /api/me, the endpoint the header also asks. Undefined
    until it answers, so neither "Save" nor "Sign in to save" flashes up wrong.

    The header (Navbar) makes the same request on its own, so /routes asks
    twice. useCurrentUser would not fix that — it is a server action, a third
    kind of request, not a shared cache — so it is left as one fetch here until
    the header and this page can share one source.
  */
  const [viewer, setViewer] = React.useState<Viewer>(undefined)
  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user?: { name: string } | null }) => setViewer(data.user ?? null))
      .catch(() => {
        if (!abort.signal.aborted) setViewer(null)
      })
    return () => abort.abort()
  }, [])
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  /** This page with the plan in its query, for the sign-in link's way back. */
  const [returnTo, setReturnTo] = React.useState('/routes')

  /*
    A planned route lives in the address bar — ?from=&to=&car=&battery= — so
    Share copies a link that opens the same plan, a saved route on the
    dashboard can link straight back here, and signing in to save it comes
    back to the same plan. Opening such a link fills the form and plans it.
  */
  const [autoRun, setAutoRun] = React.useState(false)
  const { setOrigin, setDestination, setSelectedVehicle, setBatteryPercent } = planner
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const from = q.get('from')?.trim()
    const to = q.get('to')?.trim()
    const car = vehicles.find((v) => v.id === q.get('car'))
    // A car page links here with ?car= alone ("Plan a trip in this car"):
    // preselect it, and plan only when the journey is in the link too.
    if (car) setSelectedVehicle(car)
    if (!from || !to || !car) return
    setOrigin(from)
    setDestination(to)
    setSelectedVehicle(car)
    const battery = Number(q.get('battery'))
    if (q.has('battery') && Number.isFinite(battery) && battery >= 0 && battery <= 100) {
      setBatteryPercent(Math.round(battery))
    }
    setAutoRun(true)
  }, [vehicles, setOrigin, setDestination, setSelectedVehicle, setBatteryPercent])

  const { canCalculate, calculateRoute } = planner
  React.useEffect(() => {
    if (!autoRun || !canCalculate) return
    setAutoRun(false)
    void calculateRoute()
  }, [autoRun, canCalculate, calculateRoute])

  React.useEffect(() => {
    const route = planner.plannedRoute
    const url = new URL(window.location.href)
    for (const key of ['from', 'to', 'car', 'battery']) url.searchParams.delete(key)
    if (route) {
      url.searchParams.set('from', route.origin)
      url.searchParams.set('to', route.destination)
      url.searchParams.set('car', route.vehicle.id)
      // The charge the plan was made on, not wherever the slider is now.
      url.searchParams.set('battery', String(route.startPercent))
    }
    window.history.replaceState(null, '', url)
    setReturnTo(`${url.pathname}${url.search}`)
    setSaveError(null)
  }, [planner.plannedRoute])

  /** Saved to the account at once; put back if the server refuses. */
  const handleSave = React.useCallback(async () => {
    const route = planner.plannedRoute
    if (!route || planner.isSaved) return
    planner.saveRoute()
    setSaveError(null)
    const result = await saveMyRoute({
      origin: route.origin,
      destination: route.destination,
      carId: route.vehicle.id,
      carName: vehicleName(route.vehicle),
      batteryPercent: route.startPercent,
      distanceKm: route.totalDistanceKm,
      durationMin: route.estimatedDriveTimeMinutes + route.totalChargingTimeMinutes,
      stops: route.plan.stops.length,
    }).catch(() => null)
    if (!result?.ok) {
      planner.unsaveRoute()
      setSaveError(result?.message ?? 'Could not save this route. Try again.')
    }
  }, [planner])
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
   * Cities with a charger, counted from the listings the planner actually
   * routes through — the same list the map shows.
   */
  const cityCount = React.useMemo(
    () => new Set(stations.map((station) => station.address.city)).size,
    [stations],
  )

  /**
   * A tapped route fills the form in and takes the reader to it.
   *
   * Aligned to the top rather than the centre, with scroll-mt clearing the
   * fixed navbar: centring a form this tall on a laptop puts its first field
   * under the header, so the one thing the tap just filled in is the one thing
   * you cannot see.
   */
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
                    {/*
                      Saving is an account feature. Signed out, the button
                      used to vanish, so nobody knew it existed; now it is a
                      link to sign in that brings the visitor back to this same
                      plan (it lives in the query string).
                    */}
                    {viewer ? (
                      <HeaderAction onClick={() => void handleSave()} active={planner.isSaved}>
                        <MorphIcon
                          active={planner.isSaved}
                          on={BookmarkCheck}
                          off={Bookmark}
                          size={15}
                        />
                        {planner.isSaved ? 'Saved' : 'Save route'}
                      </HeaderAction>
                    ) : viewer === null ? (
                      <Link
                        href={`/login?redirect=${encodeURIComponent(returnTo)}`}
                        className={HEADER_ACTION}
                      >
                        <Bookmark size={15} aria-hidden="true" />
                        Sign in to save this route
                      </Link>
                    ) : null}

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
                <p className="mt-2 text-ui text-white/60">
                  In {withArticle(vehicleName(planner.plannedRoute.vehicle))}, leaving with{' '}
                  {planner.plannedRoute.startPercent}%
                </p>
                {saveError ? (
                  <p role="alert" className="mt-3 text-ui-sm font-medium text-rose-300">{saveError}</p>
                ) : null}
              </div>
            </header>

            <div className={`${STAGE} py-10 lg:py-12`}>
              <RouteResultsView trip={planner.plannedRoute} />
            </div>
          </>
        ) : (
          <>
            <RouteHero
              vehicleCount={vehicles.length}
              stationCount={stations.length}
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
                  vehicles={vehicles}
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
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-white/[0.92] backdrop-blur-md"
          >
            <RouteIcon size={48} className="animate-pulse text-plug-blue-600" aria-hidden="true" />

            <span className="h-1 w-[200px] overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full origin-left animate-grow-x rounded-full bg-gradient-accent [animation-duration:2s]" />
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
 * being a state rather than an action. Exported as a class string too, so the
 * sign-in link wears the same shape as the buttons beside it.
 */
const HEADER_ACTION = cn(
  'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-ui-sm font-semibold transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950',
  'border-white/15 bg-white/[0.06] text-white/75 hover:border-white/30 hover:text-white',
)

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
