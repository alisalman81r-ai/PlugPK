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
          Layer 2 — legibility, and it is directional now.

          The scrim used to run bottom-to-top across the full width, which meant
          the darkest part of the frame was the bottom half — the half holding
          the car. The photograph was being flattened to make room for text that
          only ever occupied the left of it.

          It runs left-to-right instead: heavy where the words are, clearing by
          the middle so the car, the connector and the light on the bodywork are
          all still there to be seen. A low wash from the foot catches the search
          control without taking the upper frame down with it.

          Below sm the columns collapse and the text sits over everything, so the
          vertical wash comes back — the same reason the layout stacks there
          rather than the same treatment applied at every width.
        */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-plug-navy-950/25" />
        <div
          aria-hidden="true"
          // The phone stop weights are not a scaled copy of the desktop ones.
          // With the columns collapsed the headline sits high in the frame,
          // which is exactly where a bottom-weighted wash is thinnest: measured
          // on the rendered pixels, the accent line came out at 4.29:1 against
          // its background at 390px while the same line measured 6.54:1 at
          // 1440. Holding more density through the upper two thirds takes it to
          // a comfortable margin. It costs some of the photograph on a phone,
          // where most of the frame is cropped away regardless.
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(2,16,36,0.94)_0%,rgba(2,16,36,0.86)_30%,rgba(2,16,36,0.72)_62%,rgba(2,16,36,0.45)_100%)] sm:bg-[linear-gradient(to_right,rgba(2,16,36,0.95)_0%,rgba(2,16,36,0.88)_28%,rgba(2,16,36,0.55)_52%,rgba(2,16,36,0.18)_74%,transparent_92%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-[linear-gradient(to_top,rgba(2,16,36,0.55),transparent)] sm:block"
        />

        {/*
          Layer 3 — content, left-aligned and vertically centred.

          It was a centred stack pinned to the bottom edge, which is the most
          common hero composition on the web and the reason this frame read as
          competent rather than as anything in particular. Anchoring it left and
          centring it vertically does two things at once: the type gets a column
          of its own instead of a full-width band, and the right of the frame is
          left to the photograph, which is the only part of this page nobody else
          has.
        */}
        <div className="relative flex min-h-[540px] flex-col justify-center px-6 py-16 sm:min-h-[600px] sm:px-10 lg:min-h-[calc(100dvh-108px)] lg:px-16">
          <div className="w-full max-w-[42rem]">
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

              A balanced wrap is right for a centred headline and wrong for this
              one: the break lands wherever the measure happens to fall, and at
              several widths "on one map" ends up alone on a third line anyway.
              Set explicitly, the ragged edge becomes a decision — long, long,
              short — and the short line is the one carrying the idea.

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

            <div className="hero-rise hero-rise-5 mt-5 flex flex-wrap items-center gap-2">
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
