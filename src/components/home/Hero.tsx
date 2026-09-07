// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { HeroBackdrop } from './HeroBackdrop'

/** Enough to start from without turning the hero into a filter panel. */
const QUICK_CITIES = POPULAR_CITIES.slice(0, 3)

interface HeroProps {
  /**
   * Cities that actually have a station on the platform — counted from the
   * database, not from the list of cities somebody could pick from. This was
   * a hardcoded "18", which was a coverage claim nothing backed up.
   */
  cities: number
}

export function Hero({ cities }: HeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')

  const go = (value: string) => {
    const trimmed = value.trim()
    router.push(trimmed ? `/map?q=${encodeURIComponent(trimmed)}` : '/map')
  }

  /*
   * The pointer parallax that used to live here is gone. It tilted the photo
   * and the headline against each other on mouse move, so the words were never
   * quite still while you were reading them. A hero's job is to be read.
   */

  return (
    <section className="bg-white px-3 pb-6 pt-[84px] sm:px-4 sm:pb-10 lg:px-6">
      {/* The frame. Fixed layers — nothing in here moves. */}
      <div className="relative isolate mx-auto min-h-[540px] max-w-[1600px] overflow-hidden rounded-[20px] sm:min-h-[600px] lg:min-h-[calc(100dvh-108px)] lg:rounded-[28px]">
        {/* Layer 1 — the backdrop. A video once there is one, the photograph
            until then. See HeroBackdrop for what the footage wants to be. */}
        <HeroBackdrop />
        {/*
          Layer 2 — legibility, shaped rather than flat.

          The content is centred, so the scrim has to be densest along the
          bottom where the words are. A flat bottom-to-top wash does that, and
          it is what this had originally — but it takes the whole lower half of
          the frame with it, and the lower half is where the car, the connector
          and the light across the bodywork are.

          Two layers instead. A vertical wash carrying most of the weight, and
          an ellipse anchored to the bottom centre that adds density only where
          the words actually sit. The lower corners stay lighter than a flat
          wash would leave them, which is what keeps the wheel and the bodywork
          readable while the type still has its ground.
        */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-plug-navy-950/25" />
        {/*
          The phone stops are not a scaled copy of the desktop ones, and that
          was found by measuring rather than by looking.

          A tall narrow frame pushes the headline well above the point a
          bottom-anchored wash still has any weight. Measured on the rendered
          pixels with the desktop values applied at both widths, the accent line
          came out at 6.77:1 at 1440 and 4.24:1 at 390 — the same colour, the
          same type size relative to the frame, less than two thirds of the
          contrast. Holding density through the upper band on small screens
          brings it back. It costs some of the photograph on a phone, where the
          frame is mostly cropped away regardless.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(2,16,36,0.92)_0%,rgba(2,16,36,0.84)_30%,rgba(2,16,36,0.68)_62%,rgba(2,16,36,0.40)_100%)] sm:bg-[linear-gradient(to_top,rgba(2,16,36,0.90)_0%,rgba(2,16,36,0.76)_26%,rgba(2,16,36,0.40)_54%,rgba(2,16,36,0.12)_78%,transparent_100%)]"
        />
        {/* The ellipse is the part that keeps the lower corners lighter than a
            flat wash would, so it is only worth having where there is width for
            a centre to be distinct from an edge. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden bg-[radial-gradient(125%_78%_at_50%_100%,rgba(2,16,36,0.60)_0%,rgba(2,16,36,0.32)_46%,transparent_76%)] sm:block"
        />

        {/*
          Layer 3 — content, centred and anchored to the foot.

          This was briefly left-aligned and vertically centred, which freed the
          right of the frame for the photograph. Centred is the asked-for
          composition and it is the better one here for a reason worth writing
          down: the search field is the only thing on this page a visitor can
          act on, and centred it sits directly under the headline on the
          frame's own axis rather than off to one side of it. A hero whose
          single control is off-axis makes the reader look for it.

          What the left-aligned pass was solving still had to be solved — the
          photograph being flattened to make room for text — and that is what
          the shaped scrim above does instead.
        */}
        <div className="relative flex min-h-[540px] flex-col items-center justify-end px-6 pb-14 pt-24 text-center sm:min-h-[600px] sm:pb-16 lg:min-h-[calc(100dvh-108px)] lg:pb-20">
          <div className="flex w-full max-w-[44rem] flex-col items-center">
            <span className="hero-rise hero-rise-1 mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.07] px-4 py-1.5 text-ui-xs font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,0.55)]"
              />
              {cities > 0
                ? `Live in ${cities} ${cities === 1 ? 'city' : 'cities'}`
                : 'Mapping Pakistan, city by city'}
            </span>

            {/*
              Set as three lines rather than left to wrap.

              Centred type makes this matter more, not less. A wrap breaks
              wherever the measure happens to fall, so the silhouette of a
              centred block changes with the viewport — and at several widths
              "on one map" ended up alone on a third line regardless. Set
              explicitly, the shape is a decision at every width: two long
              lines and a short one, symmetrical, with the short line carrying
              the idea and taking the accent.

              Spans rather than <br>, which a screen reader announces as a pause
              mid-sentence. These are block-level and read as one heading.
            */}
            <h1 className="text-[clamp(2.75rem,7vw,5.75rem)] font-black leading-[0.92] tracking-[-0.045em] text-white">
              <span className="hero-rise hero-rise-2 block">Every charger</span>
              <span className="hero-rise hero-rise-3 block">in Pakistan,</span>
              <span className="hero-rise hero-rise-4 block text-plug-sky-300">on one map.</span>
            </h1>

            <p className="hero-rise hero-rise-4 mt-7 max-w-[42ch] text-pretty text-lg leading-relaxed text-white/70 sm:text-xl">
              Connector types, charging speeds, and reviews from drivers who actually
              charged there.
            </p>

            {/* One control, shaped like a single button. The visitor's intent
                travels with them rather than being re-asked for on arrival. */}
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault()
                go(query)
              }}
              className="hero-rise hero-rise-5 mt-10 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/[0.09] p-1.5 pl-5 shadow-e4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/45 focus-within:bg-white/[0.16]"
            >
              <Search size={18} className="shrink-0 text-white/70" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a city or station"
                aria-label="Search for a charging station by city or name"
                className="field-glass min-w-0 flex-1 border-none bg-transparent py-2.5 text-[15px] text-white outline-none placeholder:text-white/55 [&::-webkit-search-cancel-button]:appearance-none"
              />
              <button
                type="submit"
                className="group/go inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-ui font-semibold text-plug-navy-950 transition-colors duration-200 hover:bg-plug-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-900 motion-reduce:transition-none"
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

            <div className="hero-rise hero-rise-5 mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-ui-xs uppercase tracking-[0.12em] text-white/45">Popular</span>
              {QUICK_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => go(city)}
                  className={cn(
                    'rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-medium text-white/80 backdrop-blur-sm',
                    'transition-colors duration-150 hover:border-white/40 hover:bg-white/[0.14] hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
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
