// src/components/cars/CarInsights.tsx
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import type { Insight } from '@/lib/cars'
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
    <section aria-labelledby="insights-heading" className="border-b border-slate-100 bg-slate-50/60">
      <div className="container-plug py-10 lg:py-12">
        <h2
          id="insights-heading"
          className="text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-500"
        >
          At a glance
        </h2>

        <ul className="scrollbar-hide -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
          {insights.map((insight) => (
            <li
              key={insight.label}
              className="w-[15rem] shrink-0 snap-start lg:w-auto lg:shrink"
            >
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
                    alt={insight.car.fullName}
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
                  <span className="mt-0.5 block truncate text-ui-xs text-slate-500">
                    {insight.car.fullName}
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
