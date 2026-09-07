// src/components/cars/CarHero.tsx
'use client'

import { Search } from 'lucide-react'
import * as React from 'react'

import type { CarCategory } from '@/data/cars'

/**
 * The dark hero for the car database.
 *
 * ── The structure is shared; the surface is not ───────────────────────
 *
 * This kept the same treatment as ServiceHero — a dot grid, two blurred colour
 * pools, and a heading whose last phrase ran through a cyan-to-blue gradient —
 * on the argument that two pages doing the same job should open the same way.
 * The argument holds for the structure and it is kept: eyebrow, heading,
 * supporting line, one search row, a set of counts. A visitor moving between
 * Services and Cars should not have to relearn the top of the page.
 *
 * It does not hold for the surface, and three of those devices were the reason
 * this page did not look like it was about cars.
 *
 *   A DOT GRID says nothing about a car database. It is the default texture for
 *   a dark panel that needed some texture, which is exactly why it reads as
 *   template rather than as design — the same grid is behind half the dark
 *   heroes on the web.
 *
 *   TWO BLURRED COLOUR POOLS, one blue at the top left and one cyan at the
 *   bottom right, lit the frame from two directions at once. Nothing is lit
 *   from two directions in a showroom, and the pair had no relationship to
 *   where the content actually sits.
 *
 *   A GRADIENT INSIDE A HEADING is a fourth thing for the eye to resolve in the
 *   largest type on the page, and it puts the lightest part of the word on the
 *   darkest part of the ground. The home page's hero settles this the other
 *   way — a flat accent colour on the phrase that carries the idea — and this
 *   now matches it, so the two dark headings on the site are set the same way.
 *
 * What replaces them is one light source. A wide soft ellipse above the
 * content, falling off toward the floor, with a faint reflected lift at the
 * bottom edge where the section meets the page: a car photographed on a stand.
 * It is the same idea as the stage behind each card's photograph, at the scale
 * of the whole section, which is what ties the top of the page to the grid
 * below it.
 *
 * ── One real difference from ServiceHero ──────────────────────────────
 *
 * ServiceHero is a server component whose form GETs back to /services, because
 * that page filters on the server. Cars filter in the browser, so this is a
 * client component and the input is controlled from above: typing narrows the
 * grid on the keystroke rather than on a round trip. That also means there is
 * exactly one search box on the page — the results toolbar below has none —
 * instead of two that could disagree.
 */

export interface CarHeroProps {
  query: string
  onQueryChange: (query: string) => void
  /** The brand select. `null` means every brand. */
  brand: string | null
  onBrandChange: (brand: string | null) => void
  brands: string[]
  stats: Array<{ value: string; label: string }>
  /** Scrolls the results into view — see the button below for why. */
  onSubmit: () => void
}

export function CarHero({
  query,
  onQueryChange,
  brand,
  onBrandChange,
  brands,
  stats,
  onSubmit,
}: CarHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-plug-navy-950 py-20 lg:py-28">
      {/* One light source, above the content and falling off toward the floor.
          Wide (140%) and shallow (70%) so the falloff is gradual across the
          whole width rather than reading as a circle sitting on a dark panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(140%_70%_at_50%_-10%,rgba(84,131,179,0.34)_0%,rgba(15,76,147,0.16)_38%,transparent_72%)]"
      />
      {/* The floor. A cool lift at the bottom edge, much weaker than the key
          light above it — the light that has bounced back up off the stand. It
          is also what carries this section into the grey page beneath instead
          of ending on a hard dark line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(to_top,rgba(84,131,179,0.14)_0%,transparent_100%)]"
      />
      {/* A hairline catching the top edge, kept: it is what stops the navbar
          above from bleeding into the section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="container-plug relative z-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400" />
          Pakistan market
        </span>

        {/* Two explicit lines rather than a balanced wrap. "Every electrified
            car, compared" breaks after "car," at every width this heading is
            ever set at, so stating the break makes the silhouette a decision
            instead of a coincidence — and it guarantees the accent word is
            never left sharing a line with the phrase it is meant to close.
            Spans rather than <br>, which a screen reader announces as a pause
            mid-sentence; these are block-level and read as one heading. */}
        <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2.25rem,5.5vw,4.25rem)] font-black leading-[0.98] tracking-[-0.04em] text-white">
          <span className="block">Every electrified car,</span>
          <span className="block text-plug-sky-300">compared</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
          Prices in rupees, real battery and range figures, nothing estimated — EVs,
          plug-in hybrids and range extenders on sale here.
        </p>

        {/*
          A form, so Enter submits and the whole row is one control to a screen
          reader — but it never navigates. Filtering is already live on the
          keystroke, so a submit that reloaded the page would throw away the
          results the user is looking at.
        */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-2 rounded-3xl border border-white/15 bg-white/[0.07] p-2 shadow-e4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/30 sm:flex-row sm:items-center sm:rounded-full"
        >
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 text-white/50"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search a brand or model — BYD, Tiggo, PHEV..."
              aria-label="Search cars"
              className="field-glass h-12 w-full min-w-0 rounded-full border-none bg-transparent pl-11 pr-3 text-ui text-white outline-none placeholder:text-white/50 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Solid dark fill, not translucent: a native select paints its
                option list from its own background, and a see-through control
                gives the browser nothing to work with. */}
            <select
              value={brand ?? 'all'}
              onChange={(event) =>
                onBrandChange(event.target.value === 'all' ? null : event.target.value)
              }
              aria-label="Filter by brand"
              className="h-12 min-w-0 flex-1 cursor-pointer rounded-full border border-white/15 bg-plug-navy-900 px-4 text-ui font-medium text-white outline-none transition-colors hover:border-white/25 focus-visible:border-plug-cyan-400 focus-visible:ring-2 focus-visible:ring-plug-cyan-400/40 sm:flex-none"
            >
              <option value="all">All brands</option>
              {brands.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>

            {/* Labelled Search but it scrolls, because the searching already
                happened. Kept because the row reads as a search bar without it
                and people expect somewhere to press. */}
            <button
              type="submit"
              /* The cyan halo this carried is gone. It was a 36px glow in
                 rgba(34,211,238,.6), which made sense while a cyan pool was
                 blurred across the bottom right of the section — the button was
                 picking up a colour that was already in the frame. With the
                 lighting reduced to one source, that glow was the only cyan
                 left on the page and the brightest object in the hero, so the
                 eye went to it before the heading.

                 The same treatment as the home hero's submit now: white on
                 dark, sky-100 on hover, and the lift is the only motion. */
              className="h-12 shrink-0 rounded-full bg-white px-6 text-ui font-semibold text-plug-navy-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-plug-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Search
            </button>
          </div>
        </form>

        {/*
          A rail, not a panel.

          These three counts were in a bordered, tinted, backdrop-blurred box
          with dividers — five separate treatments to present three numbers, and
          a second bounded object directly under the search field, which is also
          a bordered tinted blurred pill. Two of those stacked made the middle of
          the hero read as a stack of widgets.

          The box is gone and the numbers carry themselves: hairline dividers
          between the cells and nothing around the outside. It is quieter and it
          is also more honest about what they are — a caption on the catalogue,
          not a control.

          Set in the mono face and tabular, which is what the cards below do with
          their figures. Same page, same treatment for a number.
        */}
        <dl className="mx-auto mt-12 flex w-full max-w-lg items-stretch justify-center divide-x divide-white/15">
          {stats.map((stat) => (
            // dt before dd in the source, which is what a definition list
            // requires; flex-col-reverse puts the number on top where the eye
            // wants it without lying about the structure.
            <div key={stat.label} className="flex flex-1 flex-col-reverse px-5">
              <dt className="mt-2 font-mono text-[0.625rem] uppercase leading-none tracking-[0.16em] text-white/55">
                {stat.label}
              </dt>
              <dd className="font-mono text-3xl font-bold leading-none tabular-nums text-white sm:text-[2.5rem]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export type { CarCategory }
