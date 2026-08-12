// src/app/routes/page.tsx
'use client'

import { Car, ChevronLeft, MapPin, Route, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { RouteInputForm } from '@/components/route/RouteInputForm'
import { RouteResultsView } from '@/components/route/RouteResultsView'
import { SaveRouteModal } from '@/components/route/SaveRouteModal'
import { EyebrowBadge } from '@/components/ui'
import { useRoutePlanner } from '@/hooks/useRoutePlanner'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: 'Enter Your Route',
    description: 'Type your starting point and destination anywhere in Pakistan.',
  },
  {
    icon: Car,
    title: 'Select Your EV',
    description: 'Choose your vehicle and we calculate stops based on real range data.',
  },
  {
    icon: Zap,
    title: 'Optimised Charging Stops',
    description: 'We find the fastest chargers compatible with your EV along the way.',
  },
]

interface PopularRoute {
  from: string
  to: string
  distanceKm: string
}

const POPULAR_ROUTES: PopularRoute[] = [
  { from: 'Islamabad', to: 'Lahore', distanceKm: '385 km' },
  { from: 'Lahore', to: 'Karachi', distanceKm: '1,230 km' },
  { from: 'Karachi', to: 'Hyderabad', distanceKm: '162 km' },
  { from: 'Islamabad', to: 'Peshawar', distanceKm: '175 km' },
  { from: 'Lahore', to: 'Faisalabad', distanceKm: '127 km' },
  { from: 'Islamabad', to: 'Murree', distanceKm: '65 km' },
]

export default function RoutesPage() {
  const planner = useRoutePlanner()
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false)
  const formRef = React.useRef<HTMLDivElement>(null)

  const applyPopularRoute = (route: PopularRoute) => {
    planner.setOrigin(route.from)
    planner.setDestination(route.to)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const showResults = planner.hasCalculated && planner.plannedRoute !== null

  return (
    <div className="min-h-below-nav bg-slate-50">
      {showResults && planner.plannedRoute ? (
        <>
          <div className="bg-gradient-hero py-12">
            <div className="container-plug">
              <button
                type="button"
                onClick={planner.resetRoute}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Plan another route
              </button>
              <h1 className="text-3xl font-black text-white">
                {planner.plannedRoute.origin} to {planner.plannedRoute.destination}
              </h1>
            </div>
          </div>

          <div className="bg-white">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <RouteResultsView
                route={planner.plannedRoute}
                onReset={planner.resetRoute}
                onSave={() => setIsSaveModalOpen(true)}
                isSaved={planner.isSaved}
              />
            </div>
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
          <section className="relative overflow-hidden bg-gradient-hero py-20 text-center lg:py-28">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/[0.18] blur-[110px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/[0.12] blur-[100px]"
            />

            <div className="container-plug relative z-10">
              <EyebrowBadge
                color="cyan"
                className="border-white/20 bg-white/10 text-white/80"
              >
                EV Route Planner
              </EyebrowBadge>

              <h1 className="mb-4 mt-6 text-4xl font-black text-white lg:text-display-lg">
                Plan Your Journey
                <br />
                Across{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Pakistan
                </span>
              </h1>

              <p className="mx-auto max-w-lg text-lg text-white/60">
                Enter your route and we will find the best charging stops for your EV.
              </p>
            </div>
          </section>

          <div ref={formRef} className="relative z-10 -mt-12 px-4 lg:px-0">
            <div className="mx-auto max-w-3xl">
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
                <p className="mt-4 text-center text-sm text-red-600">{planner.error}</p>
              ) : null}
            </div>
          </div>

          <section className="py-20">
            <div className="mx-auto max-w-5xl px-4">
              <h2 className="mb-16 text-center text-3xl font-bold text-slate-900">
                How Route Planning Works
              </h2>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="group flex flex-col items-center p-8 text-center"
                    >
                      <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-blue">
                        <Icon
                          size={32}
                          strokeWidth={1.5}
                          className="text-plug-blue-600"
                          aria-hidden="true"
                        />
                      </span>
                      <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-slate-500">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="px-4 pb-20">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 text-2xl font-bold text-slate-900">Popular Routes</h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {POPULAR_ROUTES.map((route) => (
                  <button
                    key={`${route.from}-${route.to}`}
                    type="button"
                    onClick={() => applyPopularRoute(route)}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-150 hover:border-blue-200 hover:shadow-card"
                  >
                    <span className="shrink-0 rounded-xl bg-blue-50 p-3">
                      <Route size={24} className="text-plug-blue-600" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900">
                        {route.from} &rarr; {route.to}
                      </span>
                      <span className="block font-mono text-sm text-slate-500">
                        {route.distanceKm}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {planner.isCalculating ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/[0.92] backdrop-blur-md">
          <Route size={48} className="animate-pulse text-plug-blue-600" aria-hidden="true" />

          <span className="h-1 w-[200px] overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full origin-left animate-grow-x rounded-full bg-gradient-brand [animation-duration:2s]" />
          </span>

          <span className="text-center">
            <span className="block text-lg font-semibold text-slate-900">
              Calculating your route...
            </span>
            <span className="mt-1 block text-sm text-slate-400">
              Finding the best charging stops for your EV
            </span>
          </span>
        </div>
      ) : null}
    </div>
  )
}
