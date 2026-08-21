// src/components/home/FreeBanner.tsx
'use client'

import { ArrowRight, Check, CreditCard, Percent, Repeat, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { AnimatedIcon, HoverLink, HoverMotion, type IconMotion } from '@/components/ui'
import { cn } from '@/lib/utils'

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
 *
 * Structure now matches the ecosystem band and the four steps: a centred
 * eyebrow, one heading at the same clamp as its siblings, a lead paragraph,
 * then the cards. Before this the section had no h2 at all — the word "Free"
 * was a paragraph, so the page jumped from the services heading straight to
 * the community one and the band read as a loose aside rather than a section.
 *
 * Colour follows its siblings now rather than staying in ink: a blue eyebrow,
 * one word of the heading in blue, and the shared card frame — whose edge
 * grades from grey to brand on hover, warming the icon holder and cap rule
 * with it. Those come from components/shared/frame, so this band, the
 * ecosystem grid and Partner Up are tuned in one place.
 *
 * Nothing is filled. The blue is only ever an edge, a glyph or a single word;
 * every card face stays white on white.
 */

interface Fact {
  icon: LucideIcon
  /** Matched to the glyph: the renewal arrow turns, the card hops, % lands. */
  motion: IconMotion
  label: string
  detail: string
}

/**
 * The three "no charge" pills, promoted to cards.
 *
 * As pills they were three words with nothing behind them, which invites the
 * question they were meant to answer. Each now says what it actually means,
 * and each line is checkable against the product rather than being a slogan.
 */
const NOT_CHARGED: Fact[] = [
  {
    icon: Repeat,
    motion: 'spin',
    label: 'No subscription',
    detail: 'Nothing to start, nothing to renew, no tier held back for later.',
  },
  {
    icon: Percent,
    motion: 'pop',
    label: 'No commission',
    detail: 'You pay the operator directly. We take no cut of that.',
  },
  {
    icon: CreditCard,
    motion: 'lift',
    label: 'No card details',
    detail: 'There is no payment field anywhere on Plug.pk to fill in.',
  },
]

const INCLUDED = [
  'Search every station, see live availability',
  'See connector types and peak power at a glance',
  'Plan intercity routes around your car’s range',
  'Read and write reviews from other drivers',
]

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
     * No fill. The section is plain white and gets its presence from scale,
     * structure and the space around it — never from painting the surface.
     * The top rule separates it from the services band above, which is also
     * white; the community band below is slate-50 and separates itself.
     */
    <section className="border-t border-slate-200 bg-white py-24 lg:py-32">
      <div ref={stageRef} className="container-plug [perspective:1400px]">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          {/* The ecosystem band's eyebrow, exactly: blue, 13px, bold, wide. */}
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Costs you nothing
          </span>

          {/*
            Black with one word in blue and the full stop back in black — the
            ecosystem and steps headings' shape. Kept one step up the scale
            from them (6rem against 4rem) because this section carries no
            imagery or colour block, so the heading is the whole device.
          */}
          <h2 className="mt-5 text-balance text-[clamp(3.25rem,8vw,6rem)] font-black leading-[0.95] tracking-[-0.04em] text-slate-900">
            <span className="text-plug-blue-600">Free</span> to use.
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-pretty text-lg leading-relaxed text-slate-600">
            Plug.pk does not charge drivers. You pay the station operator directly for
            the electricity you use, at whatever rate they set.
          </p>
        </div>

        {/* ── What "free" rules out ────────────────────────────── */}
        <div
          style={{ transform: `translate3d(0, ${tilt.y * -6}px, 0)` }}
          className="mt-16 grid gap-5 transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none sm:grid-cols-3 lg:gap-6"
        >
          {NOT_CHARGED.map((fact) => {
            const Icon = fact.icon

            return (
              <HoverMotion key={fact.label} className={FRAME}>
                <div className={cn(FACE, 'p-8')}>
                  <span aria-hidden="true" className={ICON_FRAME}>
                    <AnimatedIcon motion={fact.motion}>
                      <Icon size={24} strokeWidth={1.75} className={ICON_GLYPH} />
                    </AnimatedIcon>
                  </span>

                  <span aria-hidden="true" className={cn('mt-7', CAP_RULE)} />

                  {/* A step above the ecosystem cards' text-xl, and heavier.
                      These three lines are the section's actual argument, so
                      they should read before the sentence under them does. */}
                  <h3 className="mt-5 text-[1.375rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-slate-900">
                    {fact.label}
                  </h3>

                  <p className="mt-3 text-ui leading-relaxed text-slate-500">
                    {fact.detail}
                  </p>
                </div>
              </HoverMotion>
            )
          })}
        </div>

        {/* ── What it includes ─────────────────────────────────── */}
        <div
          style={{ transform: `translate3d(0, ${tilt.y * 8}px, 0)` }}
          className="mx-auto mt-6 max-w-5xl transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:mt-8"
        >
          {/* The tilt lives on the wrapper above, not here: FRAME already
              carries `transition-all`, and a second transition declaration on
              the same element would only fight it over source order. */}
          <div className={FRAME}>
            <div
              className={cn(
                FACE,
                'gap-10 p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:p-10',
              )}
            >
              <div className="lg:flex-1">
                {/* Was slate-400 at 11px — the combination that made the old
                    version look like it had no headings at all. Brand blue
                    now, the same eyebrow as the section's own. */}
                <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
                  Everything included
                </p>

                {/* Two columns of two on the wide layout, so the list reads as
                    a block beside the buttons rather than a tall ladder above
                    them. */}
                <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-300 transition-colors duration-300 group-hover:border-plug-blue-400"
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          className="text-slate-500 transition-colors duration-300 group-hover:text-plug-blue-600"
                        />
                      </span>
                      <span className="text-ui leading-relaxed text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 lg:w-[19rem]">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <HoverLink
                    href="/map"
                    className="group/cta inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-ui font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_12px_26px_-10px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    Find a charger
                    <AnimatedIcon motion="travel">
                      <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
                    </AnimatedIcon>
                  </HoverLink>

                  <Link
                    href="/signup"
                    className="inline-flex h-13 flex-1 items-center justify-center rounded-xl border-[1.5px] border-slate-300 px-6 text-ui font-semibold text-slate-800 transition-colors duration-200 hover:border-plug-blue-400 hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
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
        </div>
      </div>
    </section>
  )
}
