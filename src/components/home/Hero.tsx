// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CHARGING_STOP, WorldMap } from './WorldMap'
import { JourneyStatus } from './JourneyStatus'
import { useEvJourney } from './useEvJourney'

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

  /*
    The journey is scrubbed against this section's scroll range. The hook owns
    ScrollTrigger entirely; this component only says where the range is.
  */
  const sceneRef = React.useRef<HTMLElement>(null)
  useEvJourney({ scene: sceneRef, stop: CHARGING_STOP })

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
      hero is the top of the site rather than an illustration placed near it.

      ── Where the type sits ───────────────────────────────────────────
      The content was once centred over a full-width photograph, on the
      argument that the search field is the only thing here a visitor can act
      on and centred it sits on the frame's own axis. That holds for a hero
      where type is ON an image. It does not survive the split: there is no
      longer one axis, there are two panels, and the control belongs on the
      axis of the one it lives in.

      ── There is no seam any more ─────────────────────────────────────
      This used to need one. The right-hand half was a photograph, a rectangle
      has an edge, and the edge had to be hidden — so both halves were the same
      colour and the image dissolved into the panel over a fifth of the width,
      with a vignette settling its corners.

      The map replaced it and none of that survives. It is an inline SVG drawn
      on transparency over the band's own fill, so the two halves are literally
      the same surface and there is no boundary to disguise. The dissolve, the
      vignette and the third colour that drove them are deleted from
      globals.css rather than left unused.

      ── Which side the map is on ──────────────────────────────────────
      Type left, map right. The DOM order stays type-first regardless: the h1
      is the page's heading and should not follow a decorative figure, so the
      map is moved with `order` rather than by being written first. On a phone
      that puts it above the type, which is the reading order wanted there.
    */
    /* No top padding: the (main) layout already offsets 72px for the fixed
       navbar, and adding it again here left a bare band above the map that
       read as a gap rather than as clearance. */
    /*
      ── The scene, and why it is 300vh ────────────────────────────────
      The journey is scrubbed against this element's scroll range, and the band
      inside it is `sticky`, so the hero holds still while the range is
      travelled. Three viewport heights is the distance the ten phases need to
      land one at a time rather than overlapping into a blur; below about 2.4
      the charging stop and the departure collide.

      `overflow-x-clip` rather than `overflow-hidden`: hidden on a scroll
      ancestor makes `position: sticky` inside it stop working, because the
      element then sticks to that scroll container instead of the viewport. This
      cost an hour the first time. Clip contains the horizontal axis without
      creating a scroll context.

      Below `lg` and under reduced motion the hook renders the finished state
      and never builds a timeline, so the extra height would be three empty
      screens — hence `lg:h-[300vh]` and nothing at all before it.
    */
    <section
      ref={sceneRef}
      className="relative isolate w-full overflow-x-clip bg-white lg:h-[300vh]"
    >
      <div className="hero-band mx-auto grid w-full max-w-[1800px] lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:grid-cols-[1.08fr_0.92fr]">
        {/*
          ── The map ───────────────────────────────────────────────────
          Written second, shown first on a phone and on the right from lg up —
          see the order note above.

          No wrapper, no overlay, no reserved width. The column is sized by the
          grid's own `0.92fr` and the SVG fills it; there is nothing between
          the two but padding. Everything the journey needs to sit on top of
          the map — origin, route, charging stop, destination, car — is inside
          the SVG, in its own coordinate space, so an overlay is a child of
          WorldMap and never an absolutely-positioned element guessing at
          pixels.
        */}
        <div className="relative order-first flex min-h-[240px] items-center justify-center px-6 py-10 sm:min-h-[300px] sm:px-10 lg:order-last lg:min-h-0 lg:px-12 lg:py-16">
          <WorldMap className="h-auto w-full max-w-[46rem]" />
          <JourneyStatus />
        </div>

        {/* ── Right: the solid panel ─────────────────────────────────── */}
        <div className="relative flex flex-col justify-center px-6 pb-16 pt-10 sm:px-8 lg:py-0 lg:pl-14 lg:pr-10 xl:pl-20">
          {/* One quiet light source behind the type, so the solid half is not
              a flat fill. Nothing reads as a gradient; it reads as depth. */}
          <div
            aria-hidden="true"
            /*
              Centred left of middle, at 40%, so the light sits under the type
              and not under the map. It was kept off the joining edge for a
              different reason once — anchored against the seam it out-shone
              the photograph's faded edge and drew the join back as a hard
              line. There is no join now, but the placement is still right: a
              glow behind the graphic would wash out the dots.
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
