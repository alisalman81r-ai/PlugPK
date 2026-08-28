// src/components/cars/CarHero.tsx
'use client'

import { Search } from 'lucide-react'
import * as React from 'react'

import type { CarCategory } from '@/data/cars'

/**
 * The dark hero for the car database.
 *
 * Deliberately the same treatment as ServiceHero: slate-950 ground, a dot grid,
 * two blurred colour pools, a hairline catching the top edge, a pill eyebrow, a
 * heading with its last phrase in a cyan-to-blue gradient, then the search bar
 * and a three-up stats rail. Copying that structure rather than inventing a
 * third dark-hero style is the point — two pages that do the same job should
 * open the same way.
 *
 * One real difference. ServiceHero is a server component whose form GETs back
 * to /services, because that page filters on the server. Cars filter in the
 * browser, so this is a client component and the input is controlled from
 * above: typing narrows the grid on the keystroke rather than on a round trip.
 * That also means there is exactly one search box on the page — the results
 * toolbar below has none — instead of two that could disagree.
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-600/30 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -right-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-plug-cyan-500/20 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="container-plug relative z-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400" />
          Pakistan market
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.04] tracking-[-0.035em] text-white">
          Every electrified car,{' '}
          <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
            compared
          </span>
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
              className="h-12 shrink-0 rounded-full bg-white px-6 text-ui font-semibold text-slate-950 shadow-[0_0_36px_-8px_rgba(34,211,238,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-plug-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Search
            </button>
          </div>
        </form>

        <dl className="mx-auto mt-10 grid w-full max-w-md grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
          {stats.map((stat) => (
            // dt before dd in the source, which is what a definition list
            // requires; flex-col-reverse puts the number on top where the eye
            // wants it without lying about the structure.
            <div key={stat.label} className="flex flex-col-reverse px-4 py-4">
              <dt className="mt-1 text-ui-xs uppercase tracking-[0.12em] text-white/60">
                {stat.label}
              </dt>
              <dd className="text-2xl font-black tabular-nums text-white sm:text-3xl">
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
