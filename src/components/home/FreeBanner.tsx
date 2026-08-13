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
 * It says nothing about the price of electricity, which the product no
 * longer publishes at all — rates are set by each operator and change often,
 * and a stale figure shown as fact is worse than none. Drivers confirm the
 * rate with the operator; businesses discuss terms through a meeting.
 */
const INCLUDED = [
  'Search every station, see live availability',
  'See connector types and peak power at a glance',
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
    /**
     * No fill. The section is plain white and gets its presence from scale
     * and structure instead: rules top and bottom to bound the band, one
     * word set far larger than anything else on the page, and enough space
     * around it that nothing crowds it.
     *
     * This is why the previous grey-card-on-white version vanished — it
     * tried to stand out by being a slightly different tone, which is the
     * one thing that does not work between two pale neighbours.
     */
    <section className="border-y border-slate-200 bg-white py-20 lg:py-28">
      <div ref={stageRef} className="container-plug [perspective:1400px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* ── The price, as the headline ──────────────────────── */}
          <div
            style={{ transform: `translate3d(${tilt.x * -8}px, ${tilt.y * -8}px, 0)` }}
            className="transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
          >
            <span className="mb-6 inline-flex items-center gap-2 text-ui-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span aria-hidden="true" className="h-px w-6 bg-slate-300" />
              Costs you nothing
            </span>

            {/* Scale is the whole device. One word, far larger than anything
                else on the page, doing the work a colour block was doing. */}
            <p className="flex items-baseline gap-3 font-black leading-[0.85] tracking-[-0.045em] text-slate-900">
              <span className="text-[clamp(4.5rem,14vw,10rem)]">Free</span>
              <span className="text-[clamp(1rem,2.2vw,1.5rem)] font-bold text-slate-400">
                to use
              </span>
            </p>

            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-slate-600">
              Plug.pk does not charge drivers. You pay the station operator directly for
              the electricity you use, at whatever rate they set.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {NOT_CHARGED.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-slate-200 px-3.5 py-1.5 text-ui-sm font-medium text-slate-600"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── What that includes ─────────────────────────────── */}
          <div
            style={{ transform: `translate3d(${tilt.x * 12}px, ${tilt.y * 12}px, 0)` }}
            className="rounded-3xl border border-slate-200 p-7 transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:p-8"
          >
            <p className="mb-6 text-ui-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Everything included
            </p>

            <ul className="flex flex-col gap-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300"
                  >
                    <Check size={12} className="text-slate-600" />
                  </span>
                  <span className="text-ui leading-relaxed text-slate-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/map"
                className="group/cta inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-ui font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
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
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-6 text-ui font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Create an account
              </Link>
            </div>

            <p className="mt-4 text-ui-xs leading-relaxed text-slate-500">
              An account is optional — it lets you save stations and post reviews.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
