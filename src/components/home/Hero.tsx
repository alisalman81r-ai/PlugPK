// src/components/home/Hero.tsx
'use client'

import { ArrowRight, Cable, MapPin, Route, Search, Star, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { HeroShowcase } from './HeroShowcase'
import { cn } from '@/lib/utils'
import type { HeroStats } from '@/lib/charging'

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
    <div className="flex items-center gap-3.5">
      {/*
        The glyph sits on the page, not in a chip.

        This was a filled plug-blue-50 square. Three of them in a row under the
        hero read as three buttons rather than three figures, and the fill
        competed with the numbers beside it — which are the thing the row
        exists to show.

        The box is gone; the 40px measure is not. It keeps the icon's optical
        centre level with the value above the label across all three stats,
        which an intrinsically-sized glyph would not.
      */}
      <span
        aria-hidden="true"
        className="flex h-10 w-10 sm:h-[clamp(2.5rem,4.2vh,2.75rem)] sm:w-[clamp(2.5rem,4.2vh,2.75rem)] shrink-0 items-center justify-center text-plug-cyan-400"
      >
        {icon}
      </span>
      <div className="flex flex-col-reverse">
        <dt className="text-ui-xs leading-tight tracking-[0.005em] text-slate-400">
          {label}
          {note ? <span className="block text-ui-xs text-slate-400/80">({note})</span> : null}
        </dt>
        <dd className="mb-1 text-[clamp(1.375rem,2.4vh,1.625rem)] font-bold leading-none tracking-[-0.02em] tabular-nums text-white">
          {value}
        </dd>
      </div>
    </div>
  )
}

interface HeroProps {
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

export function Hero({ stats }: HeroProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')

  /*
    The map column, which is all that is left to hold a ref for. `story` and
    `scene` went with the scroll timeline they existed to drive.
  */
  const stageRef = React.useRef<HTMLDivElement>(null)


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

      ── One viewport, and no runway above it ──────────────────────────

      This was 300svh: one screen for the hero and two more of scroll
      for a car to drive down the map. With the journey gone there is nothing
      to scrub, so the extra 200% was two screens of nothing between the hero
      and the section under it. It is plain flow again — no sticky, no pin, no
      progress attribute, and the document is its own height.
    */
    <section className="relative w-full">
      <div className="relative isolate flex min-h-[calc(100svh-var(--nav-h))] w-full flex-col overflow-x-clip pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {/*
          ── A dark ground, and the map as the light on it ─────────────────

          Pine, deepening to ink at the edges and lifting toward forest behind
          the map, so the band has a direction: the eye is pulled right, to
          the country, and the type sits on the quietest part of the field.

          Four layers, all decoration and all behind the content:
            the field       one radial gradient, pine to forest to ink
            the grid        a faint mint dot lattice, masked to fade out
                            before it reaches the type — a survey sheet under
                            the map, not wallpaper behind the words
            the glow        a turquoise bloom behind the silhouette, which is
                            what makes pale land read as lit rather than cut out
            the grain       the site's own .grain, so the dark never goes flat

          Full bleed at the sides and solid to the foot: the green holds all
          the way down and meets the section below on a clean edge, with no
          fade between them. Every section keeps its own solid ground.
        */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-plug-navy-950" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_74%_46%,#0B332C_0%,#05241E_52%,#0D1817_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(196,248,236,0.10)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(58%_70%_at_72%_50%,#000_20%,transparent_75%)]" />
          <div className="absolute right-[6%] top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full bg-plug-cyan-500/[0.13] blur-[150px]" />
          <div className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-plug-cyan-500/[0.06] blur-[120px]" />
          <div className="grain" />
        </div>
        <div className="hero-band mx-auto grid w-full max-w-[2100px] flex-1 lg:grid-cols-[0.92fr_1.08fr]">
          {/* ── The type ─────────────────────────────────────────────── */}
          <div className="hero-type relative flex flex-col justify-center px-6 pb-16 pt-10 sm:px-8 lg:pb-0 lg:pl-14 lg:pr-10 lg:pt-0 xl:pl-20">
            <div className="flex w-full max-w-[38rem] 2xl:max-w-[44rem] flex-col items-start text-left">
  
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
                ── Two shades, one heading ───────────────────────────────

                White for the offer, turquoise for the place. The accent runs
                turquoise into mint as a clipped gradient, so the word that
                names the country catches the same light the map does.

                No eyebrow and no rule down the left: the heading opens the
                column and sits flush with the copy under it.

                White on pine is 16.4:1; turquoise on pine 8.2:1.
              */}
              <div className="relative">
                <h1 className="text-[clamp(2.5rem,3.7vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.035em] text-white">
                  <span className="hero-rise hero-rise-2 block">Find every EV charger</span>
                  <span className="hero-rise hero-rise-3 block">
                    in{' '}
                    <span className="bg-gradient-to-r from-plug-cyan-500 via-plug-cyan-400 to-plug-cyan-200 bg-clip-text text-transparent">
                      Pakistan.
                    </span>
                  </span>
                </h1>
              </div>
  
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
              <p className="hero-rise hero-rise-4 mt-[clamp(1rem,2.6vh,1.85rem)] max-w-none text-[1.1875rem] leading-[1.65] tracking-[-0.011em] text-slate-300">
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
                className="hero-rise hero-rise-5 mt-[clamp(1.75rem,4.2vh,3rem)] flex w-full items-center gap-2 rounded-full border border-white/10 bg-white p-2 pl-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] ring-0 ring-plug-cyan-500/40 transition-[box-shadow] duration-200 focus-within:ring-4"
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
                  className="group/go inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-plug-blue-600 px-5 text-ui font-semibold text-white transition-colors duration-200 hover:bg-plug-cyan-500 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
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
              <dl className="hero-rise hero-rise-5 mt-[clamp(1.75rem,3.8vh,2.6rem)] flex w-full flex-wrap items-center gap-x-6 gap-y-5 border-t border-white/10 pt-[clamp(1.25rem,2.8vh,1.75rem)] sm:gap-x-8">
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

              {/*
                ── The route planner ─────────────────────────────────────

                Part of this stack, not a row underneath the whole band.

                It used to sit below the grid, which made it the one thing the
                flex slack could never reach: the band took `flex-1` and
                absorbed every spare pixel, so the card stayed welded to the
                bottom of the section while the gap above the heading grew with
                the viewport. Measured, that was 183px of nothing over the pill
                at 1080 — and at every height tested, the card's bottom edge
                and the bottom of the viewport were the same pixel, so on a
                laptop it read as cut off.

                Inside the stack it is centred with everything else: the slack
                falls above AND below it, and the heading rises by half of what
                the card and its margin take up.

                Alignment does not change. It was already capped at the type
                measure and indented to the type column; the stack it now lives
                in is that measure and that indent, so the cap comes off here
                rather than being stated twice.
              */}
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
              {false && <Link
                href="/routes"
                className={cn(
                  'group/route relative isolate mt-10 flex w-full items-center gap-4 overflow-hidden',
                  'rounded-2xl border border-slate-200 bg-white px-4 py-3.5',
                  'shadow-[0_1px_3px_rgba(5,36,30,0.05)] transition-all duration-200',
                  'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_-14px_rgba(5,36,30,0.3)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-plug-blue-600"
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
              </Link>}
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
          {/*
            The phone, the car and the country, as one scaled drawing. The
            cap on width keeps its height inside the band on a short laptop:
            the drawing is 935 × 760, so it may be 1.23× as wide as the band
            is tall, less a little for breathing room.
          */}
          <div
            ref={stageRef}
            className="relative flex items-center justify-center px-5 pb-10 sm:px-10 lg:py-6 lg:pl-[1.3vw] lg:pr-0"
          >
            <div className="w-full max-w-[min(100%,calc((100svh-var(--nav-h)-3rem)*1.23))]">
              <HeroShowcase pins={stats.pins} />
            </div>
          </div>
        </div>
  
      </div>
    </section>
  )
}
