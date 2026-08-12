// src/components/home/HeroSearch.tsx
'use client'

import { ArrowRight, MapPin, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { PAKISTAN_CITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface HeroSearchProps {
  className?: string
}

/** Enough to start from without turning the hero into a filter panel. */
const QUICK_CITIES = PAKISTAN_CITIES.slice(0, 4)

/**
 * The hero's primary action. A plain "Find a charger" button asks the visitor
 * to start over on the next page; this carries their intent with them and
 * lands on /map already filtered.
 *
 * Submitting with an empty box is deliberately still valid — it opens the
 * unfiltered map, which is what someone who just wants to look around wants.
 */
export function HeroSearch({ className }: HeroSearchProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')

  const go = (value: string) => {
    const trimmed = value.trim()
    router.push(trimmed ? `/map?q=${encodeURIComponent(trimmed)}` : '/map')
  }

  return (
    <div className={cn('max-w-xl', className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          go(query)
        }}
        className="flex h-[60px] items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 pl-5 backdrop-blur-xl transition-colors duration-200 focus-within:border-cyan-400/60 focus-within:bg-white/[0.12]"
      >
        <Search size={20} className="shrink-0 text-white/50" aria-hidden="true" />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a city or station"
          aria-label="Search for a charging station by city or name"
          className="min-w-0 flex-1 border-none bg-transparent text-ui text-white outline-none placeholder:text-white/45 [&::-webkit-search-cancel-button]:appearance-none"
        />

        <button
          type="submit"
          className="group/go flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
        >
          <span className="hidden sm:inline">Find chargers</span>
          <span className="sm:hidden">Go</span>
          <ArrowRight
            size={16}
            className="shrink-0 transition-transform duration-200 group-hover/go:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-white/40">
          <MapPin size={12} aria-hidden="true" />
          Popular
        </span>
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => go(city)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/65 transition-colors duration-150 hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}
