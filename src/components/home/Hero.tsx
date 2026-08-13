// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search, Star } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface HeroProps {
  /** Counted from the database by the page — never asserted. */
  stations: number
  cities: number
  portsFree: number
  portsTotal: number
  /** The best-rated station, used for the strip along the bottom. */
  topRating: number
  topReviewCount: number
}

/**
 * Fixed positions, so the specks are identical on the server and the client.
 * Math.random() here would produce a different layout in each and React would
 * report a hydration mismatch.
 */
const SPECKS = [
  { left: '12%', top: '22%', size: 4, depth: 26 },
  { left: '23%', top: '64%', size: 3, depth: 18 },
  { left: '34%', top: '38%', size: 5, depth: 34 },
  { left: '68%', top: '28%', size: 4, depth: 30 },
  { left: '79%', top: '58%', size: 6, depth: 22 },
  { left: '88%', top: '34%', size: 3, depth: 38 },
  { left: '60%', top: '74%', size: 4, depth: 16 },
]

export function Hero({
  stations,
  cities,
  portsFree,
  portsTotal,
  topRating,
  topReviewCount,
}: HeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  const go = (value: string) => {
    const trimmed = value.trim()
    router.push(trimmed ? `/map?q=${encodeURIComponent(trimmed)}` : '/map')
  }

  /** Same guards as every other 3D surface on the site. */
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
    <section
      ref={stageRef}
      className="relative flex min-h-viewport flex-col overflow-hidden bg-[#0B0B0D] pt-[72px]"
    >
      {/* Warm pool under the unit, so it reads as lit rather than pasted on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[46%] h-[620px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(56,189,248,0.20),rgba(37,99,235,0.10)_45%,transparent_72%)]"
      />

      {/* Specks, drifting against the pointer at their own depths. */}
      {SPECKS.map((speck) => (
        <span
          key={`${speck.left}-${speck.top}`}
          aria-hidden="true"
          style={{
            left: speck.left,
            top: speck.top,
            width: speck.size,
            height: speck.size,
            transform: `translate3d(${tilt.x * speck.depth}px, ${tilt.y * speck.depth}px, 0)`,
          }}
          className="pointer-events-none absolute hidden rounded-full bg-cyan-200/50 blur-[1px] transition-transform duration-[500ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none lg:block"
        />
      ))}

      <div className="container-plug relative flex flex-1 flex-col">
        {/* ── Type + unit ──────────────────────────────────────────
            The wordmark sits behind and the photograph in front, so the
            unit breaks the word — the type continues either side of it.
            The reference achieves this with a cut-out product on black;
            no such asset exists for EV hardware in stock photography, so
            the frame does the same job with a real photograph. */}
        <div className="relative flex flex-1 items-center justify-center py-10 lg:py-0">
          <h1
            style={{ transform: `translate3d(${tilt.x * -14}px, ${tilt.y * -8}px, 0)` }}
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-[58%] select-none text-center font-black leading-[0.8] tracking-[-0.045em] text-[#EDE7DA] transition-transform duration-[500ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
          >
            <span className="block text-[clamp(3.5rem,17vw,13rem)]">CHARGING</span>
          </h1>

          <div
            style={{ transform: `translate3d(${tilt.x * 22}px, ${tilt.y * 14}px, 0)` }}
            className="relative z-10 transition-transform duration-[500ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
          >
            <div className="relative h-[300px] w-[190px] overflow-hidden rounded-[80px] shadow-[0_40px_90px_rgba(0,0,0,0.65)] ring-1 ring-white/10 sm:h-[380px] sm:w-[240px] lg:h-[500px] lg:w-[310px]">
              <Image
                src="/images/stations/dha-charging-hub-3.jpg"
                alt="A public charging pillar"
                fill
                priority
                sizes="(max-width: 640px) 190px, (max-width: 1024px) 240px, 310px"
                className="object-cover object-center"
              />
              {/* Feathers the base into the ground so the frame does not read
                  as a photo pasted over the type. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0B0D]"
              />
            </div>
          </div>
        </div>

        {/* ── Copy and search ─────────────────────────────────────── */}
        <div className="relative z-20 pb-8 lg:pb-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="max-w-xs text-pretty text-[15px] leading-relaxed text-white/55">
                Every public charger in Pakistan, with live port availability and reviews
                from drivers who actually charged there.
              </p>

              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  go(query)
                }}
                className="mt-6 flex w-full max-w-md items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] p-1.5 pl-5 backdrop-blur-xl transition-colors duration-200 focus-within:border-cyan-300/50 focus-within:bg-white/[0.1]"
              >
                <Search size={17} className="shrink-0 text-white/45" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a city or station"
                  aria-label="Search for a charging station by city or name"
                  className="min-w-0 flex-1 border-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-white/40 [&::-webkit-search-cancel-button]:appearance-none"
                />
                <button
                  type="submit"
                  className="group/go inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#EDE7DA] px-5 text-ui font-semibold text-[#0B0B0D] transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D] motion-reduce:transition-none"
                >
                  <MapPin size={15} className="shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Find a charger</span>
                  <span className="sm:hidden">Go</span>
                  <ArrowRight
                    size={14}
                    className="hidden shrink-0 transition-transform duration-200 group-hover/go:translate-x-0.5 motion-reduce:transition-none sm:block"
                    aria-hidden="true"
                  />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom strip ──────────────────────────────────────────
          The reference runs a claim bar here. Every figure below is
          counted from the database instead, so none of it can drift out
          of step with the product. */}
      <div className="relative z-20 border-t border-white/10">
        <dl className="container-plug grid grid-cols-2 divide-x divide-white/10 lg:grid-cols-4">
          <div className="flex items-center gap-3 py-5 pr-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-ui-xs font-bold text-white/70">
              {topRating.toFixed(1)}
            </span>
            <div className="min-w-0">
              <dd className="flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={11}
                    className={
                      index < Math.round(topRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-white/20'
                    }
                  />
                ))}
              </dd>
              <dt className="mt-1 truncate text-ui-xs text-white/45">
                {topReviewCount} driver reviews
              </dt>
            </div>
          </div>

          <div className="py-5 pl-5 lg:px-5">
            <dd className="font-mono text-xl font-bold text-white">{stations}</dd>
            <dt className="mt-0.5 text-ui-xs text-white/45">
              Station{stations === 1 ? '' : 's'} listed
            </dt>
          </div>

          <div className="border-t border-white/10 py-5 pr-5 lg:border-t-0 lg:px-5">
            <dd className="font-mono text-xl font-bold text-white">{cities}</dd>
            <dt className="mt-0.5 text-ui-xs text-white/45">
              Cit{cities === 1 ? 'y' : 'ies'} covered
            </dt>
          </div>

          <div className="border-t border-white/10 py-5 pl-5 lg:border-t-0 lg:px-5">
            <dd className="font-mono text-xl font-bold text-white">
              {portsFree}
              <span className="text-white/30">/{portsTotal}</span>
            </dd>
            <dt className="mt-0.5 text-ui-xs text-white/45">Ports free now</dt>
          </div>
        </dl>
      </div>
    </section>
  )
}
