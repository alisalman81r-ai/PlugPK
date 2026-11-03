// src/components/home/v2/HomeStory.tsx
'use client'

import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import type { ShowcaseConnectors, ShowcaseSearch } from '@/lib/charging'
import { cn } from '@/lib/utils'
import { BoltFill, NavArrow, Phone, PhoneTabs, SearchGlyph, StatusBar } from './Phone'
import { PK_CITIES, PK_PATH } from './pk-geo'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/* ═══ 2. Statement ═══════════════════════════════════════════════════════
   A pinned panel. As it scrolls, the line lights up word by word, then the
   photo grows from a small card to the full screen and the line crossfades
   to white over it, while a range meter fills underneath. */

const LINE_A = 'Drive anywhere in Pakistan, worry-free.'
const LINE_B = 'No range anxiety, just the'
const WORDS = [...LINE_A.split(' '), ...LINE_B.split(' '), 'open road.']

function Word({ word, i, progress, hl }: { word: string; i: number; progress: MotionValue<number>; hl?: boolean }) {
  const start = 0.02 + (i / WORDS.length) * 0.3
  const opacity = useTransform(progress, [start, start + 0.04], [0.14, 1])
  return (
    <motion.span style={{ opacity }} className={cn('inline-block', hl && 'hl pg-bold')}>
      {word}
      {hl ? null : ' '}
    </motion.span>
  )
}

export function Statement() {
  const ref = React.useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const sx = useTransform(scrollYProgress, [0.32, 0.72], [0.18, 1])
  const sy = useTransform(scrollYProgress, [0.32, 0.72], [0.24, 1])
  const ty = useTransform(scrollYProgress, [0.32, 0.72], ['28%', '0%'])
  const shade = useTransform(scrollYProgress, [0.55, 0.75], [0, 1])
  const darkText = useTransform(scrollYProgress, [0.6, 0.72], [1, 0])
  const lightText = useTransform(scrollYProgress, [0.62, 0.76], [0, 1])
  const meter = useTransform(scrollYProgress, [0.05, 0.92], [0, 1])
  const [pct, setPct] = React.useState(0)
  const [full, setFull] = React.useState(false)
  useMotionValueEvent(meter, 'change', (v) => {
    setPct(Math.round(v * 100))
    setFull(v > 0.7)
  })

  if (reduce) {
    return (
      <section ref={ref} data-theme="dark" className="relative grid min-h-[640px] place-items-center overflow-hidden">
        <Image src="/images/home/v2/open-road.jpg" alt="An electric car parked on an open mountain road" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,.3),rgba(11,12,14,.6))]" />
        <p className="relative z-[2] w-[min(1200px,calc(100%-2*clamp(16px,4vw,64px)))] text-balance text-center font-display text-[clamp(30px,4.3vw,68px)] leading-[1.08] text-white">
          <span className="block">{LINE_A}</span>
          <span className="block">
            {LINE_B} <em className="pg-bold not-italic text-volt">open road.</em>
          </span>
        </p>
      </section>
    )
  }

  return (
    <section ref={ref} data-theme={full ? 'dark' : 'light'} className="relative h-[260vh] bg-paper">
      <div className="sticky top-0 grid h-screen min-h-[560px] place-items-center overflow-hidden sm:min-h-[640px]">
        <motion.figure
          style={{ scaleX: sx, scaleY: sy, y: ty }}
          className="absolute inset-0 m-0 overflow-hidden will-change-transform"
        >
          <Image src="/images/home/v2/open-road.jpg" alt="An electric car parked on an open mountain road" fill sizes="100vw" className="object-cover" />
          <motion.i style={{ opacity: shade }} className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,.3),rgba(11,12,14,.6))]" />
        </motion.figure>

        <motion.p
          style={{ opacity: darkText }}
          className="relative z-[2] col-start-1 row-start-1 m-0 w-[min(1200px,calc(100%-2*clamp(16px,4vw,64px)))] text-balance text-center font-display text-[clamp(30px,4.3vw,68px)] leading-[1.08] text-ink"
        >
          {WORDS.map((word, i) => (
            <React.Fragment key={i}>
              <Word word={word} i={i} progress={scrollYProgress} hl={i === WORDS.length - 1} />
              {i === LINE_A.split(' ').length - 1 ? <br /> : null}
            </React.Fragment>
          ))}
        </motion.p>
        <motion.p
          aria-hidden="true"
          style={{ opacity: lightText }}
          className="relative z-[2] col-start-1 row-start-1 m-0 w-[min(1200px,calc(100%-2*clamp(16px,4vw,64px)))] text-balance text-center font-display text-[clamp(30px,4.3vw,68px)] leading-[1.08] text-white"
        >
          <span className="block">{LINE_A}</span>
          <span className="block">
            {LINE_B} <em className="pg-bold not-italic text-volt">open road.</em>
          </span>
        </motion.p>

        <div
          aria-hidden="true"
          className={cn(
            'absolute bottom-10 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-3.5 font-mono text-xs tracking-[0.14em] transition-colors',
            full ? 'text-white' : 'text-muted',
          )}
        >
          RANGE
          <i className={cn('relative h-2 w-[120px] overflow-hidden rounded-lg sm:w-[220px]', full ? 'bg-white/20' : 'bg-ink/10')}>
            <motion.i style={{ scaleX: meter }} className={cn('absolute inset-0 origin-left rounded-lg', full ? 'bg-volt' : 'bg-ink')} />
          </i>
          <span className="w-9">{pct}%</span>
        </div>
      </div>
    </section>
  )
}

/* ═══ 3. How it works ════════════════════════════════════════════════════
   Four steps beside a phone that acts each one out on the network's real
   data: the city with the most ports and its stations, the connector filter
   with its real match count, the first station's sheet, and the review. */

const STEPS = [
  { name: 'Search', desc: 'Type a city or share your location, and every charger around you shows up on one map.' },
  { name: 'Filter', desc: 'Pick your connector and the speed you need, and the list narrows to chargers your car can use.' },
  { name: 'Navigate', desc: 'Open a station to check its connectors and ports, then get directions in one tap.' },
  { name: 'Review', desc: 'After you charge, leave a rating so the next driver knows what to expect.' },
]

export function HowItWorks({
  locations,
  search,
  connectors,
}: {
  locations: number
  search: ShowcaseSearch | null
  connectors: ShowcaseConnectors | null
}) {
  const ref = React.useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduce = useReducedMotion()
  const [step, setStep] = React.useState(0)
  const [held, setHeld] = React.useState(false)

  React.useEffect(() => {
    if (!inView || held || reduce) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3800)
    return () => window.clearInterval(id)
  }, [inView, held, reduce])

  const city = search?.city ?? 'Lahore'
  const results = (search?.results ?? []).slice(0, 2)
  const first = results[0] ?? null
  const chip = connectors?.selected ?? 'CCS2'

  return (
    <section ref={ref} data-theme="light" className="bg-chalk">
      <div className="mx-auto grid w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-6 py-[clamp(96px,11vw,150px)] lg:grid-cols-2 lg:gap-10">
        <div className="max-w-[620px]">
          <p className="mb-[18px] font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">
            Start finding chargers in seconds
          </p>
          <h2 className={cn(H2_CLASS, 'mb-[30px] text-[clamp(36px,3.9vw,60px)] text-ink')}>
            Find a charger <Hl>near you.</Hl>
          </h2>
          <ol className="border-t border-ink/10">
            {STEPS.map((s, i) => {
              const on = i === step
              return (
                <li key={s.name} className="border-b border-ink/10">
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Step ${i + 1} of 4: ${s.name}`}
                    onClick={() => {
                      setStep(i)
                      setHeld(true)
                    }}
                    className="group/how grid w-full grid-cols-[clamp(64px,6.4vw,96px)_1fr] items-start gap-[18px] py-[18px] text-left"
                  >
                    <span
                      className={cn(
                        'font-display text-[clamp(40px,3.8vw,60px)] leading-[0.92] transition-colors duration-500',
                        on ? 'pg-medium text-ink' : 'text-transparent [-webkit-text-stroke:1.2px_rgba(11,12,14,.24)]',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <b
                        className={cn(
                          'pg-medium mb-1.5 mt-0.5 block font-display text-[clamp(22px,2vw,30px)] font-normal leading-[1.1] text-ink transition-opacity duration-500',
                          on ? 'opacity-100' : 'opacity-[0.32] group-hover/how:opacity-60',
                        )}
                      >
                        {s.name}
                      </b>
                      <span className={cn('block max-w-[30rem] text-[15.5px] leading-[1.55] text-muted transition-opacity duration-500', on ? 'opacity-100' : 'opacity-45')}>
                        {s.desc}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div aria-hidden="true" className="mt-[26px] h-[3px] overflow-hidden rounded-[3px] bg-ink/10">
            <i
              className="relative block h-full origin-left rounded-[3px] bg-ink transition-transform duration-700 ease-out after:absolute after:right-0 after:top-0 after:h-full after:w-[18px] after:bg-volt"
              style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }}
            />
          </div>
          <Link href="/map" className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-[22px] text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-volt hover:text-ink">
            Open the map
          </Link>
        </div>

        <div aria-hidden="true" className="relative -mx-2 h-[560px] sm:mx-0 lg:h-[640px]">
          <div className="absolute inset-[40px_6%_40px_14%] rounded-[40px] bg-[radial-gradient(120%_90%_at_20%_10%,#F3FFC2,#D4FF3A_55%,#A9D81A)] shadow-e2 [transform:perspective(1200px)_rotateY(-14deg)_rotateX(4deg)] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[repeating-linear-gradient(115deg,transparent_0_46px,rgba(255,255,255,.18)_46px_48px)]" />
          <div className="absolute bottom-2.5 left-2 z-[3] inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold shadow-e2 sm:bottom-auto sm:left-0 sm:top-[46%]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-volt-ink">
              <g fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </g>
            </svg>
            {locations.toLocaleString('en-PK')} {locations === 1 ? 'location' : 'locations'} mapped
          </div>
          <div className="absolute left-1/2 top-1/2 -ml-[123px] -mt-[300px] scale-[0.86] sm:scale-100">
            <Phone className="relative">
              <StatusBar />
              <div className="flex h-10 items-center gap-2 rounded-xl border-[1.5px] border-volt px-3 text-[13px] font-medium">
                <SearchGlyph className="h-[15px] w-[15px] text-volt" />
                <span className="after:ml-0.5 after:inline-block after:h-[13px] after:w-px after:animate-pulse after:bg-volt after:align-[-2px]">{city}</span>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {['Near me', 'Fast 50 kW+', chip].map((label, i) => (
                  <span
                    key={label}
                    className={cn(
                      'inline-flex h-[26px] items-center gap-1 rounded-full px-2.5 text-[10px] font-medium transition-colors duration-300',
                      step === 1 && i > 0 ? 'bg-volt text-ink' : 'bg-[#1B1E23] text-white/80',
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="relative mt-2.5 h-[150px] overflow-hidden rounded-[14px] bg-[#15181C]">
                <svg viewBox="0 0 280 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                  <g stroke="rgba(255,255,255,.08)" strokeWidth="6" fill="none" strokeLinecap="round">
                    <path d="M-10 40 300 20M-10 110 300 85M60 -10 90 170M190 -10 170 170M-10 150 140 -10" />
                  </g>
                  <circle cx="150" cy="104" r="6" fill="#fff" />
                </svg>
                {[
                  ['30%', '26%'],
                  ['64%', '6%'],
                ].map(([left, top]) => (
                  <span
                    key={left}
                    style={{ left, top }}
                    className="absolute grid h-7 w-7 -rotate-45 place-items-center rounded-[50%_50%_50%_4px] bg-volt text-ink shadow-[0_6px_16px_rgba(0,0,0,.5)]"
                  >
                    <BoltFill className="h-[13px] w-[13px] rotate-45" />
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <p className="mx-0.5 mb-2 flex items-baseline justify-between">
                  <b className="text-xs">
                    {step === 1 && connectors
                      ? `${connectors.matches} ${connectors.matches === 1 ? 'charger matches' : 'chargers match'}`
                      : `${search?.results.length ?? results.length} chargers in ${city}`}
                  </b>
                  <span className="text-[9.5px] text-white/50">Fastest first</span>
                </p>
                {results.map((r, i) => (
                  <div
                    key={r.slug}
                    className={cn(
                      'mb-2 rounded-[14px] border bg-[#181B1F] px-3 py-[11px] transition-[border-color,opacity] duration-300',
                      step === 1 && i === 0 ? 'border-volt' : 'border-transparent',
                      step === 1 && i > 0 && 'opacity-35',
                    )}
                  >
                    <p className="mb-[3px] flex justify-between">
                      <b className="truncate text-[11.5px]">{r.name}</b>
                      <span className="shrink-0 text-[10px] text-white/65">
                        {r.ports} {r.ports === 1 ? 'port' : 'ports'}
                      </span>
                    </p>
                    <small className="flex items-center gap-1 text-[9.5px] text-white/60">
                      <BoltFill className="h-2.5 w-2.5 text-volt" />
                      {r.area} · {Math.round(r.maxPowerKw)} kW
                    </small>
                    <div className="mt-2 flex gap-[5px]">
                      {r.connectors.slice(0, 2).map((c) => (
                        <i key={c} className="rounded-full border border-white/20 px-2 py-[3px] text-[9px] font-semibold not-italic">
                          {c}
                        </i>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 3: the station sheet. Step 4: the review sheet. */}
              <motion.div
                initial={false}
                animate={{ y: step === 2 && first ? 0 : '110%' }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="absolute inset-x-0 bottom-0 z-[3] rounded-t-3xl bg-[#1B1E23] px-[18px] pb-[70px] pt-3 shadow-[0_-20px_40px_rgba(0,0,0,.5)]"
              >
                <i className="mx-auto mb-3 block h-1 w-9 rounded bg-white/20" />
                <p className="mb-1 text-[15px] font-bold">{first?.name}</p>
                <small className="flex items-center gap-1 text-[9.5px] text-white/60">
                  <BoltFill className="h-2.5 w-2.5 text-volt" />
                  {first ? `${first.area} · ${Math.round(first.maxPowerKw)} kW · ${first.ports} ports` : null}
                </small>
                <div className="mt-3.5 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-volt text-xs font-bold text-ink">
                  <NavArrow className="h-[13px] w-[13px]" />
                  Navigate
                </div>
              </motion.div>
              <motion.div
                initial={false}
                animate={{ y: step === 3 ? 0 : '110%' }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="absolute inset-x-0 bottom-0 z-[3] rounded-t-3xl bg-[#1B1E23] px-[18px] pb-[70px] pt-3 shadow-[0_-20px_40px_rgba(0,0,0,.5)]"
              >
                <i className="mx-auto mb-3 block h-1 w-9 rounded bg-white/20" />
                <p className="mb-1 text-[15px] font-bold">Rate this station</p>
                <div className="my-2.5 flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className="h-7 w-7 text-[#FFB020]">
                      <path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z" fill="currentColor" />
                    </svg>
                  ))}
                </div>
                <div className="h-[54px] rounded-xl border border-white/[0.12] px-3 py-2.5 text-[10.5px] text-white/45">Share your experience…</div>
              </motion.div>
              <PhoneTabs on="Map" />
            </Phone>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ 4. Route planner ═══════════════════════════════════════════════════
   An ink band holding Pakistan with its cities. As it scrolls, the trip from
   Islamabad to Lahore draws along the M-2, a car rides it, and the card on the
   right steps through departure, two charging stops and arrival. The trip is
   an illustration and says so. */

const MAJOR = ['Gilgit', 'Peshawar', 'Islamabad', 'Lahore', 'Faisalabad', 'D.I. Khan', 'Multan', 'Bahawalpur', 'Quetta', 'Sukkur', 'Hyderabad', 'Karachi']
const KEY = new Set(['Islamabad', 'Lahore'])
const TRIP = ['Islamabad', 'Chakri', 'Kallar Kahar', 'Bhera', 'Sial Mor', 'Pindi Bhattian', 'Lahore'].map((n) => PK_CITIES[n]!)
const TRIP_D = `M${TRIP.map(([x, y]) => `${x} ${y}`).join(' L')}`
const STOPS = [PK_CITIES['Kallar Kahar']!, PK_CITIES['Sial Mor']!]

/** A point a fraction t along the trip polyline. */
function along(t: number): [number, number] {
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < TRIP.length; i++) {
    const d = Math.hypot(TRIP[i]![0] - TRIP[i - 1]![0], TRIP[i]![1] - TRIP[i - 1]![1])
    seg.push(d)
    total += d
  }
  let left = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]! || i === seg.length - 1) {
      const f = seg[i]! ? left / seg[i]! : 0
      const [ax, ay] = TRIP[i]!
      const [bx, by] = TRIP[i + 1]!
      return [ax + (bx - ax) * f, ay + (by - ay) * f]
    }
    left -= seg[i]!
  }
  return TRIP[TRIP.length - 1]!
}

const STATES = [
  { at: 0, batt: 80, label: 'Departing' },
  { at: 0.3, batt: 34, label: 'Charging' },
  { at: 0.4, batt: 78, label: 'Driving' },
  { at: 0.62, batt: 41, label: 'Charging' },
  { at: 0.72, batt: 80, label: 'Driving' },
  { at: 1, batt: 45, label: 'Arrived' },
]

export function RouteBand() {
  const ref = React.useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const draw = useTransform(scrollYProgress, [0, 0.85], [0, 1])
  const [t, setT] = React.useState(reduce ? 1 : 0)
  useMotionValueEvent(draw, 'change', (v) => setT(v))

  const [cx, cy] = along(t)
  const state = [...STATES].reverse().find((s) => t >= s.at) ?? STATES[0]!
  const lit = t >= 0.98 ? 3 : t >= 0.62 ? 2 : t >= 0.3 ? 1 : 0

  return (
    <section ref={ref} data-theme="dark" className="relative overflow-hidden bg-ink text-white">
      <svg viewBox="0 0 1000 811" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="relative block h-[440px] w-full lg:absolute lg:inset-0 lg:h-full">
        <defs>
          <pattern id="rgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0v40" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="-500" y="-500" width="2000" height="1811" fill="url(#rgrid)" />
        <path d={PK_PATH} fill="#121519" stroke="rgba(212,255,58,.35)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        {MAJOR.map((name) => {
          const [x, y] = PK_CITIES[name]!
          const key = KEY.has(name)
          return (
            <g key={name}>
              <circle cx={x} cy={y} r={key ? 4 : 3} fill={key ? '#fff' : 'rgba(255,255,255,.45)'} />
              <text x={x + 9} y={y + 4} fontSize={key ? 15 : 12} fontWeight={key ? 600 : 400} fill={key ? '#fff' : 'rgba(255,255,255,.45)'} className="font-sans">
                {name}
              </text>
            </g>
          )
        })}
        <path d={TRIP_D} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path
          d={TRIP_D}
          fill="none"
          stroke="#D4FF3A"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: reduce ? 1 : draw, filter: 'drop-shadow(0 0 6px rgba(212,255,58,.7))' }}
        />
        {STOPS.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} opacity={lit > i ? 1 : 0.35}>
            <circle r="11" fill="#0B0C0E" stroke="#D4FF3A" strokeWidth="1.5" />
            <path d="M1.5-7-5 1.5h4.5L-1.5 7 5-1.5H.5z" fill="#D4FF3A" />
          </g>
        ))}
        <g transform={`translate(${cx} ${cy})`}>
          <circle r="16" fill="rgba(212,255,58,.22)" />
          <circle r="7" fill="#D4FF3A" stroke="#0B0C0E" strokeWidth="2" />
        </g>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#0B0C0E_0%,rgba(11,12,14,.88)_26%,transparent_44%,transparent_62%,rgba(11,12,14,.85)_78%,#0B0C0E_100%)] lg:block" />

      <div className="relative z-[2] mx-auto grid w-[min(1440px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-8 pb-20 pt-10 lg:min-h-[100vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,.75fr)_minmax(340px,420px)] lg:py-24">
        <div>
          <h2 className={cn(H2_CLASS, 'text-[clamp(36px,3.7vw,62px)] text-white')}>
            <span className="block">Plan a long drive</span>
            <span className="block">
              <Hl dark>around your range</Hl>
            </span>
          </h2>
          <p className={cn(LEAD_CLASS, 'max-w-[34rem] text-white/70')}>
            Pick a start and a destination. We place the charging stops where your car actually needs them, using its real
            range rather than the brochure figure.
          </p>
          <Link
            href="/routes"
            className="mt-9 inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-[22px] text-[15px] font-semibold text-ink transition-colors duration-300 hover:bg-volt"
          >
            Plan a route
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(22,24,28,.72)] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] backdrop-blur-[20px] sm:p-[26px] lg:col-start-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/75">
              Example trip · Illustration
            </span>
            <span className="font-mono font-semibold text-volt">385 km</span>
          </div>
          <p className="pg-medium mb-[18px] mt-3.5 font-display text-[26px] leading-[1.1]">Islamabad → Lahore</p>
          <div className="mb-[18px] flex items-center gap-3.5 rounded-2xl bg-white/[0.04] p-3.5">
            <div className="relative h-[26px] flex-1 rounded-lg border-[1.5px] border-white/40 p-[3px] after:absolute after:-right-1.5 after:top-[7px] after:h-[9px] after:w-[3px] after:rounded-r-sm after:bg-white/40">
              <i
                className={cn('block h-full rounded transition-[width,background-color] duration-300', state.label === 'Charging' ? 'bg-[#35D07F]' : 'bg-volt')}
                style={{ width: `${state.batt}%` }}
              />
            </div>
            <b className="min-w-16 text-right font-mono text-[22px]">{state.batt}%</b>
            <span className="min-w-[76px] font-mono text-[11px] uppercase tracking-[0.08em] text-white/55">{state.label}</span>
          </div>
          <ol className="relative before:absolute before:bottom-[18px] before:left-[13px] before:top-[18px] before:border-l-[1.5px] before:border-dashed before:border-white/20">
            {[
              { name: 'Islamabad', meta: '80%', tone: 'text-[#35D07F]', dot: 'border-[#35D07F] bg-[#35D07F]' },
              { name: 'Charging stop 1', meta: '22m · 34→78%', tone: 'text-white/65', dot: 'border-volt bg-volt text-ink', bolt: true },
              { name: 'Charging stop 2', meta: '23m · 41→80%', tone: 'text-white/65', dot: 'border-volt bg-volt text-ink', bolt: true },
              { name: 'Lahore', meta: '45%', tone: 'text-[#FFB020]', dot: 'border-white bg-white' },
            ].map((row, i) => (
              <li
                key={row.name}
                className={cn('relative grid grid-cols-[28px_1fr_auto] items-center gap-3.5 py-3 transition-opacity duration-500', i <= lit ? 'opacity-100' : 'opacity-[0.38]')}
              >
                <i className={cn('grid h-7 w-7 place-items-center rounded-full border-[1.5px]', row.dot)}>
                  {row.bolt ? <BoltFill className="h-[13px] w-[13px]" /> : null}
                </i>
                <b className="text-[15px] font-semibold">{row.name}</b>
                <span className={cn('font-mono text-[12.5px]', row.tone)}>{row.meta}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3.5 grid grid-cols-3 gap-3 border-t border-white/10 pt-[18px]">
            {[
              ['4h 20m', 'Drive time'],
              ['2', 'Charging stops'],
              ['45m', 'Charging'],
            ].map(([v, l]) => (
              <div key={l}>
                <b className="mt-1.5 block font-mono text-xl font-semibold">{v}</b>
                <span className="text-xs text-white/55">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
