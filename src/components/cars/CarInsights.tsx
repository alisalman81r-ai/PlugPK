// src/components/cars/CarInsights.tsx
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import { carDisplayName, type Insight } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The extremes of the dataset, as a way in.
 *
 * A catalogue of twenty-eight cars is small enough to scroll but still asks the
 * visitor to know what they are looking for. These are the questions people
 * arrive with — what goes furthest, what costs least, what charges fastest —
 * answered before any filter is touched, and each one is a link straight to the
 * car that answers it.
 *
 * Every figure is computed from the data by getInsights(), so nothing here can
 * become stale or contradict a card further down the page. A category with no
 * published figures is omitted rather than guessed at.
 *
 * A horizontal rail on small screens and a row on large ones: five items will
 * not fit across a phone, and stacking them into five full-width cards would
 * push the actual catalogue off the first two screens.
 */

export interface CarInsightsProps {
  insights: Insight[]
}

export function CarInsights({ insights }: CarInsightsProps) {
  if (insights.length === 0) return null

  return (
    /*
      White, where this was slate-50/60.

      The catalogue below it moved to a slate-100 ground, and slate-50 at 60%
      over white is close enough to slate-100 that the seam between the two
      sections read as a rendering seam rather than a change of section — while
      these white cards had nothing to sit against. White here gives the page
      two clean bands (the brand strip and this) above the grey working area,
      and lets the cards' own borders do the work.
    */
    <section aria-labelledby="insights-heading" className="border-b border-slate-200 bg-white">
      <div className="container-plug py-10 lg:py-12">
        {/* A heading, not a caption. At 11px grey uppercase it read as a
            label on the row below rather than as the name of a section, and
            this is the first thing under the hero. Same weight as the
            comparison's group headings, so the section names across the car
            pages carry one voice. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="insights-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            At a glance
          </h2>
          <p className="text-ui-sm text-slate-500">
            The extremes of the catalogue, worked out from the data
          </p>
        </div>

        <ul className="scrollbar-hide -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
          {insights.map((insight) => (
            <li key={insight.label} className="w-[15rem] shrink-0 snap-start lg:w-auto lg:shrink">
              <Link
                href={`/cars/${insight.car.slug}`}
                className={cn(
                  'group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-e1',
                  'transition-all duration-300 hover:-translate-y-0.5 hover:border-plug-blue-300 hover:shadow-e2',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                )}
              >
                {/* Small and square: at this size a 16:10 crop of a whole car
                    reads as a smudge, and the label is doing the work anyway. */}
                <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <PhotoFrame
                    src={insight.car.image ?? undefined}
                    alt={carDisplayName(insight.car)}
                    sizes="56px"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block text-ui-xs font-semibold uppercase tracking-[0.1em] text-plug-blue-600">
                    {insight.label}
                  </span>
                  <span className="mt-0.5 block truncate text-ui font-black tracking-tight text-slate-900">
                    {insight.value}
                  </span>
                  {/* The trim included: an insight claims a superlative
                      ("largest battery") and the figure above it is
                      variant-level, so naming only the family would attribute
                      one trim's figure to all of them. */}
                  <span className="mt-0.5 block truncate text-ui-xs text-slate-500">
                    {carDisplayName(insight.car)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
