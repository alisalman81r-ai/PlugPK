// src/components/cars/BrandRail.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Brands, as a way to start.
 *
 * Most people arrive at a car catalogue with a brand in mind, and asking them
 * to open a filter panel and find a checkbox is the slowest possible way to
 * serve that. This is the same selection as those checkboxes — it writes into
 * filters.brands — presented as the first thing on the page.
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
 * the active one clears it. The caller owns that rule — see CarsExplorer for
 * why the rail is single-select while the sidebar checkboxes are not.
 */

export interface BrandRailProps {
  brands: string[]
  counts: Record<string, number>
  selected: string[]
  onToggle: (brand: string) => void
  onClear: () => void
}

export function BrandRail({ brands, counts, selected, onToggle, onClear }: BrandRailProps) {
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

      {/* Edge-to-edge on mobile so the last brand does not look clipped by
          padding, back inside the container from sm up. */}
      <ul className="scrollbar-hide -mx-4 mt-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
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
                    ? 'border-slate-900 bg-slate-900 shadow-e2'
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
    </section>
  )
}
