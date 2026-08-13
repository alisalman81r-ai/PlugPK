// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { PAKISTAN_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Enough to start from without turning the hero into a filter panel. */
const QUICK_CITIES = PAKISTAN_CITIES.slice(0, 3)

/** How far the layers travel, in pixels, at the far edge of the frame. */
const DEPTH_IMAGE = 14
const DEPTH_CONTENT = -22

export function Hero() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const frameRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  const go = (value: string) => {
    const trimmed = value.trim()
    router.push(trimmed ? `/map?q=${encodeURIComponent(trimmed)}` : '/map')
  }

  /**
   * Real 3D, not a fake shadow: the frame gets a perspective, and the photo
   * and the text sit on different Z planes, so moving the pointer parallaxes
   * them against each other rather than sliding a flat picture around.
   *
   * Guarded three ways. Pointer events only fire for a real pointer, so touch
   * devices never run it. A coarse-pointer or reduced-motion preference exits
   * before any listener is attached. And the transform is written straight to
   * the element rather than through state, so a mouse move never triggers a
   * React render — the whole effect stays on the compositor.
   */
  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return

    let raf = 0

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = frame.getBoundingClientRect()
        // -1 .. 1 from the centre of the frame.
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        setTilt({ x: x * 2, y: y * 2 })
      })
    }

    const onLeave = () => {
      cancelAnimationFrame(raf)
      setTilt({ x: 0, y: 0 })
    }

    frame.addEventListener('pointermove', onMove)
    frame.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      frame.removeEventListener('pointermove', onMove)
      frame.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="bg-white px-3 pb-6 pt-[84px] sm:px-4 sm:pb-10 lg:px-6">
      {/* The frame is the stage. `perspective` here is what makes the
          translateZ on the children read as depth rather than as scale. */}
      <div
        ref={frameRef}
        className="relative isolate mx-auto min-h-[540px] max-w-[1600px] overflow-hidden rounded-[20px] [perspective:1200px] sm:min-h-[600px] lg:min-h-[calc(100dvh-108px)] lg:rounded-[28px]"
      >
        {/* Layer 1 — the photograph, pushed back and scaled slightly so its
            edges never expose the frame as it parallaxes. */}
        <div
          aria-hidden="true"
          style={{
            transform: `translate3d(${tilt.x * DEPTH_IMAGE}px, ${tilt.y * DEPTH_IMAGE}px, 0) scale(1.06)`,
          }}
          className="absolute inset-0 -z-10 transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
        >
          <Image
            src="/images/stations/gulberg-charging-station-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Layer 2 — legibility. Weighted to the bottom, where the text sits,
            so the top of the photograph stays open. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/45 via-slate-950/30 to-slate-950/80"
        />

        {/* Layer 3 — content, pulled forward. */}
        <div
          style={{
            transform: `translate3d(${tilt.x * DEPTH_CONTENT}px, ${tilt.y * DEPTH_CONTENT}px, 0)`,
          }}
          className="relative flex min-h-[540px] flex-col items-center justify-end px-5 pb-12 text-center transition-transform duration-[400ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none sm:min-h-[600px] sm:pb-16 lg:min-h-[calc(100dvh-108px)] lg:pb-20"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-cyan-300 motion-reduce:animate-none"
            />
            Live across 18 cities
          </span>

          <h1 className="max-w-4xl text-balance text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            Every charger in Pakistan, on one map
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 sm:text-lg">
            Live port availability, connector types, and reviews from drivers who
            actually charged there.
          </p>

          {/* One control, shaped like a single button. Electra's hero has a
              pill that goes to a search page; this is that pill with the
              search already in it, so the visitor's intent travels with them
              instead of being re-asked for on arrival. */}
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              go(query)
            }}
            className="mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 pl-5 shadow-e4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/45 focus-within:bg-white/[0.16]"
          >
            <Search size={18} className="shrink-0 text-white/70" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a city or station"
              aria-label="Search for a charging station by city or name"
              className="min-w-0 flex-1 border-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-white/55 [&::-webkit-search-cancel-button]:appearance-none"
            />
            <button
              type="submit"
              className="group/go inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-ui font-semibold text-slate-950 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 motion-reduce:transition-none"
            >
              <MapPin size={16} className="shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Find a station</span>
              <span className="sm:hidden">Go</span>
              <ArrowRight
                size={15}
                className="hidden shrink-0 transition-transform duration-200 group-hover/go:translate-x-0.5 motion-reduce:transition-none sm:block"
                aria-hidden="true"
              />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-ui-xs text-white/55">Popular</span>
            {QUICK_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => go(city)}
                className={cn(
                  'rounded-full border border-white/20 bg-black/20 px-3 py-1 text-ui-xs font-medium text-white/80 backdrop-blur-sm',
                  'transition-colors duration-150 hover:border-white/40 hover:bg-black/35 hover:text-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-[1600px] justify-center lg:mt-6">
        <Link
          href="/routes"
          className="group/link inline-flex items-center gap-2 text-ui-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-4"
        >
          Driving between cities? Plan a route with charging stops
          <ArrowRight
            size={15}
            className="shrink-0 transition-transform duration-200 group-hover/link:translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  )
}
