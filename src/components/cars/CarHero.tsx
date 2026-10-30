// src/components/cars/CarHero.tsx
'use client'

import { Search } from '@/components/ui/icons'
import * as React from 'react'

import { SearchSelect } from '@/components/ui/SearchSelect'

/**
 * The top of /cars, in the same dark band the other directories open with
 * (Services, Community): a heading, one search row, and the catalogue's extent.
 *
 * The search and the brand are the page's own state, owned by CarsExplorer, so
 * the grid below answers on the keystroke. The form never navigates — filtering
 * is already live — and its Search button takes the reader down to the cars.
 */

export interface CarHeroProps {
  query: string
  onQueryChange: (query: string) => void
  brand: string | null
  onBrandChange: (brand: string | null) => void
  brands: string[]
  stats: Array<{ value: string; label: string }>
  onSubmit: () => void
}

export function CarHero({ query, onQueryChange, brand, onBrandChange, brands, stats, onSubmit }: CarHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-plug-navy-950 py-20 lg:py-28">
      {/* The same ground as ServiceHero: a dot grid and two soft pools of light. */}
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
        <h1 className="mx-auto max-w-4xl text-balance text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.035em] text-white">
          Every EV in Pakistan,{' '}
          <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
            side by side
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
          Prices in rupees, real battery and range figures, nothing estimated — EVs, plug-in hybrids and range
          extenders on sale here.
        </p>

        {/* A form, so Enter submits and the row is one control to a screen
            reader — but it never navigates, since the grid already filtered. */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-2 rounded-3xl border border-white/15 bg-white/[0.07] p-2 shadow-e4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/30 sm:flex-row sm:items-center sm:rounded-full"
        >
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={18} className="pointer-events-none absolute left-4 text-white/50" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search a brand or model — BYD, Tiggo, PHEV…"
              aria-label="Search cars"
              className="field-glass h-12 w-full min-w-0 rounded-full border-none bg-transparent pl-11 pr-3 text-ui text-white outline-none placeholder:text-white/50 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <SearchSelect
              value={brand ?? 'all'}
              onChange={(next) => onBrandChange(next === 'all' ? null : next)}
              ariaLabel="Filter by brand"
              allLabel="All brands"
              options={brands}
              searchPlaceholder="Type a brand"
              tone="dark"
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-white px-6 text-ui font-semibold text-slate-950 shadow-[0_0_36px_-8px_rgba(38,205,178,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-plug-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Search
            </button>
          </div>
        </form>

        <dl className="mx-auto mt-10 grid w-full max-w-md grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col-reverse px-2 py-4 sm:px-4">
              <dt className="mt-1 text-ui-xs uppercase tracking-[0.08em] text-white/60 sm:tracking-[0.12em]">
                {stat.label}
              </dt>
              <dd className="text-2xl font-black tabular-nums text-white sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
