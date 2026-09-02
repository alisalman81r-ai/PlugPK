// src/components/cars/BrandRail.tsx
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Brands, as a way to start.
 *
 * Most people arrive at a car catalogue with a brand in mind, and asking them
 * to open a filter panel and find a checkbox is the slowest possible way to
 * serve that. This rail, and the hero's select above it, are now the only brand
 * controls: the filter panel used to repeat them as checkboxes, which put one
 * choice in two places.
 *
 * Set in type rather than logos, deliberately. Fourteen manufacturer marks
 * would need fourteen licensed assets, would sit at fourteen different optical
 * weights, and would make the page look like an ad for them; the wordmark in
 * the site's own display face keeps it the site's page. It also means adding a
 * brand costs nothing but a row of data.
 *
 * A horizontal rail on every breakpoint. Wrapping fourteen brands into four
 * rows on a phone buries the catalogue, and a rail is the gesture people
 * already use for this kind of strip.
 *
 * One at a time: choosing a brand replaces whatever was chosen, and choosing
 * the active one clears it. The caller owns that rule — see CarsExplorer.
 */

export interface BrandRailProps {
  brands: string[]
  counts: Record<string, number>
  selected: string[]
  onToggle: (brand: string) => void
  onClear: () => void
}

/**
 * How far one press of an arrow moves the rail.
 *
 * A proportion of what is on screen rather than a fixed pixel count or a fixed
 * number of cards: the rail is edge-to-edge on a phone and inside a 1400px
 * measure on a desktop, so any constant would either barely move it on one or
 * skip past several brands on the other. Eighty per cent leaves a sliver of the
 * previous card visible, which is what tells the reader the strip moved rather
 * than replaced itself.
 */
const SCROLL_FRACTION = 0.8

export function BrandRail({ brands, counts, selected, onToggle, onClear }: BrandRailProps) {
  const railRef = React.useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(true)

  /**
   * Whether there is anywhere left to scroll, in each direction.
   *
   * Measured rather than assumed, because it depends on the viewport and on how
   * many brands the data holds — fourteen brands overflow a phone and fit a
   * wide desktop, and an arrow that does nothing when pressed is worse than no
   * arrow at all.
   *
   * The one-pixel tolerance is not superstition: a rail scrolled fully right
   * commonly lands a fraction of a pixel short of scrollWidth once the browser
   * has applied fractional layout, and comparing exactly would leave the
   * forward arrow enabled forever at the end of the strip.
   */
  const measure = React.useCallback(() => {
    const el = railRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    const el = railRef.current
    if (!el) return

    measure()
    el.addEventListener('scroll', measure, { passive: true })

    // The rail's overflow changes with the window and with the brand list, and
    // neither fires a scroll event. Without this the arrows keep whatever state
    // they had when the page loaded.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)

    return () => {
      el.removeEventListener('scroll', measure)
      observer?.disconnect()
    }
  }, [measure, brands.length])

  const scrollBy = (direction: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    // Honours the same preference the rest of the site does: a reduced-motion
    // reader gets the jump, not a 300ms glide.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    el.scrollBy({
      left: direction * el.clientWidth * SCROLL_FRACTION,
      behavior: prefersReduced ? 'auto' : 'smooth',
    })
  }

  /** Nothing overflows, so the arrows would be decoration. */
  const scrollable = !(atStart && atEnd)

  return (
    <section aria-labelledby="brands-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="brands-heading"
          className="font-display text-2xl font-bold tracking-tight text-slate-900"
        >
          Browse by brand
        </h2>

        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-ui-sm font-semibold text-plug-blue-600 transition-colors hover:text-plug-blue-800"
          >
            {/* Named when there is one, counted when the sidebar has added
                more — "Clear BYD" while two are active would be wrong about
                what the button does. */}
            Clear {selected.length === 1 ? selected[0] : `${selected.length} brands`}
          </button>
        ) : (
          <p className="text-ui-sm text-slate-500">
            {brands.length} brands sold or imported here
          </p>
        )}
      </div>

      {/*
        The rail, with its own controls.

        `relative` so the arrows and the edge fades can sit over it. The strip
        itself keeps `scrollbar-hide` — a visible scrollbar under fourteen cards
        reads as a rendering artefact on a page that has none anywhere else —
        which is exactly why it needs an arrow: with the bar hidden and the last
        card cut by the viewport, nothing said the strip moved at all.
      */}
      <div className="relative mt-4">
        {/*
          Fades at whichever edge has more behind it.

          Under the arrows and pointer-events-none, so they never eat a click
          meant for the card beneath. `from-white` matches the section ground;
          on the -mx-4 mobile bleed the fade sits over the page rather than the
          container, which is the same white.
        */}
        {scrollable && !atStart ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-16"
          />
        ) : null}
        {scrollable && !atEnd ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-16"
          />
        ) : null}

        {/*
          Hidden below sm, and deliberately: a phone scrolls this with a thumb,
          and two 40px buttons over a 100px-wide card would cover the brands
          they are meant to help reach. The arrows are for the pointer, which
          has no gesture for a horizontal strip.

          Disabled rather than removed at each end, so the row does not reflow
          under the cursor mid-press — and `disabled` is what tells a screen
          reader there is nothing further, without needing an aria-label that
          changes.
        */}
        {scrollable ? (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label="Scroll brands back"
              className={cn(
                'absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
                'border border-slate-200 bg-white text-slate-600 shadow-e2 transition-all duration-200',
                'hover:border-slate-400 hover:text-slate-900',
                'disabled:pointer-events-none disabled:opacity-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                'sm:flex',
              )}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label="Scroll brands forward"
              className={cn(
                'absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
                'border border-slate-200 bg-white text-slate-600 shadow-e2 transition-all duration-200',
                'hover:border-slate-400 hover:text-slate-900',
                'disabled:pointer-events-none disabled:opacity-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                'sm:flex',
              )}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        ) : null}

        {/* Edge-to-edge on mobile so the last brand does not look clipped by
            padding, back inside the container from sm up. */}
        <ul
          ref={railRef}
          className="scrollbar-hide -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
        {brands.map((brand) => {
          const count = counts[brand] ?? 0
          const active = selected.includes(brand)

          return (
            <li key={brand} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onToggle(brand)}
                aria-pressed={active}
                className={cn(
                  'flex min-w-[6.5rem] flex-col items-center gap-0.5 rounded-2xl border px-4 py-3 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                  active
                    ? 'border-slate-900 bg-plug-navy-900 shadow-e2'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-e1',
                  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  // Dimmed, not hidden: a brand disappearing as other filters
                  // narrow makes the rail feel unstable under the finger.
                  count === 0 && !active && 'opacity-40',
                )}
              >
                {/* font-display: the heading face, so a brand reads as a name
                    rather than as interface text. */}
                <span
                  className={cn(
                    'font-display text-lg font-bold leading-tight tracking-tight',
                    active ? 'text-white' : 'text-slate-900',
                  )}
                >
                  {brand}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px] tabular-nums',
                    active ? 'text-white/60' : 'text-slate-400',
                  )}
                >
                  {count} {count === 1 ? 'car' : 'cars'}
                </span>
              </button>
            </li>
          )
        })}
        </ul>
      </div>
    </section>
  )
}
