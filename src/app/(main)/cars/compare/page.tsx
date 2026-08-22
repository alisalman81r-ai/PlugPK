// src/app/(main)/cars/compare/page.tsx
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { CarComparison } from '@/components/cars/CarComparison'
import { getCarsByIds } from '@/lib/cars'

/**
 * The comparison, addressed by URL.
 *
 * Ids travel in the query string rather than in component state, which is what
 * makes a comparison shareable, bookmarkable and able to survive a refresh — a
 * modal holding the selection would lose all three.
 *
 * Unknown ids are dropped rather than 404ing the page: a link that outlives a
 * car being delisted should still show the cars it can, not nothing.
 */

export const metadata: Metadata = {
  title: 'Compare EV & PHEV Cars in Pakistan',
  description:
    'Compare electric, plug-in hybrid and range-extender cars sold in Pakistan side by side — price, battery, range, power and charging speeds.',
  alternates: { canonical: '/cars/compare' },
}

interface ComparePageProps {
  searchParams: { ids?: string }
}

/** Four columns already scroll on a phone; more stops being comparable. */
const MAX = 4

export default function ComparePage({ searchParams }: ComparePageProps) {
  const ids = (searchParams.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX)

  const cars = getCarsByIds(ids)

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="container-plug">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Side by side
          </span>
          <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-black leading-[1.03] tracking-[-0.035em] text-slate-900">
            Compare <span className="text-plug-blue-600">cars</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            Every published figure, lined up. Rows no car has a figure for are left out
            rather than filled with dashes.
          </p>
        </div>

        <div className="mt-10">
          {cars.length >= 2 ? (
            <CarComparison cars={cars} />
          ) : (
            /* One car is not a comparison — that is the detail page. Rather
               than render a single column, this says what is missing. */
            <div className="rounded-2xl border border-slate-200 p-10 text-center">
              <p className="text-ui font-semibold text-slate-700">
                {cars.length === 1 ? 'Pick one more car' : 'Nothing selected yet'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-ui-sm leading-relaxed text-slate-500">
                Choose two to {MAX} cars from the database using the Compare button on each
                card, then open this page.
              </p>
              <Link
                href="/cars"
                className="group/cta mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-ui-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <ArrowLeft
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover/cta:-translate-x-0.5"
                />
                Browse cars
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
