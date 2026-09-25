// src/components/home/RoutePlannerPromo.tsx
'use client'

import { BatteryCharging, Clock, Zap } from 'lucide-react'
import * as React from 'react'

import { PillButton } from '@/components/ui'
import type { HeroMapPin } from '@/lib/charging'
import { cn } from '@/lib/utils'
import { RouteMapBackdrop } from './RouteMapBackdrop'

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

export interface RoutePlannerPromoProps {
  /** The live network, drawn on the backdrop map. */
  pins?: readonly HeroMapPin[]
}

export function RoutePlannerPromo({ pins = [] }: RoutePlannerPromoProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const sectionRef = React.useRef<HTMLElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  /*
    The map's roads light when the pointer is over the band (pure CSS, on the
    group). A touch screen has no hover, so there the band lights itself once
    most of it is on screen, and stays lit.
  */
  const [lit, setLit] = React.useState(false)
  React.useEffect(() => {
    const node = sectionRef.current
    if (!node || window.matchMedia('(hover: hover)').matches) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLit(true)
          io.disconnect()
        }
      },
      { threshold: 0.45 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

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
    <section
      ref={sectionRef}
      data-lit={lit ? 'true' : undefined}
      className="group/route relative overflow-hidden bg-plug-navy-950 py-20 lg:py-28"
    >
      {/* A night map of the country behind the band: the cities and the roads
          between them, which light up across the country when the pointer
          comes onto the band. The scrim keeps the copy on the quiet side. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <RouteMapBackdrop
          pins={pins}
          className="absolute left-1/2 top-1/2 h-[125%] w-auto max-w-none -translate-x-[40%] -translate-y-1/2 lg:left-[38%] lg:h-[118%] lg:-translate-x-1/2"
        />
        {/* The scrims keep the lit roads off the words: from the left on a
            wide screen, where the copy is the left column, and from the
            bottom on a narrow one, where it sits under the card. */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(5,36,30,0.96)_0%,rgba(5,36,30,0.88)_36%,rgba(5,36,30,0.45)_45%,transparent_54%)] lg:block" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_40%,rgba(5,36,30,0.9)_56%,rgba(5,36,30,0.97)_100%)] lg:hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_50%,rgba(38,205,178,0.08),transparent_70%)]" />
      </div>

      <div className="container-plug relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          {/* ── Copy ─────────────────────────────────────────────── */}
          <div className="order-2 lg:order-1">
            <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
              Plan a long drive
              <br />
              <span className="bg-gradient-to-r from-plug-blue-400 to-plug-cyan-300 bg-clip-text text-transparent">
                around your range
              </span>
            </h2>

            <p className="mt-5 max-w-md text-pretty leading-relaxed text-white/60">
              Pick a start and a destination. We place the charging stops where your car
              actually needs them, using its real range rather than the brochure figure.
            </p>

            {/* This section is dark, so the pill inverts — see PillButton for
                how the two stacked arrows travel through the badge. */}
            <PillButton href="/routes" tone="light" className="mt-9">
              Plan a route
            </PillButton>
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
                <p className="shrink-0 font-mono text-ui-sm font-semibold text-plug-cyan-300">385 km</p>
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
                      <Icon size={15} className="mb-2 text-plug-cyan-300" aria-hidden="true" />
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
