// src/components/home/RoutePlannerPromo.tsx
import { BatteryCharging, CheckCircle2, Clock, Route, Zap } from 'lucide-react'

import { Button } from '@/components/ui'

interface RouteStopNode {
  name: string
  detail: string
}

const STOPS: RouteStopNode[] = [
  { name: 'Bhera Service Area', detail: '22 min · 34% → 78%' },
  { name: 'Kharian Charging Point', detail: '23 min · 41% → 80%' },
]

const FEATURES: string[] = [
  'Supports all EVs available in Pakistan',
  'Real charging station data on your route',
  'Save and share routes with anyone',
]

interface RouteStat {
  icon: typeof Clock
  value: string
  label: string
}

const ROUTE_STATS: RouteStat[] = [
  { icon: Clock, value: '4h 20min', label: 'Drive Time' },
  { icon: Zap, value: '2 Stops', label: 'Charging' },
  { icon: BatteryCharging, value: '45 min', label: 'Charge Time' },
]

export function RoutePlannerPromo() {
  return (
    <section className="section-padding relative overflow-hidden bg-dark-base">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.08] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="container-plug relative z-10">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* ── Left — route visual ─────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.40)]">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xl font-bold text-white">Islamabad &rarr; Lahore</span>
                <span className="font-mono font-semibold text-blue-400">385 km</span>
              </div>

              <div className="flex flex-col">
                {/* Start */}
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-full border-2 border-green-400 bg-green-500"
                  />
                  <span className="font-semibold text-white">Islamabad</span>
                  <span className="ml-auto font-mono text-sm text-green-400">Battery: 80%</span>
                </div>

                {STOPS.map((stop) => (
                  <div key={stop.name}>
                    <span
                      aria-hidden="true"
                      className="ml-[7px] block h-12 border-l-2 border-dashed border-white/20"
                    />
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-plug-blue-600"
                      >
                        <Zap size={10} className="text-white" />
                      </span>
                      <span className="text-sm font-medium text-white/80">{stop.name}</span>
                      <span className="ml-auto font-mono text-xs text-blue-400">{stop.detail}</span>
                    </div>
                  </div>
                ))}

                <span
                  aria-hidden="true"
                  className="ml-[7px] block h-12 border-l-2 border-dashed border-white/20"
                />

                {/* End */}
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-full border-2 border-red-400 bg-red-500"
                  />
                  <span className="font-semibold text-white">Lahore</span>
                  <span className="ml-auto font-mono text-sm text-amber-400">Arrive: 45% battery</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-6">
                {ROUTE_STATS.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <div key={stat.label}>
                      <Icon size={16} className="mb-2 text-blue-400" aria-hidden="true" />
                      <p className="font-mono font-bold text-white">{stat.value}</p>
                      <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right — copy ────────────────────────────────────── */}
          <div>
            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-medium uppercase tracking-widest text-blue-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              EV Route Planner
            </span>

            <h2 className="mb-6 text-4xl font-black tracking-tight text-white lg:text-display-lg">
              Plan Your Journey
              <br />
              Across{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Pakistan
              </span>
            </h2>

            <p className="mb-8 max-w-md text-lg leading-relaxed text-white/60">
              Enter your starting point and destination. Plug.pk calculates the optimal route with
              charging stops perfectly timed for your vehicle&apos;s range.
            </p>

            <ul className="mb-10 flex flex-col gap-4">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="shrink-0 text-cyan-400" aria-hidden="true" />
                  <span className="text-base text-white/80">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              href="/routes"
              size="lg"
              rightIcon={<Route size={18} />}
              className="h-14 rounded-xl bg-gradient-brand px-8 shadow-[0_12px_35px_rgba(37,99,235,0.35)] hover:brightness-110"
            >
              Start Planning Your Route
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
