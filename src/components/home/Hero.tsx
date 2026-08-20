// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

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
        {/* Layer 1 — the photograph. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src="/images/stations/gulberg-charging-station-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/*
          Layer 2 — legibility, in two parts.

          A light wash over the whole frame, then a second gradient anchored to
          the bottom where the words actually sit. One gradient could not do
          both: dark enough for the text meant flattening the photograph, and
          light enough for the photograph meant the headline fighting the car's
          reflections for contrast.
        */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/25" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.80)_22%,rgba(2,6,23,0.45)_48%,rgba(2,6,23,0.12)_75%,transparent_100%)]"
        />

        {/* Layer 3 — content. */}
        <div className="relative flex min-h-[540px] flex-col items-center justify-end px-5 pb-12 text-center sm:min-h-[600px] sm:pb-16 lg:min-h-[calc(100dvh-108px)] lg:pb-20">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-cyan-300 motion-reduce:animate-none"
            />
            {cities > 0
              ? `Live in ${cities} ${cities === 1 ? 'city' : 'cities'}`
              : 'Mapping Pakistan, city by city'}
          </span>

          <h1 className="max-w-4xl text-balance text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_4px_30px_rgba(0,0,0,0.45)]">
            Every charger in Pakistan, on one map
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] sm:text-lg">
            Connector types, charging speeds, and reviews from drivers who actually
            charged there.
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
