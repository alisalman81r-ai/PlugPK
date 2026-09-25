// src/components/home/ValueBanner.tsx
'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { MapPin, Route, Users, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion, PillButton, type IconMotion } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * What Plug.pk does for a driver, in three cards.
 *
 * ── What this replaced ────────────────────────────────────────────────
 *
 * A pricing band. It led with a 6rem "PKR 4,999 a month" and three cards
 * arguing about subscriptions, commission and cancellation — a page's most
 * prominent moment spent on billing, to a reader who has not yet been told
 * what the product is. The price is still published where somebody goes
 * looking for it, on Partner Up; it does not belong in the middle of the
 * homepage.
 *
 * Nothing here makes a claim about cost. The three cards each name something
 * the product genuinely does and links to it from elsewhere on the page —
 * the map, the route planner, the community — so every line is checkable
 * rather than a slogan.
 *
 * ── Why the heading came down a step ──────────────────────────────────
 *
 * It sat at clamp(3.25rem, 8vw, 6rem), one step above its siblings, because
 * "Free to use." was three words and the heading was the section's whole
 * device. "Everything you need to go electric." is a sentence, and at 6rem it
 * wrapped to three lines and shouted over the four steps and the ecosystem
 * band either side of it. It now shares their clamp(2.5rem, 5.5vw, 4rem), so
 * the three sections read as peers.
 *
 * ── Structure ─────────────────────────────────────────────────────────
 *
 * Centred eyebrow, one heading, a lead paragraph, three cards, one button —
 * the same shape as the ecosystem band and the four steps.
 *
 * Colour follows its siblings: a blue eyebrow, one word of the heading in
 * blue, and the shared card frame, whose edge grades from grey to brand on
 * hover and warms the icon holder and cap rule with it. Those come from
 * components/shared/frame, so this band, the ecosystem grid and Partner Up
 * are tuned in one place.
 *
 * Nothing is filled. The blue is only ever an edge, a glyph or a single word;
 * every card face stays white on white.
 *
 * ── The entrance ──────────────────────────────────────────────────────
 *
 * The three cards start as one: the middle card in the centre, the other two
 * tucked behind it, smaller and tilted, peeking out either side. When most of
 * the row is on screen the stack splits — the first card slides out to the
 * left, the last to the right — on a spring, and settles into the grid.
 *
 * The distance each side card travels is measured from the layout, not
 * assumed, so the stack is centred at any width. Where the cards stack in one
 * column (a phone) there is nothing to split, and each simply fades up. Under
 * reduced motion they are in place from the start. Once only.
 */

/** How far the tucked cards peek out from behind the middle one, in px. */
const PEEK = 30

function useSplitOffsets(grid: React.RefObject<HTMLDivElement | null>) {
  // Distance from each card's place in the grid to the middle card's, or
  // null when the cards are not side by side.
  const [offsets, setOffsets] = React.useState<number[] | null>(null)
  React.useEffect(() => {
    const node = grid.current
    if (!node) return
    const measure = () => {
      const items = Array.from(node.children) as HTMLElement[]
      const middle = items[1]
      if (!middle || items.some((el) => el.offsetTop !== middle.offsetTop)) return setOffsets(null)
      setOffsets(items.map((el) => middle.offsetLeft - el.offsetLeft))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [grid])
  return offsets
}

interface Feature {
  icon: LucideIcon
  /** Matched to the glyph: a pin drops, a route travels, a group rises. */
  motion: IconMotion
  label: string
  detail: string
}

/**
 * One card per thing the product does, in the order a driver meets them:
 * find a charger, plan a trip around them, then talk to the people who
 * already do both.
 *
 * Motion is chosen by what the glyph depicts rather than by what looks
 * busiest — the pin drops, the route travels, the group rises.
 */
const FEATURES: Feature[] = [
  {
    icon: MapPin,
    motion: 'pop',
    label: 'Find nearby chargers',
    detail: 'Discover charging points across Pakistan.',
  },
  {
    icon: Route,
    motion: 'travel',
    label: 'Plan your journey',
    detail: 'Know where to charge before you hit the road.',
  },
  {
    icon: Users,
    motion: 'lift',
    label: 'Join the community',
    detail: 'Share experiences, reviews, and useful EV tips.',
  },
]

export function ValueBanner() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const offsets = useSplitOffsets(gridRef)
  const split = useInView(gridRef, { once: true, amount: 0.55 })
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
     * No fill beyond the light ground. The section gets its presence from
     * scale, structure and the space around it, never from painting the
     * surface. slate-50 separates it from the white services band above.
     */
    <section className="bg-slate-50 py-24 lg:py-32">
      <div ref={stageRef} className="container-plug [perspective:1400px]">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          {/* The ecosystem band's eyebrow, exactly: blue, 13px, bold, wide. */}
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Charge with confidence
          </span>

          {/* Black with one word in blue and the full stop back in black —
              the ecosystem and steps headings' shape, at their scale. */}
          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.03em] text-slate-900">
            Everything you need to go <span className="text-plug-blue-600">electric</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-600">
            Find chargers, plan your route, and connect with the EV community — all in
            one place.
          </p>
        </div>

        {/* ── The three things the product does ────────────────── */}
        <div
          ref={gridRef}
          style={{ transform: `translate3d(0, ${tilt.y * -6}px, 0)` }}
          className="mt-16 grid gap-5 transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none sm:grid-cols-3 lg:gap-6"
        >
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon

            // Side by side: tucked behind the middle card until the split.
            // Stacked in a column: a plain fade-up.
            const side = i === 1 ? 0 : i === 0 ? -1 : 1
            const stacked = offsets
              ? { x: (offsets[i] ?? 0) + side * PEEK, scale: side ? 0.9 : 1, rotate: side * 4, opacity: 1, y: 0 }
              : { x: 0, scale: 1, rotate: 0, opacity: 0, y: 24 }
            const settled = { x: 0, scale: 1, rotate: 0, opacity: 1, y: 0 }

            return (
              <motion.div
                key={feature.label}
                className={cn('relative h-full', i === 1 ? 'z-10' : 'z-0')}
                initial={false}
                animate={reduce || split ? settled : stacked}
                transition={
                  !split
                    ? { duration: 0 }
                    : offsets
                      ? { type: 'spring', stiffness: 48, damping: 14, mass: 1, delay: side ? 0.2 : 0 }
                      : { duration: 0.5, ease: 'easeOut', delay: i * 0.12 }
                }
              >
                {/* The card's shape: square on three corners, one large curve at the
                    top right. Set here, over the shared frame's all-round radius,
                    so no other section changes. */}
                <HoverMotion className={cn(FRAME, 'h-full rounded-none rounded-tr-[4.5rem]')}>
                  <div className={cn(FACE, 'rounded-none rounded-tr-[calc(4.5rem-1.5px)] p-8')}>
                    <span aria-hidden="true" className={ICON_FRAME}>
                      <AnimatedIcon motion={feature.motion}>
                        <Icon size={24} strokeWidth={1.75} className={ICON_GLYPH} />
                      </AnimatedIcon>
                    </span>

                    <span aria-hidden="true" className={cn('mt-7', CAP_RULE)} />

                    {/* A step above the ecosystem cards' text-xl, and heavier.
                        These three lines are the section's actual argument, so
                        they should read before the sentence under them does. */}
                    <h3 className="mt-5 text-[1.375rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-slate-900">
                      {feature.label}
                    </h3>

                    <p className="mt-3 text-ui leading-relaxed text-slate-500">
                      {feature.detail}
                    </p>
                  </div>
                </HoverMotion>
              </motion.div>
            )
          })}
        </div>

        {/* ── The one action ───────────────────────────────────── */}
        <div
          style={{ transform: `translate3d(0, ${tilt.y * 8}px, 0)` }}
          className="mt-12 flex justify-center transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:mt-14"
        >
          {/* One button, and nothing beside it. Three cards pointing three
              ways already risk scattering the reader; a second competing ask
              beside them would finish the job. */}
          <PillButton href="/map">Explore Plug.pk</PillButton>
        </div>
      </div>
    </section>
  )
}
