// src/components/home/FreeBanner.tsx
'use client'

import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * States plainly that the platform costs nothing to use.
 *
 * Every claim below describes something the product genuinely does today.
 * There is no subscription, no paywall and no card field anywhere in the
 * codebase, so "free" here is a fact rather than an introductory offer with
 * conditions attached.
 *
 * It deliberately says nothing about the price of electricity: that is set
 * by each station operator and shown per-connector on the map. Conflating
 * the two would be the kind of claim that costs trust the first time
 * somebody plugs in and gets a bill.
 */
const INCLUDED = [
  'Search every station, see live availability',
  'Compare real per-unit prices before you drive',
  'Plan intercity routes around your car’s range',
  'Read and write reviews from other drivers',
]

const NOT_CHARGED = ['No subscription', 'No commission', 'No card details']

export function FreeBanner() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  /** Same motion language as the hero and the route planner. */
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
        setTilt({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        })
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
    // Dark, between a grey section and a white one. The previous version was
    // a slate-50 card on white immediately after a slate-50 section — three
    // near-identical tones in a row, which is why it disappeared.
    <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(16,185,129,0.16),transparent_70%)]"
      />

      <div ref={stageRef} className="container-plug relative z-10 [perspective:1400px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* ── The price, as the headline ──────────────────────── */}
          <div
            style={{
              transform: `translate3d(${tilt.x * -10}px, ${tilt.y * -10}px, 0)`,
            }}
            className="transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-ui-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              <Check size={13} className="shrink-0" aria-hidden="true" />
              Costs you nothing
            </span>

            {/* The number is the message. Everything else on this section
                explains it. */}
            <p className="flex items-baseline gap-3 font-black leading-[0.85] tracking-[-0.04em] text-white">
              <span className="text-[clamp(4rem,13vw,9rem)]">Free</span>
              <span className="text-[clamp(1rem,2.2vw,1.5rem)] font-bold text-white/40">
                to use
              </span>
            </p>

            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/65">
              Plug.pk does not charge drivers. You only ever pay the station operator for
              the electricity you actually use.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {NOT_CHARGED.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-ui-sm font-medium text-white/75"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── What that includes ─────────────────────────────── */}
          <div
            style={{
              transform: `translate3d(${tilt.x * 14}px, ${tilt.y * 14}px, 0)`,
            }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-e4 backdrop-blur-sm transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:p-8"
          >
            <p className="mb-6 text-ui-sm font-semibold uppercase tracking-[0.14em] text-white/45">
              Everything included
            </p>

            <ul className="flex flex-col gap-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30"
                  >
                    <Check size={12} className="text-emerald-300" />
                  </span>
                  <span className="text-ui leading-relaxed text-white/80">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/map"
                className="group/cta inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 text-ui font-semibold text-slate-950 transition-colors duration-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
              >
                Find a charger
                <ArrowRight
                  size={16}
                  className="shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-ui font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
              >
                Create an account
              </Link>
            </div>

            <p className="mt-4 text-ui-xs leading-relaxed text-white/40">
              An account is optional — it lets you save stations and post reviews.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
