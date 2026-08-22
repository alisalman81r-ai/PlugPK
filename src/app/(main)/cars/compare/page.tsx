// src/app/(main)/cars/compare/page.tsx
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { CarComparison } from '@/components/cars/CarComparison'
import { getAllCars, getCarsByIds } from '@/lib/cars'

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
  // What the add control can offer: everything not already in the table.
  const chosen = new Set(cars.map((car) => car.id))
  const available = getAllCars().filter((car) => !chosen.has(car.id))

  return (
    /**
     * Dark, because the comparison is set on glass.
     *
     * A translucent surface needs something behind it to blur; on the white
     * page this used to be, the glass rendered as a flat grey box. The ground
     * is the same one the car and services heroes use — slate-950, a dot grid,
     * a blue pool top-left and a cyan one bottom-right — so the page reads as
     * the site's existing dark treatment rather than a new invention.
     */
    <section className="relative isolate overflow-hidden bg-slate-950 py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-56 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-600/25 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 -right-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-plug-cyan-500/20 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="container-plug relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400" />
            Side by side
          </span>
          <h1 className="mt-6 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-black leading-[1.03] tracking-[-0.035em] text-white">
            Compare{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              cars
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
            Every published figure, lined up. Rows no car has a figure for are left out
            rather than filled with dashes.
          </p>
        </div>

        <div className="mt-10">
          {cars.length >= 2 ? (
            <CarComparison cars={cars} available={available} max={MAX} />
          ) : (
            /* One car is not a comparison — that is the detail page. Rather
               than render a single column, this says what is missing. */
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-10 text-center shadow-e4 backdrop-blur-xl">
              <p className="text-ui font-semibold text-white">
                {cars.length === 1 ? 'Pick one more car' : 'Nothing selected yet'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-ui-sm leading-relaxed text-white/60">
                Choose two to {MAX} cars from the database using the Compare button on each
                card, then open this page.
              </p>
              <Link
                href="/cars"
                className="group/cta mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-ui-sm font-semibold text-slate-950 transition-colors hover:bg-plug-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
