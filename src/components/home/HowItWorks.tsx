// src/components/home/HowItWorks.tsx
'use client'

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CornerUpRight,
  MapPin,
  Navigation2,
  Plug,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import type { HeroMapPin, ShowcaseStation } from '@/lib/charging'

/**
 * How it works, as four slides: a statement on the left, the picture that
 * shows it on the right, and a ← bar → control under the text.
 *
 * ── Each slide is one thought ─────────────────────────────────────────
 *
 * The big line says what the driver does in their own words — "Find a
 * charger near you" — so it is understood on first read. Under it, a label
 * places it in the sequence (Step 1 of 4 · Search) and one sentence says how.
 *
 * ── Each picture shows that exact thing ───────────────────────────────
 *
 *   Find       a row of chargers waiting — what the search turns up
 *   Filter     the plug itself, close up — the connector is what you filter on
 *   Navigate   the app on a phone, giving turn-by-turn directions to a charger
 *   Review     the app on a phone, showing that charger's rating and reviews
 *
 * Steps 3 and 4 are the product itself, drawn as live screens rather than
 * photographs, and they follow one real station: the one drivers have
 * reviewed most (getShowcaseStation). Step 3 drives to it, with its real
 * power and free ports; step 4 shows its real average, its real star
 * breakdown and two of its verified reviews, word for word. The distance and
 * the turn are the illustration's — there is no trip in progress. If nothing
 * has been reviewed yet, both steps fall back to photographs.
 *
 * The chip on the card's edge reads the picture, with a hairline to the thing
 * it names.
 *
 * ── Light, on purpose ─────────────────────────────────────────────────
 *
 * The section after this one is dark. Two dark bands in a row read as one
 * heavy block, so this one sits on the page's light slate and the dark card
 * contents carry the contrast instead.
 *
 * ── Motion ────────────────────────────────────────────────────────────
 *
 * Direction-aware: forward slides the new picture in from the right and lifts
 * the new text up; back reverses both. The hairline redraws once the picture
 * has settled. Under prefers-reduced-motion everything swaps without travel.
 * The card takes a horizontal swipe, and the arrow keys work inside the
 * section.
 */

type Visual =
  | { kind: 'photo'; image: string; focusX: string }
  | { kind: 'directions'; station: ShowcaseStation; pin?: HeroMapPin }
  | { kind: 'reviews'; station: ShowcaseStation }

interface Slide {
  label: string
  title: string
  body: string
  visual: Visual
  chip: { icon: LucideIcon; text: string }
  /**
   * Where the hairline lands, as % of the card. None on the phone slides: the
   * screen explains itself, and a line across it only cut through the words.
   */
  target?: { x: number; y: number }
  /** The chip's height on the card, as %, where the default would cover the screen. */
  chipY?: number
}

export interface HowItWorksProps {
  stats?: { locations: number; rating: number | null; reviews: number }
  showcase?: ShowcaseStation | null
  pins?: readonly HeroMapPin[]
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function buildSlides({ stats, showcase, pins }: HowItWorksProps): Slide[] {
  const locations = stats?.locations ?? 0
  const pin = showcase ? pins?.find((p) => p.slug === showcase.slug) : undefined

  const navigate: Slide = showcase
    ? {
        label: 'Navigate',
        title: 'Drive there and plug in.',
        body: 'One tap starts turn-by-turn directions, and you can see how many ports are free before you set off.',
        visual: { kind: 'directions', station: showcase, pin },
        chip: { icon: Navigation2, text: 'Turn-by-turn directions' },
        chipY: 46,
      }
    : {
        label: 'Navigate',
        title: 'Drive there and plug in.',
        body: 'One tap opens directions, and you can check how many ports are free before you set off.',
        visual: { kind: 'photo', image: '/images/stations/mall-road-ev-hub-3.jpg', focusX: '62%' },
        chip: { icon: Navigation2, text: 'Directions in one tap' },
        target: { x: 58, y: 55 },
      }

  const review: Slide = showcase
    ? {
        label: 'Review',
        title: 'Tell other drivers how it went.',
        body: 'Rate the charger and leave a quick review, so the next driver knows what to expect.',
        visual: { kind: 'reviews', station: showcase },
        // The rating is already the biggest thing on the screen; the chip names
        // what makes it worth trusting instead of repeating it.
        chip: { icon: BadgeCheck, text: 'Verified reviews' },
        chipY: 86,
      }
    : {
        label: 'Review',
        title: 'Tell other drivers how it went.',
        body: 'Rate the charger and leave a quick review, so the next driver knows what to expect.',
        visual: { kind: 'photo', image: '/images/stations/f-10-charging-point-1.jpg', focusX: '50%' },
        chip: {
          icon: Star,
          text:
            stats?.rating != null && stats.reviews > 0
              ? `${stats.rating.toFixed(1)} from ${plural(stats.reviews, 'review', 'reviews')}`
              : 'Rate every charger',
        },
        target: { x: 55, y: 40 },
      }

  return [
    {
      label: 'Search',
      title: 'Find a charger near you.',
      body: 'Type a city or share your location, and every charger around you shows up on one map.',
      visual: { kind: 'photo', image: '/images/stations/dha-charging-hub-1.jpg', focusX: '72%' },
      chip: { icon: MapPin, text: locations > 0 ? `${plural(locations, 'location', 'locations')} mapped` : 'Chargers on one map' },
      target: { x: 56, y: 42 },
    },
    {
      label: 'Filter',
      title: 'See only the chargers that fit your car.',
      body: 'Pick your connector and the charging speed you need. Everything else is filtered out.',
      visual: { kind: 'photo', image: '/images/community/m2-trip-2.jpg', focusX: '55%' },
      chip: { icon: Plug, text: 'Type 2 connector' },
      target: { x: 62, y: 56 },
    },
    navigate,
    review,
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
  const drop = 0.13
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

/* ── The phones ─────────────────────────────────────────────────────────
   Drawn on a 432-px-wide design card: the card is a size container and the
   stage sets 1em to a tenth of a design pixel's worth of its width, so every
   measurement below is in design px ÷ 10 and the phone scales with the card. */

function PhoneStage({ children, tone }: { children: React.ReactNode; tone: 'dark' | 'light' }) {
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <div className="absolute inset-0 text-[calc(100cqw/43.2)]">
        {/* The ground the phone stands on: a soft mint studio, lit from the top left. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#E9FAF3_0%,#CDEFE2_45%,#A9DFCB_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(115deg,transparent_0_46%,rgba(255,255,255,0.7)_46%_47%,transparent_47%)]" />
        <div className="absolute left-[11.8em] top-[6.2em] h-[70em] w-[28.4em] rounded-[4.6em] bg-[linear-gradient(150deg,#3A4B47_0%,#141C1A_40%,#0B1110_100%)] p-[0.8em] shadow-[0_3em_6em_-1.5em_rgba(5,36,30,0.55),inset_0_0_0_0.12em_rgba(255,255,255,0.18)]">
          <div
            className={
              'relative h-full w-full overflow-hidden rounded-[3.9em] ' +
              (tone === 'dark' ? 'bg-[#0A1A17] text-white' : 'bg-white text-slate-900')
            }
          >
            <div className="absolute left-1/2 top-[0.9em] z-20 h-[2.4em] w-[8.6em] -translate-x-1/2 rounded-full bg-black" />
            <div
              className={
                'relative z-10 flex items-center justify-between px-[2.4em] pt-[1.3em] text-[1.15em] font-semibold ' +
                (tone === 'dark' ? 'text-white' : 'text-slate-900')
              }
            >
              <span>9:41</span>
              <span className="flex items-center gap-[0.25em]">
                <span className="h-[0.7em] w-[1.1em] rounded-[0.15em] bg-current opacity-80" />
                <span className="h-[0.75em] w-[1.6em] rounded-[0.22em] border border-current p-[0.1em]">
                  <span className="block h-full w-[75%] rounded-[0.1em] bg-current" />
                </span>
              </span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function DirectionsScreen({ station, pin }: { station: ShowcaseStation; pin?: HeroMapPin }) {
  const detail = pin
    ? `${Math.round(pin.maxPowerKw)} kW · ${pin.availablePorts} of ${pin.ports} ports free`
    : station.city
  return (
    <div className="absolute inset-0 pt-[4.4em]">
      {/* The next turn. */}
      <div className="relative z-10 mx-[1.1em] flex items-center gap-[1.2em] rounded-[1.7em] bg-[#46E3B5] px-[1.5em] py-[1.3em] text-[#06231D] shadow-[0_1em_2em_-1em_rgba(0,0,0,0.6)]">
        <CornerUpRight className="h-[3.2em] w-[3.2em] shrink-0" strokeWidth={2.6} />
        <span className="flex flex-col leading-tight">
          <span className="text-[2.3em] font-bold tracking-[-0.02em]">400 m</span>
          <span className="text-[1.3em] font-semibold opacity-80">Turn right onto Mall Road</span>
        </span>
      </div>

      {/* The map: streets, the route in mint, you and the charger. */}
      <svg viewBox="0 0 290 380" className="absolute inset-x-0 top-[3em] h-[44em] w-full" aria-hidden="true">
        <rect width="290" height="380" fill="#0D211D" />
        <g stroke="#1B3832" strokeLinecap="round" fill="none">
          <path d="M-10 250 L300 190" strokeWidth="14" />
          <path d="M70 -10 L120 400" strokeWidth="12" />
          <path d="M210 -10 L230 400" strokeWidth="10" />
          <path d="M-10 120 L300 95" strokeWidth="9" />
          <path d="M-10 330 L300 300" strokeWidth="8" />
          <path d="M150 -10 L165 400" strokeWidth="5" opacity="0.7" />
          <path d="M-10 180 L300 150" strokeWidth="5" opacity="0.7" />
          <path d="M20 -10 L40 400" strokeWidth="4" opacity="0.6" />
        </g>
        <g fill="#122C27">
          <rect x="130" y="205" width="28" height="22" rx="4" />
          <rect x="175" y="120" width="26" height="24" rx="4" />
          <rect x="84" y="140" width="22" height="30" rx="4" />
          <rect x="238" y="240" width="30" height="26" rx="4" />
        </g>
        {/* The route: glow, then the line. */}
        <path d="M112 350 L104 262 L222 238 L216 132" fill="none" stroke="#46E3B5" strokeOpacity="0.35" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M112 350 L104 262 L222 238 L216 132" fill="none" stroke="#5CF0C3" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        {/* You, heading up the route. */}
        <circle cx="112" cy="350" r="15" fill="#5CF0C3" fillOpacity="0.25" />
        <circle cx="112" cy="350" r="9" fill="#FFFFFF" />
        <path d="M112 342 L117 355 L112 352 L107 355 Z" fill="#0B332C" />
        {/* The charger. */}
        <g transform="translate(216 132)">
          <path d="M0 0 C -4 -9 -15 -16 -15 -27 A 15 15 0 1 1 15 -27 C 15 -16 4 -9 0 0 Z" fill="#46E3B5" />
          <path d="M2 -37 L -6 -25 L -1 -25 L -3 -17 L 6 -29 L 1 -29 Z" fill="#06231D" />
        </g>
      </svg>

      {/* The destination sheet. */}
      <div className="absolute inset-x-0 top-[44em] rounded-t-[2.2em] bg-[#10231F] px-[1.8em] pb-[3em] pt-[1.6em] shadow-[0_-1em_2em_rgba(0,0,0,0.35)]">
        <div className="mx-auto mb-[1.3em] h-[0.4em] w-[4em] rounded-full bg-white/25" />
        <div className="flex items-start justify-between gap-[1em]">
          <span className="min-w-0">
            <span className="block truncate text-[1.7em] font-bold">{station.name}</span>
            <span className="mt-[0.3em] flex items-center gap-[0.4em] text-[1.2em] text-white/65">
              <Zap className="h-[1em] w-[1em] fill-[#46E3B5] text-[#46E3B5]" strokeWidth={1.5} />
              {detail}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[2.2em] font-bold leading-none text-[#5CF0C3]">12 min</span>
            <span className="mt-[0.4em] block text-[1.15em] text-white/60">4.2 km</span>
          </span>
        </div>
        <div className="mt-[1.6em] flex h-[4.2em] items-center justify-center rounded-[1.3em] bg-[#46E3B5] text-[1.35em] font-semibold text-[#06231D]">
          End route
        </div>
      </div>
    </div>
  )
}

/** "12 Sep" — fixed locale and UTC, so the server and the browser agree. */
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={'flex items-center gap-[0.15em] ' + (className ?? '')}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={'h-[1em] w-[1em] ' + (i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

function ReviewsScreen({ station }: { station: ShowcaseStation }) {
  const max = Math.max(1, ...station.breakdown)
  return (
    <div className="absolute inset-0 px-[1.8em] pt-[4.6em]">
      <div className="flex items-center gap-[0.5em] text-[1.25em] font-semibold text-slate-500">
        <ChevronLeft className="h-[1.2em] w-[1.2em]" strokeWidth={2.2} />
        Reviews
      </div>
      <p className="mt-[0.9em] truncate text-[1.8em] font-bold tracking-[-0.02em]">{station.name}</p>
      <p className="mt-[0.2em] text-[1.2em] text-slate-500">{station.city}</p>

      {/* The summary: the average, the stars, the breakdown. */}
      <div className="mt-[1.6em] flex items-center gap-[1.8em] rounded-[1.6em] bg-slate-50 p-[1.5em]">
        <span className="shrink-0 text-center">
          <span className="block text-[4.6em] font-black leading-none tracking-[-0.04em]">{station.rating.toFixed(1)}</span>
          <Stars value={station.rating} className="mt-[0.5em] justify-center text-[1.2em]" />
          <span className="mt-[0.5em] block text-[1.1em] text-slate-500">{plural(station.reviewCount, 'review', 'reviews')}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[0.55em]">
          {station.breakdown.map((count, i) => (
            <span key={i} className="flex items-center gap-[0.7em]">
              <span className="w-[1em] text-[1.05em] text-slate-500">{5 - i}</span>
              <span className="h-[0.6em] flex-1 overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / max) * 100}%` }} />
              </span>
            </span>
          ))}
        </span>
      </div>

      {/* Two verified reviews, word for word. */}
      <div className="mt-[1.4em] flex flex-col gap-[1.1em]">
        {station.reviews.map((r) => (
          <div
            key={r.userName + r.date}
            className="rounded-[1.6em] border border-slate-100 bg-white p-[1.4em] shadow-[0_0.6em_1.6em_-1em_rgba(5,36,30,0.25)]"
          >
            <div className="flex items-center gap-[0.9em]">
              <span className="flex h-[3.4em] w-[3.4em] shrink-0 items-center justify-center rounded-full bg-[#E3F6EF] text-[1.2em] font-bold text-[#0B332C]">
                {r.userName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-[0.4em] text-[1.3em] font-bold">
                  <span className="truncate">{r.userName}</span>
                  {r.verified ? <BadgeCheck className="h-[1em] w-[1em] shrink-0 text-[#159E89]" strokeWidth={2} /> : null}
                </span>
                <span className="block truncate text-[1.1em] text-slate-400">
                  {r.userVehicle} · {shortDate(r.date)}
                </span>
              </span>
            </div>
            {/* The stars on their own line, as in the app, so the name never truncates. */}
            <Stars value={r.rating} className="mt-[0.9em] text-[1.1em]" />
            <p className="mt-[0.6em] line-clamp-3 text-[1.2em] leading-[1.5] text-slate-700">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Visual({ visual, priority }: { visual: Visual; priority?: boolean }) {
  if (visual.kind === 'directions')
    return (
      <PhoneStage tone="dark">
        <DirectionsScreen station={visual.station} pin={visual.pin} />
      </PhoneStage>
    )
  if (visual.kind === 'reviews')
    return (
      <PhoneStage tone="light">
        <ReviewsScreen station={visual.station} />
      </PhoneStage>
    )
  return (
    <Image
      src={visual.image}
      alt=""
      fill
      sizes="(max-width: 1024px) 22rem, 27rem"
      quality={88}
      className="pointer-events-none select-none object-cover"
      style={{ objectPosition: `${visual.focusX} center` }}
      priority={priority}
    />
  )
}

/** The peek only needs a hint of the next picture. */
function PeekVisual({ visual }: { visual: Visual }) {
  if (visual.kind === 'photo')
    return (
      <Image src={visual.image} alt="" fill sizes="104px" className="object-cover" style={{ objectPosition: `${visual.focusX} center` }} />
    )
  return <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#E9FAF3_0%,#CDEFE2_45%,#A9DFCB_100%)]" />
}

const visualKey = (v: Visual) => (v.kind === 'photo' ? v.image : v.kind)

const EASE = [0.22, 1, 0.36, 1] as const

export function HowItWorks({ stats, showcase, pins }: HowItWorksProps) {
  const slides = React.useMemo(() => buildSlides({ stats, showcase, pins }), [stats, showcase, pins])
  const [[index, dir], setState] = React.useState<[number, 1 | -1]>([0, 1])
  const reduce = useReducedMotion()
  const clipId = React.useId().replace(/:/g, '')
  const n = slides.length
  const slide = slides[index]!
  const next = slides[(index + 1) % n]!

  const go = React.useCallback((d: 1 | -1) => setState(([i]) => [(i + d + n) % n, d]), [n])
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
  const chipY = slide.chipY ?? CHIP.y

  const ctrl =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors duration-200 hover:border-[#0B332C] hover:text-[#0B332C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159E89] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50'

  return (
    <section
      className="relative overflow-hidden bg-slate-50 py-[clamp(5rem,12vh,8.5rem)]"
      aria-labelledby="how-heading"
      aria-roledescription="carousel"
      onKeyDown={onKey}
    >
      {/* A faint mint lift behind the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[6%] top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-[#46E3B5]/[0.12] blur-[120px]"
      />
      <CardClip id={clipId} />

      <div className="container-plug relative grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-[clamp(3rem,7vw,7rem)]">
        {/* ── The words ─────────────────────────────────────────────── */}
        <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:min-h-[36rem] lg:py-6">
          <h2 id="how-heading" className="text-[13px] font-bold uppercase tracking-[0.22em] text-[#159E89]">
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
                <h3 className="max-w-[34rem] text-balance text-[clamp(2.1rem,3.4vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-slate-900">
                  {slide.title}
                </h3>
                <motion.p
                  className="mt-8 text-[15px] font-semibold text-slate-900"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...t(0.4), delay: reduce ? 0 : 0.12 }}
                >
                  Step {index + 1} of {n} <span className="px-1.5 text-slate-300">·</span> {slide.label}
                </motion.p>
                <motion.p
                  className="mt-2 max-w-[30rem] text-[16px] leading-[1.6] text-slate-500"
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
            <button type="button" onClick={() => go(-1)} aria-label="Previous step" className={ctrl}>
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </button>

            {/* One segment per step; the fill runs to the current one. Each
                quarter is a button, so the bar is also a way to jump. */}
            <div className="relative flex h-6 w-[min(22rem,48vw)] items-center" role="group" aria-label="Choose a step">
              <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-slate-300" />
              <motion.div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#159E89]"
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
                  className="relative z-10 h-full flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159E89]"
                />
              ))}
            </div>

            <button type="button" onClick={() => go(1)} aria-label="Next step" className={ctrl}>
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── The picture ────────────────────────────────────────────── */}
        <div className="relative order-1 mx-auto w-[min(20rem,78vw)] sm:w-[22rem] lg:order-2 lg:mr-[clamp(4rem,7vw,7.5rem)] lg:w-[clamp(22rem,27vw,27rem)]">
          {/* The next step, peeking in from the right and dimmed. */}
          <div
            aria-hidden="true"
            className="absolute left-[calc(100%+2.25rem)] top-[11%] hidden h-[74%] w-[6.5rem] overflow-hidden rounded-[1.75rem] sm:block"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={visualKey(next.visual)}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t(0.5)}
              >
                <PeekVisual visual={next.visual} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-slate-50/55" />
          </div>

          {/* The card's shadow lives on a wrapper: clip-path would cut it off the card itself. */}
          <div className="[filter:drop-shadow(0_30px_40px_rgba(5,36,30,0.18))]">
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
                  key={visualKey(slide.visual)}
                  className="absolute inset-0"
                  custom={dir}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: `${dir * 14}%`, scale: 1.06 }}
                  animate={{ opacity: 1, x: '0%', scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: `${dir * -10}%`, scale: 0.98 }}
                  transition={t(0.7)}
                >
                  <Visual visual={slide.visual} priority={index === 0} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

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
              {slide.target ? (
                <motion.path
                  key={index}
                  d={`M ${CHIP.x * 0.64} ${chipY} L ${slide.target.x * 0.64} ${slide.target.y}`}
                  fill="none"
                  stroke="#159E89"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 0.45, ease: EASE }}
                />
              ) : null}
            </AnimatePresence>
          </svg>
          <AnimatePresence mode="wait" initial={false}>
            {slide.target ? (
            <motion.span
              key={index}
              aria-hidden="true"
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#159E89] shadow-[0_0_0_4px_rgba(21,158,137,0.25)]"
              style={{ left: `${slide.target.x}%`, top: `${slide.target.y}%` }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.85 }}
            />
            ) : null}
          </AnimatePresence>

          {/* The chip, over the card's left edge. */}
          <div className="absolute -left-[clamp(1rem,3.5vw,3.5rem)] -translate-y-1/2" style={{ top: `${chipY}%` }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-slate-200 bg-white/90 py-3 pl-4 pr-5 text-[14px] font-semibold text-slate-900 shadow-[0_14px_30px_-12px_rgba(5,36,30,0.35)] backdrop-blur-md"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -6, transition: { duration: 0.18 } }}
                transition={{ ...t(0.4), delay: reduce ? 0 : 0.3 }}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0 text-[#159E89]" aria-hidden="true" />
                {slide.chip.text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
