// src/components/cars/CarHero.tsx
'use client'

import { Search, Zap } from '@/components/ui/icons'
import * as React from 'react'

import { SearchSelect } from '@/components/ui/SearchSelect'
import { Btn, HeroStats, Hl, PageHero } from '@/components/v2/ui'

/**
 * The top of /cars: the ink hero every inner page opens with (landing-v2's
 * .phero), a white search pill, and the catalogue's extent.
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
    <PageHero
      className="pb-[clamp(120px,10vw,128px)]"
      title={
        <>
          Every EV in Pakistan, <Hl dark>side by side</Hl>
        </>
      }
      sub="Prices in rupees, real battery and range figures, nothing estimated — EVs, plug-in hybrids and range extenders on sale here."
    >
      {/* A form, so Enter submits and the row is one control to a screen
          reader — but it never navigates, since the grid already filtered. */}
      <form
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
        <Btn type="submit" variant="ink" className="h-[50px] w-full sm:w-auto">
          Search
        </Btn>
      </form>

      <HeroStats
        items={stats.map((stat) => ({
          label: stat.label,
          value:
            stat.label === 'Full EV' ? (
              <span className="inline-flex items-center gap-1.5">
                <Zap aria-hidden="true" className="h-[0.7em] w-[0.7em] fill-volt text-volt" />
                {stat.value}
              </span>
            ) : (
              stat.value
            ),
        }))}
      />
    </PageHero>
  )
}
