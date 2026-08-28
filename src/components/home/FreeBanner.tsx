// src/components/home/FreeBanner.tsx
'use client'

import { CreditCard, Percent, Repeat, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion, PillButton, type IconMotion } from '@/components/ui'
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
 * Structure matches the ecosystem band and the four steps: a centred eyebrow,
 * one heading at the same clamp as its siblings, a lead paragraph, the three
 * cards, one button. Before this the section had no h2 at all — the word
 * "Free" was a paragraph, so the page jumped from the services heading
 * straight to the community one and the band read as a loose aside rather
 * than a section.
 *
 * The "everything included" card that sat below the three facts is gone. Its
 * four lines repeated what the four steps, the ecosystem grid and the route
 * promo each already demonstrate further up the page, and the second button
 * beside it gave a section about costing nothing two competing asks. One
 * claim, one action.
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
    <section className="bg-slate-50 py-24 lg:py-32">
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

        {/* ── The one action ───────────────────────────────────── */}
        <div
          style={{ transform: `translate3d(0, ${tilt.y * 8}px, 0)` }}
          className="mt-12 flex justify-center transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:mt-14"
        >
          {/*
            One button, and nothing beside it.

            The feature list that stood here repeated what the four steps, the
            ecosystem grid and the route promo each already show further up the
            page, and pairing it with a second "Create an account" button gave
            a section about costing nothing two competing asks. A band making
            one claim should offer one way to act on it.
          */}
          <PillButton href="/map">Find a charger</PillButton>
        </div>
      </div>
    </section>
  )
}
