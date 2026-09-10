// src/components/home/Hero.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { PakistanMap } from './PakistanMap'
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
      ── One screenful, and nothing below it visible on load ───────────
      The section fills the viewport below the navbar, which (main) already
      offsets with pt-[72px] — so 100svh minus that 72px, at every breakpoint.

      `svh` not `vh`: on a phone 100vh is the height with the toolbar
      retracted, so a 100vh hero is cut off on load and the section below
      still peeks — the exact fault being fixed. `svh` is the smallest
      viewport, toolbar showing, which is how a landing page is first seen.
      `dvh` would resize the hero as the toolbar slides away.

      BottomTabBar is padding, not a smaller box, and that distinction was a
      bug first. It is `fixed`, so it takes no space in flow; subtracting its
      64px from the height made the section end 64px short of the viewport and
      the stats bar showed through the gap behind it — measured at 820x900 and
      390x844 before the fix. The section now runs the full height and pads
      its content clear of the bar instead.

      The height is on the section, not on the band, because the
      route-planner row is a sibling of the band. Put on the band it pushed
      that row past the fold, which is the same bug in a new place. The band
      takes `flex-1` and the row sits under it.

      min-height, not height: on a narrow phone the type, the field and the
      chips must be able to make this taller rather than overflow it.

      This section was briefly 300vh with a sticky child, to give the
      scroll-scrubbed journey a range. The map is gone, so that would now be
      three screens of empty scrolling.
    */
    <section className="relative isolate flex min-h-[calc(100svh-72px)] w-full flex-col overflow-x-clip bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="hero-band mx-auto grid w-full max-w-[1800px] flex-1 lg:grid-cols-[0.86fr_1.14fr]">
        {/* ── The type ─────────────────────────────────────────────── */}
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

        {/*
          ── The map column ────────────────────────────────────────────
          Written after the type, not before it, and with no `order`
          utilities. The h1 is the page's heading and should precede a
          decorative figure in the DOM; writing it first also gives the phone
          the stacking that was asked for — content, then Pakistan — without
          a breakpoint-specific override to get there.

          The padding is the composition. The map is centred in this column
          rather than in the viewport, and the column is the wider half, so
          the silhouette sits right of the page's centre line and clear of
          the headline. `min-h-0` lets the grid row govern the height on
          desktop; the explicit heights below `lg` are what stop it
          collapsing once it is the only thing in a stacked row.
        */}
        <div className="flex h-[21rem] items-center justify-center px-5 pb-6 sm:h-[26rem] sm:px-10 lg:h-auto lg:px-10 lg:py-10 xl:px-14">
          <PakistanMap className="h-full max-h-[78vh] w-full" />
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
