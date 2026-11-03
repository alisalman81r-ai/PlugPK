// src/components/home/v2/HomeHero.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { LogoMark } from '@/components/ui/Logo'
import type { HeroMapPin } from '@/lib/charging'
import { finePointer, gsap, prefersReduced, ScrollTrigger, SplitText } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { onIntro } from './Loader'
import { BoltFill, NavArrow, Phone, PhoneTabs, SearchGlyph, StatusBar } from './Phone'
import { M2_PATH, PK_CITIES, PK_PATH } from './pk-geo'

/**
 * The landing-v2 hero, with main.js's motion ported line for line:
 *
 *   intro    title chars rise (yPercent 115, rotate 6, stagger .022), the search
 *            pill lands on "jelly", the land fades in, the glowing edge draws
 *            (DrawSVG, 2.2s), the pins pop (back.out(3)), the route fades in and
 *            the phone swings in on elastic.out(1,.75)
 *   idle     an energy pulse runs the M-2 forever, pin rings ripple, the phone
 *            drifts, and "Pakistan." zaps every 2.4–4.2s (and on hover); all of
 *            it pauses once the hero has scrolled away
 *   pointer  the map slides and the phone tilts toward the mouse
 *   scroll   copy and stage drift up and fade as the hero leaves
 *
 * The intro waits for the preloader (Loader.onIntro). The search is the real
 * one: it opens the map searched for what was typed. The pins mark the design's
 * cities that have at least one real station on plugpk, and the phone's station
 * card shows the network's fastest real station.
 */

/** The design's hero pins, in its order; only those with a real station are drawn. */
const PIN_CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad']
const LABELLED = new Set(['Islamabad', 'Lahore'])

export function HomeHero({ pins }: { pins: HeroMapPin[] }) {
  const router = useRouter()
  const rootRef = React.useRef<HTMLElement>(null)
  const [query, setQuery] = React.useState('')

  const fastest = React.useMemo(
    () => [...pins].sort((a, b) => b.maxPowerKw - a.maxPowerKw || b.ports - a.ports)[0] ?? null,
    [pins],
  )
  const cities = React.useMemo(() => {
    const withStations = new Set(pins.map((p) => p.city.toLowerCase()))
    return PIN_CITIES.filter((c) => withStations.has(c.toLowerCase()))
  }, [pins])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/map?q=${encodeURIComponent(q)}` : '/map')
  }

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = prefersReduced()
    const fine = finePointer()
    const q = <T extends Element = Element>(s: string) => root.querySelector<T>(s)!
    const qa = (s: string) => [...root.querySelectorAll(s)]
    let split: SplitText | null = null
    let idleStarted = false
    let delayed: gsap.core.Tween | null = null

    const ctx = gsap.context((self) => {
      const jword = q<HTMLElement>('.jitter-word')
      const zap = () =>
        gsap
          .timeline()
          .to(jword, {
            duration: 0.04,
            x: () => gsap.utils.random(-3, 3),
            skewX: () => gsap.utils.random(-10, 10),
            textShadow: '0 0 18px rgba(212,255,58,.9), 2px 0 0 #FF5A1F',
            repeat: 6,
            yoyo: true,
            ease: 'steps(1)',
          })
          .set(jword, { x: 0, skewX: 0, textShadow: '0 0 0 rgba(0,0,0,0)' })
      const jitterLoop = () => {
        delayed = gsap.delayedCall(gsap.utils.random(2.4, 4.2), () => {
          zap()
          jitterLoop()
        })
      }
      const onZap = () => {
        if (!reduce) zap()
      }
      jword.addEventListener('mouseenter', onZap)

      gsap.set('.hmap__pulse', { autoAlpha: 0 })

      if (reduce) return

      split = new SplitText(qa('.hero__title .line'), { type: 'words,chars', wordsClass: 'wd', charsClass: 'ch' })
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      intro
        .from(split.chars, { yPercent: 115, rotate: 6, duration: 1.2, stagger: 0.022 }, 0)
        .from('.hsearch', { y: 30, scale: 0.94, autoAlpha: 0, duration: 1.1, ease: 'jelly' }, 0.45)
        .from('.hmap__land, .hmap__dots', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, 0.2)
        .from('.hmap__edge', { drawSVG: '0%', duration: 2.2, ease: 'power2.inOut' }, 0.2)
        .from('.hpin', { scale: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(3)', stagger: 0.09 }, 1.1)
        .from('.hmap__route', { autoAlpha: 0, duration: 0.8 }, 1.5)
        .from('.phone--hero', { y: 160, rotate: 10, autoAlpha: 0, duration: 1.6, ease: 'elastic.out(1, .75)' }, 0.5)
      // Held at its first frame until the loader hands over.
      intro.progress(0)

      const startIdle = () => {
        if (idleStarted) return
        idleStarted = true
        gsap.fromTo('.hmap__pulse', { drawSVG: '0% 0%' }, { drawSVG: '88% 100%', duration: 2.6, ease: 'power1.inOut', repeat: -1, repeatDelay: 0.6 })
        gsap.set('.hmap__pulse', { autoAlpha: 1 })
        qa('.hpin__ring').forEach((ring, i) =>
          gsap.fromTo(ring, { scale: 1, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 3, opacity: 0, duration: 2, repeat: -1, delay: i * 0.35, ease: 'power2.out' }),
        )
        gsap.to('.phone--hero', { y: -12, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        jitterLoop()
        // pause every hero loop once the hero has scrolled away
        const loops = gsap.getTweensOf(['.hmap__pulse', '.hpin__ring', '.phone--hero'])
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          onToggle: (s) => loops.forEach((t) => (s.isActive ? t.resume() : t.pause())),
        })
      }
      const stop = onIntro(() => {
        self.add(() => {
          intro.play().then(startIdle)
        })
      })
      self.add(() => () => stop())

      /* depth: the map slides, the phone tilts */
      if (fine) {
        const mapX = gsap.quickTo('.hmap', 'xPercent', { duration: 1.2, ease: 'power3' })
        const mapY = gsap.quickTo('.hmap', 'yPercent', { duration: 1.2, ease: 'power3' })
        gsap.set('.phone--hero', { transformPerspective: 1000 })
        const rx = gsap.quickTo('.phone--hero', 'rotationX', { duration: 1.2, ease: 'power3' })
        const ry = gsap.quickTo('.phone--hero', 'rotationY', { duration: 1.2, ease: 'power3' })
        const onMove = (e: MouseEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          mapX((-nx * 14) / 8)
          mapY((-ny * 14) / 8)
          ry(nx * 14)
          rx(-ny * 10)
        }
        root.addEventListener('mousemove', onMove)
        self.add(() => () => root.removeEventListener('mousemove', onMove))
      }

      /* scroll-out */
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero__copy', { yPercent: -18, autoAlpha: 0.2, ease: 'none', force3D: true }, 0)
        .to('.hero__stage', { yPercent: -10, autoAlpha: 0.35, ease: 'none', force3D: true }, 0)

      self.add(() => () => jword.removeEventListener('mouseenter', onZap))
    }, root)

    return () => {
      delayed?.kill()
      ctx.revert()
      split?.revert()
    }
  }, [])

  return (
    <section
      ref={rootRef}
      data-theme="dark"
      className="hero relative isolate -mt-[var(--nav-h)] min-h-[100svh] overflow-hidden bg-ink text-white"
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

      <div className="mx-auto grid min-h-[100svh] w-[min(1440px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-6 pb-[72px] pt-[120px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        <div className="hero__copy">
          <h1 className="hero__title m-0 font-display text-[clamp(38px,11vw,56px)] leading-[0.98] sm:text-[clamp(44px,5.2vw,92px)]">
            <span className="line block overflow-clip pb-[0.08em] [&_.wd]:whitespace-nowrap">Find EV chargers</span>
            <span className="line block overflow-clip pb-[0.08em] [&_.wd]:whitespace-nowrap">
              across{' '}
              <em className="jitter-word pg-bold inline-block not-italic text-volt">Pakistan.</em>
            </span>
          </h1>

          <form
            role="search"
            onSubmit={onSubmit}
            className="hsearch relative mt-11 flex max-w-[620px] flex-wrap items-center gap-2 rounded-[26px] bg-white p-2 shadow-volt-lg sm:h-[68px] sm:flex-nowrap sm:rounded-full sm:pl-[54px]"
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
              data-magnetic=""
              className="group/btn inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-[22px] text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-volt hover:text-ink sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </g>
              </svg>
              Find chargers
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] transition-transform duration-[350ms] ease-spring group-hover/btn:translate-x-1" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>

        {/* The stage: the glowing map, the pins, and the phone. */}
        <div aria-hidden="true" className="hero__stage relative -mx-2 h-[560px] will-change-transform sm:mx-0 sm:h-[600px] lg:h-[min(78vh,760px)] lg:min-h-[560px] [@media(min-width:1024px)_and_(max-height:820px)]:h-[80vh] [@media(min-width:1024px)_and_(max-height:820px)]:min-h-0">
          <svg
            viewBox="0 0 1000 811"
            className="hmap absolute right-0 top-1/2 w-full overflow-visible [translate:0_-50%] lg:-right-[12%] lg:w-[104%]"
          >
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
            <path className="hmap__land" d={PK_PATH} fill="url(#hmapFill)" />
            <path className="hmap__dots" d={PK_PATH} fill="url(#hmapDots)" />
            <path
              className="hmap__edge"
              d={PK_PATH}
              fill="none"
              stroke="rgba(212,255,58,.55)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
              filter="url(#hmapGlow)"
            />
            <path className="hmap__route" d={M2_PATH} fill="none" stroke="rgba(212,255,58,.5)" strokeWidth="2.2" strokeDasharray="3 7" strokeLinecap="round" />
            <path className="hmap__pulse" d={M2_PATH} fill="none" stroke="#D4FF3A" strokeWidth="3.5" strokeLinecap="round" filter="url(#hmapGlow)" />
            <g>
              {cities.map((name) => {
                const [x, y] = PK_CITIES[name]!
                return (
                  <g key={name} className="hpin">
                    <circle className="hpin__ring" cx={x} cy={y} r="10" fill="none" stroke="#D4FF3A" strokeWidth="1.5" />
                    <circle cx={x} cy={y} r="6" fill="#D4FF3A" />
                    {LABELLED.has(name) ? (
                      <text x={x + 16} y={y + 5} className="fill-white/70 font-sans text-[15px] font-medium">
                        {name}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </g>
          </svg>

          <Phone
            className={cn(
              'phone--hero z-[2] [rotate:-4deg]',
              'left-1/2 top-1/2 [translate:-50%_-50%] max-sm:[scale:.86] lg:left-[-2%] lg:[translate:0_-50%]',
              '[@media(min-width:1024px)_and_(max-height:820px)]:[scale:.84]',
            )}
          >
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
                <small className="block text-[9px] text-white/55">4h 41m · 375 km</small>
              </div>
              <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 -rotate-90 text-white/40">
                <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
                  <small className="block text-[9px] text-white/55">{Math.round(fastest.maxPowerKw)} kW</small>
                  <small className="block text-[9px] text-white/55">
                    {fastest.ports} {fastest.ports === 1 ? 'port' : 'ports'} installed
                  </small>
                </div>
                <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 -rotate-90 text-white/40">
                  <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
            <div className="mt-2 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-volt text-[11px] font-bold text-ink">
              <NavArrow className="h-3 w-3" />
              Start Navigation
            </div>
            <PhoneTabs on="Home" />
          </Phone>
        </div>
      </div>
    </section>
  )
}

/**
 * The volt band of city names under the hero (main.js TICKER). It loops at a
 * 28s pace, and scroll velocity speeds it up, reverses it with the scroll
 * direction and skews the type; both ease back once scrolling stops.
 */
export function CityTicker({ cities }: { cities: readonly string[] }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const band = ref.current
    if (!band || prefersReduced()) return
    const track = band.querySelector<HTMLElement>('.ticker__track')!
    const ctx = gsap.context(() => {
      const tick = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
      const setSkew = gsap.quickSetter(track, 'skewX', 'deg')
      let target = 1
      let dir = 1
      let vel = 0
      let ts = 1
      let sk = 0
      ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          vel = self.getVelocity()
          dir = self.direction
        },
        onToggle: (self) => (self.isActive ? tick.resume() : tick.pause()),
      })
      const onTick = () => {
        if (tick.paused()) return
        target = dir * (1 + Math.min(Math.abs(vel) / 300, 5))
        vel *= 0.9
        ts += (target - ts) * 0.1
        tick.timeScale(ts)
        const s = gsap.utils.clamp(-12, 12, -vel / 180)
        if (Math.abs(s - sk) > 0.01) {
          sk += (s - sk) * 0.15
          setSkew(sk)
        }
      }
      gsap.ticker.add(onTick)
      return () => gsap.ticker.remove(onTick)
    }, band)
    return () => ctx.revert()
  }, [])

  const row = cities.flatMap((city) => [
    <span key={city}>{city}</span>,
    <BoltFill key={`${city}-bolt`} className="h-[26px] w-[26px]" />,
  ])
  return (
    <div ref={ref} aria-hidden="true" data-theme="light" className="relative z-[2] overflow-hidden bg-volt py-[18px] text-ink">
      <div className="ticker__track pg-bold flex w-max items-center gap-9 font-display text-[clamp(28px,3.4vw,46px)] leading-none">
        {row}
        {cities.flatMap((city) => [
          <span key={`b-${city}`}>{city}</span>,
          <BoltFill key={`b-${city}-bolt`} className="h-[26px] w-[26px]" />,
        ])}
      </div>
    </div>
  )
}
