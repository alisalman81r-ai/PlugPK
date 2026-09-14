// src/components/home/Hero.tsx
'use client'

import { ArrowRight, Cable, MapPin, Route, Search, Star, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { POPULAR_CITIES } from '@/lib/constants'
import { JourneyCards } from './JourneyCards'
import { JourneyLayers } from './JourneyLayers'
import { PakistanMap } from './PakistanMap'
import { useEvJourney } from './useEvJourney'
import { cn } from '@/lib/utils'
import type { HeroStats } from '@/lib/db/queries'

/** Enough to start from without turning the hero into a filter panel. */
const QUICK_CITIES = POPULAR_CITIES.slice(0, 3)

/**
 * One counted figure, with its icon and label.
 *
 * A definition list rather than three divs: each of these is a term and its
 * value, and marking them up as one lets a screen reader read "charging
 * locations, six" instead of two loose numbers in a row. `flex-col-reverse`
 * puts the number above its label on screen while leaving dt before dd in the
 * source, which is the order the element requires.
 */
function HeroStat({
  icon,
  value,
  label,
  note,
}: {
  icon: React.ReactNode
  value: string
  label: string
  note?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50 text-plug-blue-600"
      >
        {icon}
      </span>
      <div className="flex flex-col-reverse">
        <dt className="text-ui-xs leading-tight text-slate-500">
          {label}
          {note ? <span className="block text-ui-xs text-slate-400">({note})</span> : null}
        </dt>
        <dd className="mb-0.5 text-[1.375rem] font-black leading-none tabular-nums text-slate-900">
          {value}
        </dd>
      </div>
    </div>
  )
}

interface HeroProps {
  /**
   * Cities that actually have a station on the platform — counted from the
   * database, not from the list of cities somebody could pick from. This was
   * a hardcoded "18", which was a coverage claim nothing backed up.
   */
  cities: number
  /**
   * The three figures beside the search, and the counts on the city chips.
   *
   * Counted in getHeroStats, never written here. The design these came from
   * showed 247 locations and 1,240+ reviews; those are a mockup's numbers, and
   * putting them on the first screen would be four coverage claims nothing
   * supports. The layout is the design's, the figures are the database's.
   */
  stats: HeroStats
}

export function Hero({ cities, stats }: HeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')

  /*
    The journey is scrubbed against this section, which ScrollTrigger pins on
    desktop. The hook owns the timeline entirely; this component only says
    which elements to hang it on. `stage` is the map column, which is the
    trigger on small screens where nothing is pinned.
  */
  /*
    `story` is the runway and is what the timeline is measured against;
    `scene` is the sticky hero, which owns the journey DOM and publishes the
    progress attribute. They were one element while GSAP did the pinning.
  */
  const storyRef = React.useRef<HTMLElement>(null)
  const sceneRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  useEvJourney({ story: storyRef, scene: sceneRef, stage: stageRef })


  /*
    ── The placeholder is two strings, not one ───────────────────────────

    The full wording needs 200px and the field has 195px at 390, so it was
    clipping mid-word — measured, not guessed. Shortening it everywhere would
    have cost the wider screens a useful hint to save a phone five pixels.

    The short form is what renders on the server, so the markup the phone
    receives is already the one that fits and nothing reflows there. Screens
    with room swap up to the full wording on mount, and the listener keeps it
    right if the window is resized across the breakpoint.
  */
  const SHORT_PLACEHOLDER = 'Search city or station'
  const FULL_PLACEHOLDER = 'Search city, area or charging station...'
  const [placeholder, setPlaceholder] = React.useState(SHORT_PLACEHOLDER)

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const apply = () => setPlaceholder(mq.matches ? FULL_PLACEHOLDER : SHORT_PLACEHOLDER)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

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
    /*
      ── The scroll runway ─────────────────────────────────────────────
      This element is nothing but height. It is the distance the reader
      scrolls while the hero inside it stays put, and it lives in CSS so the
      browser knows the true height of the document from the first layout,
      before any JavaScript has run.

      That is the whole reason it exists. The runway used to be created by
      ScrollTrigger, which inserts its pin spacing only after hydration, so
      the document grew by ~1800px part way through loading. A reload at a
      restored position was restored against a document too short to hold
      it, and the reader lost their place: measured landing at 408 after a
      reload at 1100, and at 1200 after a reload at 3000.

      300svh less the navbar: one viewport for the hero itself and two more
      of scrolling for the journey, which is the approved 200% distance.
      From lg up only. Below that nothing sticks and this is simply as tall
      as its content.
    */
    <section ref={storyRef} className="relative w-full lg:h-[calc(300svh-var(--nav-h))]">
      {/*
        The hero itself, held under the navbar by CSS rather than by GSAP.

        position: sticky keeps this element in normal flow, so nothing is
        reparented, no spacer is inserted, and the height of the document
        never changes. GSAP pins nothing now; it only reads how far through
        the runway above the reader has scrolled.
      */}
      <div
        ref={sceneRef}
        className="relative isolate flex min-h-[calc(100svh-var(--nav-h))] w-full flex-col overflow-x-clip bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] lg:sticky lg:top-[var(--nav-h)] lg:h-[calc(100svh-var(--nav-h))] lg:min-h-0 lg:pb-0"
      >
        <div className="hero-band mx-auto grid w-full max-w-[1800px] flex-1 lg:grid-cols-[1fr_1fr]">
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
  
            <div className="flex w-full max-w-[38rem] flex-col items-start text-left">
              {/*
                ── The status pill ───────────────────────────────────────
                Green, not brand blue. It reports a live state — how many
                cities actually have coverage — and that is a status rather
                than an accent, so it reads in the colour the rest of the site
                uses for "this is on". Blue here also competed with the accent
                in the headline directly beneath it; there is one blue in this
                column now, and it is on the word that matters.

                Raw green rather than a plug-* token on purpose: it should
                stay green if the brand hue is ever changed.
              */}
              <div className="hero-rise hero-rise-1 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-green-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]"
                  />
                  {cities > 0
                    ? `Live now in ${cities} ${cities === 1 ? 'city' : 'cities'}`
                    : 'Mapping Pakistan, city by city'}
                </span>

                {/*
                  Beside the pill rather than under it, as in the reference. It
                  points at the map, which is the honest destination: there is
                  no waiting-list page to promise, and the map is where somebody
                  wondering about coverage can see exactly what exists.
                */}
                <Link
                  href="/map"
                  className="group/soon inline-flex items-center gap-1.5 text-ui-sm text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  More cities coming soon
                  <ArrowRight
                    size={14}
                    className="shrink-0 transition-transform duration-200 group-hover/soon:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </div>
  
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
              {/*
                ── Weight and accent ─────────────────────────────────────

                Black rather than extrabold. Poppins 900 is already loaded, so
                this costs no request, and at display size the difference is
                the whole character of the type: 800 reads as a strong website
                heading, 900 reads as a masthead. It is the single change that
                moves this closest to the reference.

                The accent line is the brand blue now, not navy-700. Navy at
                this size sat only a shade off the ink above it, so the third
                line read as slightly faded rather than as the emphasis — the
                distinction was there in the token and not on the screen.
                plug-blue-600 is the colour every action on the page already
                uses, and measured on this band — #EEF2F8, not white — it is
                4.60:1. Above the 4.5 needed for body text, and far above the
                3:1 that large display type actually has to meet. The ink line
                above it measures 15.89:1.

                Tracking tightens with the weight. Heavier letterforms carry
                more mass per character, so the spacing that suited 800 leaves
                900 looking loose.

                Leading goes to 1.02, up from 0.98. That is not taste: at 0.98
                the descender of "Every" reached 1.1px INTO the cap-height of
                the line below it, measured in real glyph ink. The hero was the
                one place left in the site with that fault, reported at the
                time and left alone because the composition was frozen. Opening
                it for this pass is the moment to fix it — the gap is +2px now.
              */}
              <h1 className="text-[clamp(2.5rem,3.6vw,4.4rem)] font-black leading-[1.05] tracking-[-0.04em] text-slate-900">
                <span className="hero-rise hero-rise-2 block">Find every EV charger</span>
                <span className="hero-rise hero-rise-3 block">
                  in <span className="text-plug-blue-600">Pakistan.</span>
                </span>
              </h1>
  
              {/*
                The supporting line sits closer to the headline and holds a
                shorter measure than before — 42 characters rather than 46, so
                it breaks into two balanced lines under a three-line masthead
                instead of running wider than the type it belongs to.
              */}
              {/*
                Two lines, set as two, not left to wrap. The first names what
                the product holds, the second says who it is for — the rhythm
                the reference uses, and it only reads as a rhythm if the break
                lands in the same place at every width.

                "Real charging speeds" and "driver reviews" are claims the data
                actually backs: the speeds come from the connector records and
                the reviews are written by people who used the station.
              */}
              <p className="hero-rise hero-rise-4 mt-4 max-w-none text-[1.1875rem] leading-[1.6] text-slate-600">
                <span className="block">One map. Real charging speeds. Driver reviews.</span>
                <span className="block">
                  Everything you need for a smoother, greener journey.
                </span>
              </p>
  
              {/* One control, shaped like a single button. The visitor's intent
                  travels with them rather than being re-asked for on arrival. */}
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  go(query)
                }}
                className="hero-rise hero-rise-5 mt-7 flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pl-5 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.22)] transition-colors duration-200 focus-within:border-slate-400"
              >
                <Search size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                  aria-label="Search for a charging station by city or name"
                  className="min-w-0 flex-1 border-none bg-transparent py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-500 [&::-webkit-search-cancel-button]:appearance-none"
                />
                <button
                  type="submit"
                  className="group/go inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-plug-blue-600 px-5 text-ui font-semibold text-white transition-colors duration-200 hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  <MapPin size={16} className="shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Find chargers</span>
                  <span className="sm:hidden">Go</span>
                  <ArrowRight
                    size={15}
                    className="hidden shrink-0 transition-transform duration-200 group-hover/go:translate-x-0.5 motion-reduce:transition-none sm:block"
                    aria-hidden="true"
                  />
                </button>
              </form>
  
              {/*
                ── Cities, with what is actually in them ─────────────────

                Each chip carries its own count, from getHeroStats. A chip that
                says how many charging points a city holds is a different offer
                from one that only says "Karachi": it tells somebody whether
                the trip is worth planning before they spend a click finding
                out. A city with none says "none yet", which is the answer, and
                is why the count is rendered from data rather than assumed.
              */}
              <div className="hero-rise hero-rise-5 mt-6 flex flex-wrap items-center gap-2.5">
                <span className="text-ui-sm text-slate-500">Popular cities</span>

                {QUICK_CITIES.map((city) => {
                  const count = stats.byCity[city] ?? 0
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => go(city)}
                      className={cn(
                        'group/city inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-left',
                        'shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-150',
                        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_6px_16px_-8px_rgba(15,23,42,0.22)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                      )}
                    >
                      <MapPin size={15} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
                      <span className="leading-tight">
                        <span className="block text-ui-sm font-semibold text-slate-900">{city}</span>
                        <span className="block text-ui-xs tabular-nums text-slate-500">
                          {count > 0
                            ? `${count} ${count === 1 ? 'charger' : 'chargers'}`
                            : 'none yet'}
                        </span>
                      </span>
                    </button>
                  )
                })}

                <Link
                  href="/map"
                  className="group/all inline-flex items-center gap-1.5 text-ui-sm font-medium text-plug-blue-600 transition-colors duration-150 hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  View all
                  <ArrowRight
                    size={14}
                    className="shrink-0 transition-transform duration-200 group-hover/all:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </div>

              {/*
                ── Three figures, all counted ────────────────────────────

                The reference puts 247 locations, 8 connector types and 4.8
                from 1,240+ reviews here. Those numbers are a mockup's. These
                are the database's, which means they are small — and a figure
                that is allowed to be small is one somebody can believe when it
                grows.

                The rating hides itself rather than printing 0.0 when nothing
                has been reviewed yet: an average of no reviews is not zero, it
                is nothing, and showing 0.0 would read as "rated badly".
              */}
              <dl className="hero-rise hero-rise-5 mt-6 flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-x-7">
                <HeroStat
                  icon={<Zap size={17} aria-hidden="true" />}
                  value={String(stats.locations)}
                  label={stats.locations === 1 ? 'Charging location' : 'Charging locations'}
                />
                <HeroStat
                  icon={<Cable size={17} aria-hidden="true" />}
                  value={String(stats.connectorTypes)}
                  label={stats.connectorTypes === 1 ? 'Connector type' : 'Connector types'}
                />
                {stats.rating !== null ? (
                  <HeroStat
                    icon={<Star size={17} aria-hidden="true" />}
                    value={stats.rating.toFixed(1)}
                    label="Driver rating"
                    note={`${stats.reviews} ${stats.reviews === 1 ? 'review' : 'reviews'}`}
                  />
                ) : null}
              </dl>
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
          <div
            ref={stageRef}
            className="relative flex h-[21rem] items-center justify-center px-5 pb-6 sm:h-[26rem] sm:px-10 lg:h-auto lg:px-10 lg:py-10 xl:px-14"
          >
            <PakistanMap className="h-full max-h-[78vh] w-full">
              <JourneyLayers />
            </PakistanMap>
  
            {/* Ambient product cards, floating around the silhouette — not a
                frame on it. Siblings of the map, never a wrapper. */}
            <JourneyCards />
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
        <div className="hero-band mx-auto flex w-full max-w-[1800px] px-6 pb-10 sm:px-8 lg:pb-12 lg:pl-14 lg:pr-10 xl:pl-20">
          {/*
            ── The route bar ─────────────────────────────────────────────

            The same destination as the plain link it replaces, given the
            weight the reference gives it: a card, with the road in it.

            The photograph is the one already in the repository, from the
            community post about an M2 run. It is faded into the card from
            60% rather than butted against the text, so it reads as the
            surface the card is printed on instead of a picture stuck to one
            end — and so no part of it has to be sharp enough to be examined.
            It is decorative, marked aria-hidden, and carries no claim: it is
            not captioned as any particular road.

            Capped at the width of the type column so the bar belongs to the
            left side rather than running under the map.
          */}
          <Link
            href="/routes"
            className={cn(
              'group/route relative isolate flex w-full max-w-[38rem] items-center gap-4 overflow-hidden',
              'rounded-2xl border border-slate-200 bg-white px-4 py-3.5',
              'shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-200',
              'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.3)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
              'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
            )}
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50 text-plug-blue-600"
            >
              <Route size={19} />
            </span>

            <span className="relative z-10 min-w-0">
              <span className="block text-ui-sm font-bold text-slate-900">
                Driving between cities?
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-ui-xs text-slate-500">
                Plan a route with charging stops
                <ArrowRight
                  size={13}
                  className="shrink-0 transition-transform duration-200 group-hover/route:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
            </span>

            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[46%] opacity-70">
              <Image
                src="/images/community/m2-trip-1.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 50vw, 280px"
                className="object-cover object-center"
              />
              {/* Left-to-right wash, so the words never sit on the photograph. */}
              <span className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/45" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
