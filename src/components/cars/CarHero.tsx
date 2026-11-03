// src/components/cars/CarHero.tsx
'use client'

import { Search, Zap } from '@/components/ui/icons'
import * as React from 'react'

import { SearchSelect } from '@/components/ui/SearchSelect'
import { CountUp } from '@/components/v2/Reveal'
import { Btn, HeroStats, Hl } from '@/components/v2/ui'

/**
 * The top of /cars: the ink hero every inner page opens with (landing-v2's
 * .phero .cars-hero), a white search pill, and the catalogue's extent.
 *
 * Built here rather than with <PageHero>, because the design brings the sub,
 * the search pill and the stats in as three separate steps of the hero's
 * entrance (pages.js: .phero__sub, .psearch, .pstats, staggered 0.07s), and
 * PageHero's children are one step. The markup is PageHero's otherwise. The
 * entrance is MotionProvider's, from the data-hero-* attributes.
 *
 * The search and the brand are the page's own state, owned by CarsExplorer, so
 * the grid below answers as the reader types. The form never navigates — the
 * filtering is already live — and its Search button takes the reader down to
 * the cars.
 */

export interface CarHeroProps {
  query: string
  onQueryChange: (query: string) => void
  brand: string | null
  onBrandChange: (brand: string | null) => void
  brands: string[]
  stats: Array<{ value: number; label: string }>
  onSubmit: () => void
}

export function CarHero({ query, onQueryChange, brand, onBrandChange, brands, stats, onSubmit }: CarHeroProps) {
  return (
    <section
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(120px,10vw,128px)] pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]"
      />
      <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        <h1 data-hero-title="" className="m-0 max-w-[12.5em] text-balance font-display text-[clamp(42px,5.6vw,88px)] leading-none">
          Every EV in Pakistan, <Hl dark>side by side</Hl>
        </h1>
        <p data-hero-item="" className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70">
          Prices in rupees, real battery and range figures, nothing estimated — EVs, plug-in hybrids and range extenders on sale
          here.
        </p>

        {/* A form, so Enter submits and the row is one control to a screen
            reader — but it never navigates, since the grid already filtered. */}
        <form
          data-hero-item=""
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="relative mt-[34px] flex w-full max-w-[660px] flex-wrap items-center gap-2 rounded-[26px] bg-white p-2 text-left shadow-[0_24px_60px_-24px_rgba(212,255,58,.35)] sm:h-16 sm:flex-nowrap sm:rounded-full sm:p-[7px] sm:pl-[52px]"
        >
          <Search
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-[23px] text-[#8a8e95] sm:top-1/2 sm:-translate-y-1/2"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search a brand or model — BYD, Tiggo, PHEV…"
            aria-label="Search a brand or model"
            className="h-[50px] min-w-0 flex-[1_1_100%] bg-transparent pl-10 text-base text-ink outline-none placeholder:text-[#8a8e95] sm:h-full sm:flex-1 sm:pl-0 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <SearchSelect
            value={brand ?? 'all'}
            onChange={(next) => onBrandChange(next === 'all' ? null : next)}
            ariaLabel="Brand"
            allLabel="All brands"
            options={brands}
            searchPlaceholder="Type a brand"
            className="h-[46px] min-w-0 flex-1 rounded-none border-0 border-ink/10 bg-transparent px-3.5 text-sm font-medium text-ink hover:border-ink/10 focus-visible:ring-0 sm:max-w-[190px] sm:flex-none sm:border-l"
          />
          {/* Not magnetic: the design's search button is a plain .btn. */}
          <Btn type="submit" variant="ink" magnetic={false} className="h-[50px] w-full sm:w-auto">
            Search
          </Btn>
        </form>

        {/* The figures count up from zero as the hero comes in (data-count). */}
        <div data-hero-item="">
          <HeroStats
            items={stats.map((stat) => ({
              label: stat.label,
              value:
                stat.label === 'Full EV' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Zap aria-hidden="true" className="h-[0.7em] w-[0.7em] fill-volt text-volt" />
                    <CountUp value={stat.value} />
                  </span>
                ) : (
                  <CountUp value={stat.value} />
                ),
            }))}
          />
        </div>
      </div>
    </section>
  )
}

