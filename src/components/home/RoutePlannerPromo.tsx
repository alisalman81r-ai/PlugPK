// src/components/home/RoutePlannerPromo.tsx
'use client'

import { ArrowRight, BatteryCharging, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface RouteStop {
  name: string
  minutes: number
  from: number
  to: number
}

/**
 * One worked example, kept internally consistent: the two stops below add up
 * to the 45 minutes quoted in the summary, and the battery figures run in
 * sequence. A promo that contradicts itself is worse than no promo.
 */
const STOPS: RouteStop[] = [
  { name: 'Bhera Service Area', minutes: 22, from: 34, to: 78 },
  { name: 'Kharian Charging Point', minutes: 23, from: 41, to: 80 },
]

const SUMMARY = [
  { icon: Clock, value: '4h 20m', label: 'Drive time' },
  { icon: Zap, value: '2', label: 'Charging stops' },
  { icon: BatteryCharging, value: '45m', label: 'Charging' },
]

/** Degrees of tilt at the far edge of the card. */
const MAX_TILT = 7

export function RoutePlannerPromo() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  /**
   * The card sits on a perspective stage and rotates toward the pointer, with
   * its contents raised on their own Z planes — so the header and the stop
   * markers stand off the surface rather than the whole panel sliding.
   *
   * Same guards as the hero, and for the same reasons: mouse only, nothing
   * attached for coarse pointers or reduced-motion, and the frame throttled
   * through requestAnimationFrame.
   */
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return

    let raf = 0

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        // Inverted on X so the card leans toward the cursor, not away.
        setTilt({ x: -y * 2 * MAX_TILT, y: x * 2 * MAX_TILT })
      })
    }

    const onLeave = () => {
      cancelAnimationFrame(raf)
      setTilt({ x: 0, y: 0 })
    }

    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-28">
      {/* One background idea, not three. The previous version stacked two
          blur glows and a dot grid behind a panel that already had its own
          shadow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.16),transparent_70%)]"
      />

      <div className="container-plug relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          {/* ── Copy ─────────────────────────────────────────────── */}
          <div className="order-2 lg:order-1">
            <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
              Plan a long drive
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                around your range
              </span>
            </h2>

            <p className="mt-5 max-w-md text-pretty leading-relaxed text-white/60">
              Pick a start and a destination. We place the charging stops where your car
              actually needs them, using its real range rather than the brochure figure.
            </p>

            <Link
              href="/routes"
              className="group/cta mt-9 inline-flex h-13 items-center gap-2.5 rounded-xl bg-white px-7 text-ui font-semibold text-slate-950 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
            >
              Plan a route
              <ArrowRight
                size={17}
                className="shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* ── The route card, on a 3D stage ────────────────────── */}
          <div
            ref={stageRef}
            className="order-1 [perspective:1400px] lg:order-2"
          >
            <div
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
              className={cn(
                'rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-e4 backdrop-blur-sm sm:p-7',
                '[transform-style:preserve-3d] transition-transform duration-[350ms] ease-out',
                'motion-reduce:!transform-none motion-reduce:transition-none',
              )}
            >
              {/* Raised layers. translateZ is what separates this from a
                  flat card that merely rotates. */}
              <div
                style={{ transform: 'translateZ(40px)' }}
                className="mb-6 flex items-baseline justify-between gap-4"
              >
                <p className="text-lg font-bold text-white">Islamabad → Lahore</p>
                <p className="shrink-0 font-mono text-ui-sm font-semibold text-cyan-300">385 km</p>
              </div>

              <ol style={{ transform: 'translateZ(24px)' }} className="flex flex-col">
                <li className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"
                  />
                  <span className="text-ui font-semibold text-white">Islamabad</span>
                  <span className="ml-auto font-mono text-ui-sm text-emerald-300">80%</span>
                </li>

                {STOPS.map((stop) => (
                  <li key={stop.name}>
                    <span
                      aria-hidden="true"
                      className="ml-[6px] block h-10 border-l-2 border-dashed border-white/15"
                    />
                    <div className="flex items-center gap-3.5">
                      <span
                        aria-hidden="true"
                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-plug-blue-500 ring-4 ring-plug-blue-500/20"
                      >
                        <Zap size={8} className="fill-white text-white" />
                      </span>
                      <span className="min-w-0 truncate text-ui-sm text-white/80">{stop.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-ui-xs text-white/50">
                        {stop.minutes}m · {stop.from}→{stop.to}%
                      </span>
                    </div>
                  </li>
                ))}

                <li>
                  <span
                    aria-hidden="true"
                    className="ml-[6px] block h-10 border-l-2 border-dashed border-white/15"
                  />
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 rounded-full bg-white ring-4 ring-white/20"
                    />
                    <span className="text-ui font-semibold text-white">Lahore</span>
                    <span className="ml-auto font-mono text-ui-sm text-amber-300">45%</span>
                  </div>
                </li>
              </ol>

              <dl
                style={{ transform: 'translateZ(30px)' }}
                className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5"
              >
                {SUMMARY.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label}>
                      <Icon size={15} className="mb-2 text-cyan-300" aria-hidden="true" />
                      <dd className="font-mono text-lg font-bold leading-none text-white">
                        {item.value}
                      </dd>
                      <dt className="mt-1.5 text-ui-xs text-white/45">{item.label}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
