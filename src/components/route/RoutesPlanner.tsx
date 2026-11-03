// src/components/route/RoutesPlanner.tsx
'use client'

import { Bookmark, BookmarkCheck, Check, ChevronLeft, Route as RouteIcon, Share2 } from '@/components/ui/icons'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'

import { PopularRoutes } from '@/components/route/PopularRoutes'
import { RouteHero } from '@/components/route/RouteHero'
import { RouteHowItWorks } from '@/components/route/RouteHowItWorks'
import { RouteInputForm } from '@/components/route/RouteInputForm'
import { RouteResultsView } from '@/components/route/RouteResultsView'
import { Btn, Faq, Hl, PageHero, SectionHead, WRAP } from '@/components/v2/ui'
import { useMyCar } from '@/hooks/useMyCar'
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
  /** The link named a car, which the driver's own car must not override. */
  const linkChoseCar = React.useRef(false)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    linkChoseCar.current = q.has('car')
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

  /*
    The driver's own car, from their garage, once the link has been read:
    only when the link named no car and none is picked yet. No car in the
    garage, nothing is pre-selected.
  */
  const myCar = useMyCar()
  const appliedMyCar = React.useRef(false)
  const { selectedVehicle } = planner
  React.useEffect(() => {
    if (myCar === undefined || appliedMyCar.current) return
    appliedMyCar.current = true
    if (linkChoseCar.current || selectedVehicle || !myCar) return
    const mine = vehicles.find((v) => v.id === myCar.slug)
    if (mine) setSelectedVehicle(mine)
  }, [myCar, vehicles, selectedVehicle, setSelectedVehicle])

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
  const route = planner.plannedRoute

  /*
    Saving is an account feature. Signed out, the button used to vanish, so
    nobody knew it existed; now it is a link to sign in that brings the
    visitor back to this same plan (it lives in the query string).
  */
  const saveControl = viewer ? (
    <Btn
      onClick={() => void handleSave()}
      variant={planner.isSaved ? 'ink' : 'volt'}
      size="sm"
      aria-pressed={planner.isSaved}
      className={planner.isSaved ? 'bg-ink text-volt hover:bg-ink hover:text-volt' : undefined}
    >
      <MorphIcon active={planner.isSaved} on={BookmarkCheck} off={Bookmark} size={16} />
      {planner.isSaved ? 'Saved' : 'Save route'}
    </Btn>
  ) : viewer === null ? (
    <Btn href={`/login?redirect=${encodeURIComponent(returnTo)}`} variant="volt" size="sm">
      <Bookmark aria-hidden="true" />
      Sign in to save this route
    </Btn>
  ) : null

  return (
    <>
      {showResults && route ? (
        <>
          <PageHero
            eyebrow="Your route"
            title={
              <>
                {route.origin} <span className="text-white/35">→</span> <Hl dark>{route.destination}</Hl>
              </>
            }
            sub={
              <>
                In {withArticle(vehicleName(route.vehicle))}, leaving with{' '}
                <span className="font-mono text-white">{route.startPercent}%</span>
              </>
            }
            actions={
              <Btn onClick={planner.resetRoute} variant="ghostDark" size="sm">
                <ChevronLeft aria-hidden="true" />
                Plan another route
              </Btn>
            }
          />

          {/* The plan and its map, lifted into the hero like the sheet on
              the planning view. Not a <Lift>: that clips its overflow, which
              would stop the map sticking beside a long plan. */}
          <div data-theme="light" className="relative z-[3] -mt-[84px] sm:-mt-28">
            <div className={WRAP}>
              <RouteResultsView
                trip={route}
                stations={stations}
                actions={
                  <>
                    {saveControl}
                    <Btn onClick={handleShare} variant="ink" size="sm">
                      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
                      {copied ? 'Link copied' : 'Copy link to this plan'}
                    </Btn>
                  </>
                }
              />
              {saveError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-center text-sm font-medium text-[#B42E05]"
                >
                  {saveError}
                </p>
              ) : null}
            </div>
          </div>
          <div data-theme="light" className="h-[clamp(64px,7vw,104px)] bg-chalk" />
        </>
      ) : (
        <>
          <RouteHero vehicleCount={vehicles.length} stationCount={stations.length} cityCount={cityCount} />

          {/* ── Popular routes, lifted into the band ─────────────── */}
          <PopularRoutes
            onSelect={applyPopularRoute}
            origin={planner.origin}
            destination={planner.destination}
          />

          {/* ── The planner ──────────────────────────────────────── */}
          <section
            data-theme="light"
            aria-label="Plan your route"
            className="bg-chalk pb-[clamp(56px,6vw,88px)] pt-[clamp(64px,7vw,104px)]"
          >
            <div id="route-planner" ref={formRef} className={cn(WRAP, 'scroll-mt-24')}>
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
                  className="mx-auto mt-4 max-w-[880px] rounded-2xl border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-center text-sm font-medium text-[#B42E05]"
                >
                  {planner.error}
                </p>
              ) : null}
            </div>
          </section>

          {/* ── How it works ─────────────────────────────────────── */}
          <RouteHowItWorks />
        </>
      )}

      {planner.isCalculating ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-paper/[0.92] px-4 backdrop-blur-md"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-ink text-volt shadow-volt">
            <RouteIcon size={28} className="animate-pulse" aria-hidden="true" />
          </span>

          <span className="h-1.5 w-[200px] overflow-hidden rounded-full bg-stone">
            <span className="block h-full origin-left animate-grow-x rounded-full bg-volt [animation-duration:2s]" />
          </span>

          <span className="text-center">
            <span className="block font-display text-2xl text-ink">Calculating your route…</span>
            <span className="mt-1 block text-sm text-muted">Finding the best charging stops for your EV</span>
          </span>
        </div>
      ) : null}

      <section data-theme="light" aria-labelledby="routes-faq-heading" className="bg-paper py-[clamp(80px,9vw,128px)]">
        <div className={WRAP}>
          <SectionHead
            eyebrow="FAQ"
            title={
              <span id="routes-faq-heading">
                Common questions about <Hl>planning</Hl>
              </span>
            }
          />
          <Faq items={ROUTES_FAQS.map((item) => ({ q: item.question, a: item.answer }))} />
        </div>
      </section>
    </>
  )
}
