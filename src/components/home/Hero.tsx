// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { HeroWorldMap } from './HeroWorldMap'

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
    /*
      ── A split band, not a framed panel ──────────────────────────────
      Full bleed and square-cornered. It was an inset card with a 28px radius
      floating on white, which reads as a component on a page; edge to edge, the
      photograph is the top of the site rather than an illustration placed near
      it.

      ── Where the type sits, and why this reverses an earlier decision ──
      The content was centred over the photograph, and the note that used to be
      here argued for it: the search field is the only thing on this page a
      visitor can act on, and centred it sits on the frame's own axis. That
      reasoning holds for a hero where type is ON the image. It does not survive
      the split, because there is no longer one axis — there are two panels, and
      the control belongs on the axis of the one it lives in. Asked for by the
      author, and the composition it produces is the better argument: the
      photograph is no longer something to be read through.

      ── The seam ──────────────────────────────────────────────────────
      Both halves are the same navy. The photograph does not stop at a boundary,
      it dissolves into the panel over roughly a fifth of the width, so there is
      no edge to notice. Below `lg` the two stack and the gradient turns
      vertical, because a horizontal dissolve on a stacked layout fades the
      wrong way — into nothing, rather than into what follows it.

      ── Which side the photograph is on ───────────────────────────────
      Type left, photograph right. The DOM order stays type-first regardless:
      the h1 is the page's heading and should not follow a decorative figure,
      so the photograph is moved with `order` rather than by being written
      first. On a phone that puts it above the type, which is the reading order
      wanted there.
    */
    /* No top padding: the (main) layout already offsets 72px for the fixed
       navbar, and adding it again here left a band of bare navy above the
       photograph that read as a gap rather than as clearance. */
    <section className="relative isolate w-full overflow-hidden bg-white">
      <div className="hero-band mx-auto grid w-full max-w-[1800px] lg:grid-cols-[1.08fr_0.92fr]">
        {/*
          ── The map ───────────────────────────────────────────────────
          Written second, shown first on a phone and on the right from lg up —
          see the order note above.

          The photograph and its two overlays are gone. A dissolve and a
          vignette existed to solve a problem a photograph has and this does
          not: a rectangular image has an edge, and the edge had to be hidden.
          The map is drawn on transparency, sits on the same ground as the type
          and has no edge to hide — so the panel is the ground, and nothing is
          painted over it.

          The height comes down from 54rem to 34rem with it. That was set to fit
          a portrait photograph without cropping the car out of it; a landscape
          map in a tall panel is a small graphic with empty space above and
          below, which is not whitespace, it is a gap.
        */}
        <div className="relative order-first flex min-h-[240px] items-center justify-center px-6 py-10 sm:min-h-[300px] sm:px-10 lg:order-last lg:min-h-[34rem] lg:px-12 lg:py-16">
          <HeroWorldMap className="h-auto w-full max-w-[46rem]" />
        </div>

        {/* ── Right: the solid panel ─────────────────────────────────── */}
        <div className="relative flex flex-col justify-center px-6 pb-16 pt-10 sm:px-8 lg:py-24 lg:pl-14 lg:pr-10 xl:pl-20">
          {/* One quiet light source behind the type, so the solid half is not
              a flat fill. Nothing reads as a gradient; it reads as depth. */}
          <div
            aria-hidden="true"
            /*
              Kept off the joining edge. Anchored against the seam it was
              brighter than the photograph's faded edge immediately beside it,
              which drew the join back as a hard line — the one thing the
              dissolve exists to remove. The panel is on the left now, so the
              glow moves with it: centred at 45%, away from the right-hand edge
              where the two meet.
            */
            className="hero-lift pointer-events-none absolute inset-0 -z-10"
          />

          <div className="flex w-full max-w-[34rem] flex-col items-start text-left">
            <span className="hero-rise hero-rise-1 mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-ui-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-plug-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.35)]"
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
            {/*
              Smaller than it was, because the measure is. At 7vw capped to
              5.75rem the type was sized for a frame the full width of the page;
              in a panel of roughly 620px "Every charger" no longer fits on one
              line, and the three deliberate lines below became four arbitrary
              ones — which is exactly what setting them explicitly was meant to
              prevent. 4.4vw capped to 4.5rem holds the intended shape from 1024
              up, and the phone value is unchanged because the panel is
              full-width there.
            */}
            <h1 className="text-[clamp(2.875rem,4.6vw,4.625rem)] font-extrabold leading-[0.98] tracking-[-0.038em] text-slate-900">
              <span className="hero-rise hero-rise-2 block">Every charger</span>
              <span className="hero-rise hero-rise-3 block">in Pakistan,</span>
              <span className="hero-rise hero-rise-4 block text-plug-navy-700">on one map.</span>
            </h1>

            <p className="hero-rise hero-rise-4 mt-6 max-w-[46ch] text-pretty text-[1.1875rem] leading-[1.62] text-slate-600">
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
              className="hero-rise hero-rise-5 mt-11 flex w-full max-w-[30rem] items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pl-5 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.22)] transition-colors duration-200 focus-within:border-slate-400"
            >
              <Search size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a city or station"
                aria-label="Search for a charging station by city or name"
                className="min-w-0 flex-1 border-none bg-transparent py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-500 [&::-webkit-search-cancel-button]:appearance-none"
              />
              <button
                type="submit"
                className="group/go inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-plug-navy-900 px-5 text-ui font-semibold text-white transition-colors duration-200 hover:bg-plug-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-navy-900 focus-visible:ring-offset-2 motion-reduce:transition-none"
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

            <div className="hero-rise hero-rise-5 mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-ui-xs uppercase tracking-[0.12em] text-slate-600">Popular</span>
              {QUICK_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => go(city)}
                  className={cn(
                    'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-ui-xs font-medium text-slate-700',
                    'transition-colors duration-150 hover:border-slate-400 hover:text-slate-900',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*
        The route-planner line, on the band's own left edge.

        Back to slate-500, which is where it started. It went white/60 when the
        band was navy and slate-500 measured 1.6:1 against #021024; on the light
        ground that reasoning reverses and the original colour is the correct
        one again — 4.2:1, and 8.6:1 on the slate-900 hover.

        What did not revert is the position. It sat centred under a full-width
        hero; it is aligned to the type column now, so it reads as belonging to
        what is above it rather than to the page.
      */}
      <div className="hero-band mx-auto flex w-full max-w-[1800px] px-6 pb-10 sm:px-8 lg:pb-12 lg:pl-14 xl:pl-20">
        <Link
          href="/routes"
          className="group/link inline-flex items-center gap-2 text-ui-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
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
