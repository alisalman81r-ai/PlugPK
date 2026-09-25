// src/components/home/HowItWorks.tsx
'use client'

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Navigation2, Plug, Star, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

/**
 * How it works, as four slides: a statement on the left, the photograph that
 * shows it on the right, and a ← bar → control under the text.
 *
 * ── Each slide is one thought ─────────────────────────────────────────
 *
 * The big line says what the driver does in their own words — "Find a
 * charger near you" — so it is understood on first read. Under it, a label
 * places it in the sequence (Step 1 of 4 · Search) and one sentence says how.
 *
 * ── Each photograph shows that exact thing ────────────────────────────
 *
 *   Find         a row of chargers waiting — what the search turns up
 *   Filter       the plug itself, close up — the connector is what you filter on
 *   Navigate     a hand plugging in on arrival — the end of the drive
 *   Review       one clear, specific station — the thing you rate
 *
 * The chip on the card's edge is a line of the app reading the photograph,
 * with a hairline to the thing it names. Where a figure exists it is the
 * database's (locations mapped, the average rating and its review count),
 * passed in from the page; where it does not, the chip names the feature
 * rather than inventing a number.
 *
 * ── Motion ────────────────────────────────────────────────────────────
 *
 * Direction-aware: forward slides the new photograph in from the right and
 * lifts the new text up; back reverses both. The chip's hairline redraws once
 * the photograph has settled. Under prefers-reduced-motion everything swaps
 * without travel. The card also takes a horizontal swipe, and the arrow keys
 * work anywhere inside the section.
 */

interface Slide {
  label: string
  title: string
  body: string
  image: string
  /** object-position x, so the subject stays in the tall card. */
  focusX: string
  chip: { icon: LucideIcon; text: string }
  /** Where the hairline lands, as % of the card. */
  target: { x: number; y: number }
}

export interface HowItWorksProps {
  stats?: { locations: number; rating: number | null; reviews: number }
}

function buildSlides(stats: HowItWorksProps['stats']): Slide[] {
  const locations = stats?.locations ?? 0
  const rated = stats?.rating != null && stats.reviews > 0
  return [
    {
      label: 'Search',
      title: 'Find a charger near you.',
      body: 'Type a city or share your location, and every charger around you shows up on one map.',
      image: '/images/stations/dha-charging-hub-1.jpg',
      focusX: '72%',
      chip: {
        icon: MapPin,
        text: locations > 0 ? `${locations} ${locations === 1 ? 'location' : 'locations'} mapped` : 'Chargers on one map',
      },
      target: { x: 56, y: 42 },
    },
    {
      label: 'Filter',
      title: 'See only the chargers that fit your car.',
      body: 'Pick your connector and the charging speed you need. Everything else is filtered out.',
      image: '/images/community/m2-trip-2.jpg',
      focusX: '55%',
      chip: { icon: Plug, text: 'Type 2 connector' },
      target: { x: 62, y: 56 },
    },
    {
      label: 'Navigate',
      title: 'Drive there and plug in.',
      body: 'One tap opens directions, and you can check how many ports are free before you set off.',
      image: '/images/stations/mall-road-ev-hub-3.jpg',
      focusX: '62%',
      chip: { icon: Navigation2, text: 'Directions in one tap' },
      target: { x: 58, y: 55 },
    },
    {
      label: 'Review',
      title: 'Tell other drivers how it went.',
      body: 'Rate the charger and leave a quick review, so the next driver knows what to expect.',
      image: '/images/stations/f-10-charging-point-1.jpg',
      focusX: '50%',
      chip: {
        icon: Star,
        text: rated ? `${stats!.rating!.toFixed(1)} from ${stats!.reviews} ${stats!.reviews === 1 ? 'review' : 'reviews'}` : 'Rate every charger',
      },
      target: { x: 55, y: 40 },
    },
  ]
}

/**
 * Where the chip sits and its hairline starts, as % of the card. The line
 * starts under the chip, which is drawn over it, so it always appears to
 * leave from the chip's right edge whatever the chip's text makes its width.
 */
const CHIP = { x: 4, y: 72 }

/** The card's outline: square top, bottom edge falling to the right, all corners rounded. */
function CardClip({ id }: { id: string }) {
  // objectBoundingBox units on a 0.64 : 1 card, so a corner of rx in x is
  // rx × 0.64 in y to stay circular.
  const rx = 0.1
  const ry = rx * 0.64
  const drop = 0.13 // how much higher the bottom-left corner sits than the bottom-right
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={id} clipPathUnits="objectBoundingBox">
          <path
            d={[
              `M ${rx} 0`,
              `H ${1 - rx}`,
              `Q 1 0 1 ${ry}`,
              `V ${1 - ry}`,
              `Q 1 1 ${1 - rx} ${1 - ry * 0.35}`,
              `L ${rx} ${1 - drop + ry * 0.2}`,
              `Q 0 ${1 - drop + ry * 0.05} 0 ${1 - drop - ry}`,
              `V ${ry}`,
              `Q 0 0 ${rx} 0`,
              'Z',
            ].join(' ')}
          />
        </clipPath>
      </defs>
    </svg>
  )
}

const EASE = [0.22, 1, 0.36, 1] as const

export function HowItWorks({ stats }: HowItWorksProps) {
  const slides = React.useMemo(() => buildSlides(stats), [stats])
  const [[index, dir], setState] = React.useState<[number, 1 | -1]>([0, 1])
  const reduce = useReducedMotion()
  const clipId = React.useId().replace(/:/g, '')
  const n = slides.length
  const slide = slides[index]!
  const next = slides[(index + 1) % n]!

  const go = React.useCallback(
    (d: 1 | -1) => setState(([i]) => [(i + d + n) % n, d]),
    [n],
  )
  const goTo = (i: number) => setState(([cur]) => [i, i >= cur ? 1 : -1])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1)
  }

  const t = (s: number) => (reduce ? { duration: 0 } : { duration: s, ease: EASE })
  const Icon = slide.chip.icon

  return (
    <section
      className="relative overflow-hidden bg-[#0B221E] py-[clamp(5rem,12vh,8.5rem)]"
      aria-labelledby="how-heading"
      aria-roledescription="carousel"
      onKeyDown={onKey}
    >
      {/* A faint lift behind the card, so the photograph sits in light. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-[#1FB98C]/[0.07] blur-[120px]"
      />
      <CardClip id={clipId} />

      <div className="container-plug relative grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-[clamp(3rem,7vw,7rem)]">
        {/* ── The words ─────────────────────────────────────────────── */}
        <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:min-h-[36rem] lg:py-6">
          <h2
            id="how-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#46E3B5]"
          >
            Start finding chargers in seconds
          </h2>

          {/* A fixed-height stage, so the controls never jump as the copy changes length. */}
          <div className="relative mt-7 min-h-[17.5rem] sm:min-h-[16rem] lg:min-h-[20rem]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={index}
                custom={dir}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: dir * 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: dir * -12 }}
                transition={t(0.45)}
              >
                <h3 className="max-w-[34rem] text-balance text-[clamp(2.1rem,3.4vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-white">
                  {slide.title}
                </h3>
                <motion.p
                  className="mt-8 text-[15px] font-semibold text-white"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...t(0.4), delay: reduce ? 0 : 0.12 }}
                >
                  Step {index + 1} of {n} <span className="px-1.5 text-white/40">·</span> {slide.label}
                </motion.p>
                <motion.p
                  className="mt-2 max-w-[30rem] text-[16px] leading-[1.6] text-slate-300"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...t(0.4), delay: reduce ? 0 : 0.18 }}
                >
                  {slide.body}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── ← bar → ────────────────────────────────────────────── */}
          <div className="mt-10 flex items-center gap-6 lg:mt-auto">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous step"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-200 hover:border-[#46E3B5] hover:text-[#46E3B5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#46E3B5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B221E]"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </button>

            {/* One segment per step; the fill runs to the current one. Each
                quarter is a button, so the bar is also a way to jump. */}
            <div className="relative flex h-6 w-[min(22rem,48vw)] items-center" role="group" aria-label="Choose a step">
              <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/80" />
              <motion.div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#2FA88A]"
                initial={false}
                animate={{ width: `${((index + 1) / n) * 100}%` }}
                transition={t(0.55)}
              />
              {slides.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                  aria-current={i === index ? 'step' : undefined}
                  className="relative z-10 h-full flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#46E3B5]"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next step"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-200 hover:border-[#46E3B5] hover:text-[#46E3B5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#46E3B5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B221E]"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── The photograph ─────────────────────────────────────────── */}
        <div className="relative order-1 mx-auto w-[min(20rem,78vw)] sm:w-[22rem] lg:order-2 lg:mr-[clamp(4rem,7vw,7.5rem)] lg:w-[clamp(22rem,27vw,27rem)]">
          {/* The next step, peeking in from the right and dimmed. */}
          <div
            aria-hidden="true"
            className="absolute left-[calc(100%+2.25rem)] top-[11%] hidden h-[74%] w-[6.5rem] overflow-hidden rounded-[1.75rem] sm:block"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={next.image}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t(0.5)}
              >
                <Image src={next.image} alt="" fill sizes="104px" className="object-cover" style={{ objectPosition: `${next.focusX} center` }} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-[#0B221E]/60" />
          </div>

          <motion.div
            className="relative aspect-[0.64] w-full cursor-grab touch-pan-y active:cursor-grabbing"
            style={{ clipPath: `url(#${clipId})` }}
            drag={reduce ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={onDragEnd}
          >
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={slide.image}
                className="absolute inset-0"
                custom={dir}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: `${dir * 14}%`, scale: 1.06 }}
                animate={{ opacity: 1, x: '0%', scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: `${dir * -10}%`, scale: 0.98 }}
                transition={t(0.7)}
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 22rem, 27rem"
                  quality={88}
                  className="pointer-events-none select-none object-cover"
                  style={{ objectPosition: `${slide.focusX} center` }}
                  priority={index === 0}
                />
              </motion.div>
            </AnimatePresence>
            {/* A soft vignette at the foot, so the chip always reads. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </motion.div>

          {/* The hairline from the chip to what it names. The viewBox is the card's
              own 0.64 : 1 shape (64 × 100), so it scales uniformly: nothing is
              stretched, and the draw-in animation's dash lengths stay true. */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 64 100"
            preserveAspectRatio="none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.path
                key={index}
                d={`M ${CHIP.x * 0.64} ${CHIP.y} L ${slide.target.x * 0.64} ${slide.target.y}`}
                fill="none"
                stroke="#6FE8B6"
                strokeWidth={0.5}
                strokeLinecap="round"
                initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 0.45, ease: EASE }}
              />
            </AnimatePresence>
          </svg>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={index}
              aria-hidden="true"
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6FE8B6] shadow-[0_0_0_4px_rgba(111,232,182,0.25)]"
              style={{ left: `${slide.target.x}%`, top: `${slide.target.y}%` }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.85 }}
            />
          </AnimatePresence>

          {/* The chip, over the card's left edge. */}
          <div
            className="absolute -left-[clamp(1rem,3.5vw,3.5rem)] -translate-y-1/2"
            style={{ top: `${CHIP.y}%` }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/20 bg-[#132F2A]/75 py-3 pl-4 pr-5 text-[14px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -6, transition: { duration: 0.18 } }}
                transition={{ ...t(0.4), delay: reduce ? 0 : 0.3 }}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0 text-[#6FE8B6]" aria-hidden="true" />
                {slide.chip.text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
