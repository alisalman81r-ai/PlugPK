// src/components/home/v2/HomeHero.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { LogoMark } from '@/components/ui/Logo'
import type { HeroMapPin } from '@/lib/charging'
import { BoltFill, NavArrow, Phone, PhoneTabs, SearchGlyph, StatusBar } from './Phone'
import { PK_CITIES, PK_PATH, pkProject } from './pk-geo'

/**
 * The landing-v2 hero: "Find EV chargers across Pakistan." with the search
 * pill on the left, and on the right Pakistan's outline drawn in a volt glow
 * with every real station as a pin, the app's phone leaning over it.
 *
 * The search is the real one: it opens the map searched for what was typed.
 * The phone's station card shows the network's fastest real station.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const [IX, IY] = PK_CITIES.Islamabad!
const [LX, LY] = PK_CITIES.Lahore!
/** Lahore to Islamabad, the motorway corridor, as a gentle curve. */
const ROUTE_D = `M${LX} ${LY} C ${LX - 30} ${LY - 50}, ${IX + 40} ${IY + 70}, ${IX} ${IY}`

export function HomeHero({ pins }: { pins: HeroMapPin[] }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [query, setQuery] = React.useState('')

  const fastest = React.useMemo(
    () => [...pins].sort((a, b) => b.maxPowerKw - a.maxPowerKw || b.ports - a.ports)[0] ?? null,
    [pins],
  )
  /* One dot per distinct spot, so a city with ten stations is not ten stacked dots. */
  const dots = React.useMemo(() => {
    const seen = new Set<string>()
    return pins
      .map((pin) => ({ ...pkProject(pin.lng, pin.lat), slug: pin.slug }))
      .filter((p) => {
        const key = `${Math.round(p.x / 6)}:${Math.round(p.y / 6)}`
        if (seen.has(key)) return false
        seen.add(key)
        return p.x > 0 && p.x < 1000 && p.y > 0 && p.y < 811
      })
      .slice(0, 80)
  }, [pins])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/map?q=${encodeURIComponent(q)}` : '/map')
  }

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { y: '105%' },
          animate: { y: '0%' },
          transition: { duration: 1.1, ease: EASE_OUT, delay },
        }

  return (
    <section
      data-theme="dark"
      className="relative isolate -mt-[var(--nav-h)] overflow-hidden bg-ink text-white lg:min-h-[100svh]"
    >
      {/* Ground: a volt glow from the top right and three dotted currents. */}
      <div aria-hidden="true" className="absolute inset-0 -z-[1]">
        <div className="absolute -right-[200px] -top-[260px] h-[900px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)] blur-[20px]" />
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <g fill="none" stroke="rgba(212,255,58,.22)" strokeWidth="1.2" strokeDasharray="2 14" vectorEffect="non-scaling-stroke">
            <path d="M-40 640 C 300 560, 520 760, 820 600 S 1260 420, 1500 520" />
            <path d="M-40 720 C 260 700, 560 820, 900 700 S 1300 600, 1500 660" />
            <path d="M-40 560 C 360 420, 600 620, 940 460 S 1280 260, 1500 300" />
          </g>
        </svg>
      </div>

      <div className="mx-auto grid w-[min(1440px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-6 pb-[72px] pt-[120px] lg:min-h-[100svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        <div>
          <h1 className="m-0 font-display text-[clamp(38px,11vw,56px)] leading-[0.98] sm:text-[clamp(44px,5.2vw,92px)]">
            <span className="block overflow-clip pb-[0.08em]">
              <motion.span className="block" {...rise(0.1)}>
                Find EV chargers
              </motion.span>
            </span>
            <span className="block overflow-clip pb-[0.08em]">
              <motion.span className="block" {...rise(0.22)}>
                across <em className="pg-bold not-italic text-volt">Pakistan.</em>
              </motion.span>
            </span>
          </h1>

          <motion.form
            role="search"
            onSubmit={onSubmit}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.45 }}
            className="relative mt-11 flex max-w-[620px] flex-wrap items-center gap-2 rounded-[26px] bg-white p-2 shadow-volt-lg sm:h-[68px] sm:flex-nowrap sm:rounded-full sm:pl-[54px]"
          >
            <SearchGlyph className="absolute left-[22px] top-[25px] h-5 w-5 text-[#8a8e95] sm:top-auto" />
            <label htmlFor="home-search" className="sr-only">
              Search city, area or charging station
            </label>
            <input
              id="home-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city, area or charging station..."
              className="h-[52px] min-w-0 flex-1 basis-full bg-transparent pl-10 text-base text-ink outline-none placeholder:text-[#8a8e95] sm:h-full sm:basis-auto sm:pl-0"
            />
            <button
              type="submit"
              className="group/btn inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-[22px] text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-volt hover:text-ink sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </g>
              </svg>
              Find chargers
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] transition-transform duration-300 ease-spring group-hover/btn:translate-x-1" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.form>
        </div>

        {/* The stage: the glowing map, the real pins, and the phone. */}
        <div aria-hidden="true" className="relative -mx-2 h-[560px] sm:mx-0 sm:h-[600px] lg:h-[min(78vh,760px)] lg:min-h-[560px]">
          <svg viewBox="0 0 1000 811" className="absolute right-0 top-1/2 w-full -translate-y-1/2 overflow-visible lg:-right-[12%] lg:w-[104%]">
            <defs>
              <radialGradient id="hmapFill" cx="62%" cy="35%" r="70%">
                <stop offset="0" stopColor="#1d2318" />
                <stop offset="1" stopColor="#101214" />
              </radialGradient>
              <filter id="hmapGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <pattern id="hmapDots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="rgba(212,255,58,.16)" />
              </pattern>
            </defs>
            <motion.path
              d={PK_PATH}
              fill="url(#hmapFill)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            />
            <path d={PK_PATH} fill="url(#hmapDots)" />
            <motion.path
              d={PK_PATH}
              fill="none"
              stroke="rgba(212,255,58,.55)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
              filter="url(#hmapGlow)"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.4, ease: EASE_OUT, delay: 0.3 }}
            />
            <path d={ROUTE_D} fill="none" stroke="rgba(212,255,58,.5)" strokeWidth="2.2" strokeDasharray="3 7" strokeLinecap="round" />
            {reduce ? null : (
              <motion.path
                d={ROUTE_D}
                fill="none"
                stroke="#D4FF3A"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#hmapGlow)"
                initial={{ pathLength: 0.12, pathOffset: 0 }}
                animate={{ pathOffset: [0, 0.88] }}
                transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6, delay: 1.6 }}
              />
            )}
            {dots.map((dot, i) => (
              <motion.circle
                key={dot.slug}
                cx={dot.x}
                cy={dot.y}
                r="4.5"
                fill="#D4FF3A"
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 1 + i * 0.02 }}
                style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
              />
            ))}
            {(
              [
                ['Islamabad', IX, IY],
                ['Lahore', LX, LY],
              ] as const
            ).map(([name, x, y]) => (
              <g key={name}>
                <circle cx={x} cy={y} r="13" fill="none" stroke="#D4FF3A" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="5" fill="#D4FF3A" />
                <text x={x + 20} y={y + 5} className="fill-white/70 font-sans text-[15px] font-medium">
                  {name}
                </text>
              </g>
            ))}
          </svg>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 60, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.5 }}
            className="absolute left-1/2 top-1/2 -ml-[146px] -mt-[300px] scale-[0.86] sm:scale-100 lg:left-[-2%] lg:ml-0 [@media(min-width:1024px)_and_(max-height:820px)]:scale-[0.84]"
          >
            <Phone className="relative">
              <StatusBar />
              <div className="flex items-center justify-between px-1 pb-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <LogoMark className="h-4 w-4" />
                  <span className="pg-bold font-display text-[13px]">
                    plug<span className="text-volt">pk</span>
                  </span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/70">
                  <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="relative flex h-[76px] items-center gap-2.5 overflow-hidden rounded-2xl bg-[#181B1F] p-3">
                <div className="relative z-[1] flex h-9 w-5 items-end rounded-[5px] border-[1.5px] border-volt p-0.5">
                  <i className="block h-[72%] w-full rounded-sm bg-volt" />
                </div>
                <div className="relative z-[1]">
                  <b className="font-mono text-xl">72%</b>
                  <small className="block text-[9px] text-white/55">
                    Estimated range
                    <br />
                    210 km
                  </small>
                </div>
                <Image
                  src="/images/home/v2/dusk-ev.jpg"
                  alt=""
                  width={180}
                  height={76}
                  className="absolute -right-6 top-0 h-full w-[60%] object-cover opacity-55 [mask-image:linear-gradient(90deg,transparent,#000_50%)]"
                />
              </div>
              <div className="mt-2 flex items-center gap-2.5 rounded-[14px] bg-[#181B1F] px-3 py-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-volt">
                  <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="6" cy="19" r="2" />
                    <circle cx="18" cy="5" r="2" />
                    <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
                  </g>
                </svg>
                <div>
                  <b className="block text-[11px]">Lahore → Islamabad</b>
                  <small className="block text-[9px] text-white/55">Plan a trip around your range</small>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.08] px-3 py-2.5 text-[9.5px] text-white/50">
                <span>Search chargers, cities or services...</span>
                <SearchGlyph className="h-[13px] w-[13px]" />
              </div>
              <div className="relative mt-2 h-[150px] overflow-hidden rounded-[14px] bg-[radial-gradient(120%_90%_at_60%_30%,#1d2a1c,#111417)]">
                <svg viewBox="0 0 260 150" preserveAspectRatio="none" className="h-full w-full">
                  <g stroke="rgba(255,255,255,.07)" strokeWidth="1">
                    <path d="M0 30h260M0 80h260M0 120h260M40 0v150M110 0v150M190 0v150M0 10 260 140M260 20 70 150" />
                  </g>
                  <path d="M150 22 C 120 60, 90 40, 92 70 S 140 120, 175 132" fill="none" stroke="#D4FF3A" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="150" cy="22" r="5" fill="#D4FF3A" />
                  <circle cx="175" cy="132" r="5" fill="#fff" />
                </svg>
                <span className="absolute left-[62%] top-[8%] text-[9px] font-semibold">Islamabad</span>
                <span className="absolute left-[70%] top-[80%] text-[9px] font-semibold">Lahore</span>
              </div>
              {fastest ? (
                <div className="mt-2 flex items-center gap-2.5 rounded-[14px] bg-[#181B1F] px-3 py-2.5">
                  <Image src="/images/home/v2/plug-closeup.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-[9px] object-cover" />
                  <div className="min-w-0">
                    <b className="block truncate text-[11px]">{fastest.name}</b>
                    <small className="block text-[9px] text-white/55">
                      {Math.round(fastest.maxPowerKw)} kW · {fastest.city}
                    </small>
                    <small className="block text-[9px] text-white/55">
                      {fastest.ports} {fastest.ports === 1 ? 'port' : 'ports'} installed
                    </small>
                  </div>
                </div>
              ) : null}
              <div className="mt-2 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-volt text-[11px] font-bold text-ink">
                <NavArrow className="h-3 w-3" />
                Start Navigation
              </div>
              <PhoneTabs on="Home" />
            </Phone>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/** The volt band of city names that runs under the hero. Decorative. */
export function CityTicker({ cities }: { cities: readonly string[] }) {
  /* Each copy carries its own trailing gap, so -50% lands exactly on the seam. */
  const row = (
    <div className="flex items-center gap-9 pr-9">
      {cities.map((city) => (
        <React.Fragment key={city}>
          <span>{city}</span>
          <BoltFill className="h-[26px] w-[26px]" />
        </React.Fragment>
      ))}
    </div>
  )
  return (
    <div aria-hidden="true" data-theme="light" className="relative z-[2] overflow-hidden bg-volt py-[18px] text-ink">
      <div className="pg-bold flex w-max animate-marquee font-display text-[clamp(28px,3.4vw,46px)] leading-none motion-reduce:animate-none [animation-duration:30s]">
        {row}
        {row}
      </div>
    </div>
  )
}
