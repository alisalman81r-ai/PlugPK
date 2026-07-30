// src/components/home/Hero.tsx
'use client'

import { ArrowRight, ChevronDown, MapPin } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface QuickStat {
  value: string
  label: string
}

const QUICK_STATS: QuickStat[] = [
  { value: '250+', label: 'Stations' },
  { value: '18', label: 'Cities' },
  { value: '5,000+', label: 'EV Owners' },
]

interface MockPin {
  /** Percentage offsets so pins stay put as the mock map resizes. */
  top: string
  left: string
}

const MAP_PINS: MockPin[] = [
  { top: '22%', left: '24%' },
  { top: '62%', left: '68%' },
  { top: '74%', left: '30%' },
]

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-hero">
      {/* Layer 1 — dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      {/* Layer 2 — top-right glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[100px] -top-[100px] z-0 h-[600px] w-[600px] rounded-full bg-blue-600/[0.18] blur-[120px]"
      />
      {/* Layer 3 — bottom-left glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[150px] -left-[100px] z-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.12] blur-[100px]"
      />
      {/* Layer 4 — bottom fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[200px] bg-gradient-to-b from-transparent to-slate-900/30"
      />

      <div className="container-plug relative z-10 w-full pb-24 pt-32 lg:pb-32 lg:pt-40">
        <div className="grid items-center gap-16 lg:grid-cols-[11fr_9fr]">
          {/* ── Left column ─────────────────────────────────────── */}
          <div>
            <span className="mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-widest text-cyan-300 opacity-0">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400"
              />
              Pakistan&apos;s EV Platform
            </span>

            <h1 className="mb-6 text-5xl font-black leading-[1.05] tracking-tight text-white lg:text-display-2xl">
              <span className="block animate-fade-up opacity-0">Everything</span>
              <span className="delay-100 block animate-fade-up opacity-0">Your EV</span>
              <span className="delay-200 block animate-fade-up bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent opacity-0">
                Needs.
              </span>
            </h1>

            <p className="delay-300 mb-10 max-w-lg animate-fade-up text-lg leading-relaxed text-white/70 opacity-0 lg:text-xl">
              Find charging stations, plan long-distance routes, and connect with Pakistan&apos;s
              growing EV community — all in one platform.
            </p>

            {/* delay-400 comes from globals.css (animation-delay). Tailwind's
                own delay-* utility sets transition-delay and would not stagger
                the fade-up animation. */}
            <div className="delay-400 mb-12 flex animate-fade-up flex-col gap-4 opacity-0 sm:flex-row">
              <Button
                href="/map"
                size="lg"
                rightIcon={<MapPin size={18} />}
                className="h-14 rounded-xl px-8 text-base hover:shadow-[0_12px_35px_rgba(37,99,235,0.40)]"
              >
                Find Charging Stations
              </Button>
              <Button
                href="/routes"
                variant="outline-white"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                className="h-14 rounded-xl border-[1.5px] border-white/20 bg-white/10 px-8 text-base hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.18]"
              >
                Plan a Route
              </Button>
            </div>

            <dl className="delay-500 flex animate-fade-up items-center gap-8 border-t border-white/10 pt-8 opacity-0">
              {QUICK_STATS.map((stat, index) => (
                <div key={stat.label} className="flex items-center gap-8">
                  {index > 0 ? <span aria-hidden="true" className="h-8 w-px bg-white/10" /> : null}
                  <div>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block text-2xl font-bold text-white">{stat.value}</span>
                      <span className="block text-xs uppercase tracking-wider text-white/50">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Right column — visual ───────────────────────────── */}
          <div className="delay-600 hidden animate-fade-up opacity-0 lg:block">
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
              <span className="absolute -top-3 right-6 z-20 animate-float rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(34,197,94,0.40)]">
                &#10003; Verified Station
              </span>

              {/* Mock map */}
              <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px]"
                />

                {/* Roads */}
                <div aria-hidden="true" className="absolute left-0 right-0 top-[30%] h-px bg-white/[0.07]" />
                <div aria-hidden="true" className="absolute left-0 right-0 top-[58%] h-0.5 bg-white/[0.05]" />
                <div aria-hidden="true" className="absolute bottom-0 left-[38%] top-0 w-px bg-white/[0.06]" />
                <div aria-hidden="true" className="absolute bottom-0 left-[72%] top-0 w-0.5 bg-white/[0.04]" />

                {MAP_PINS.map((pin) => (
                  <span
                    key={`${pin.top}-${pin.left}`}
                    aria-hidden="true"
                    className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600/20"
                    style={{ top: pin.top, left: pin.left }}
                  >
                    <span className="h-3 w-3 rounded-full bg-plug-blue-600" />
                  </span>
                ))}

                {/* Centre pin — available, pulsing */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-green-500/20"
                >
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-green-500" />
                  <span className="relative h-3.5 w-3.5 rounded-full bg-green-500" />
                </span>

                <span className="absolute left-[10%] top-[18%] font-mono text-[10px] text-white/30">
                  Islamabad
                </span>
                <span className="absolute left-[44%] top-[46%] font-mono text-[10px] text-white/30">
                  Lahore
                </span>
                <span className="absolute bottom-[12%] left-[18%] font-mono text-[10px] text-white/30">
                  Karachi
                </span>
              </div>

              {/* Station preview */}
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                <div>
                  <span className="flex items-center gap-2 text-sm font-medium text-green-400">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400"
                    />
                    Available Now
                  </span>
                  <p className="mt-1 font-semibold text-white">Mall Road EV Hub</p>
                  <p className="mt-0.5 text-xs text-white/50">Lahore, Punjab</p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                  &#9889; 150 kW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="#stats"
        aria-label="Scroll to explore"
        className={cn(
          'absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex',
          'transition-opacity duration-150 hover:opacity-80',
        )}
      >
        <span className="text-xs uppercase tracking-widest text-white/40">Scroll to explore</span>
        <ChevronDown size={16} className="animate-bounce text-white/40" aria-hidden="true" />
      </Link>
    </section>
  )
}
