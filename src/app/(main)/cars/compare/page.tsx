// src/app/(main)/cars/compare/page.tsx
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import * as React from 'react'

import { CarComparison } from '@/components/cars/CarComparison'
import { getCarsByIdsFromDb, listCars } from '@/lib/db/car-queries'

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

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const ids = (searchParams.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX)

  const cars = await getCarsByIdsFromDb(ids)
  // What the add control can offer: everything not already in the table.
  const chosen = new Set(cars.map((car) => car.id))
  const available = (await listCars()).filter((car) => !chosen.has(car.id))

  return (
    /**
     * Light, with real colour under the glass.
     *
     * This was slate-950, on the reasoning that a translucent surface needs
     * something behind it to blur and that the flat white page it replaced
     * rendered the glass as a grey box. The first half of that is right and is
     * why this is not simply white: what makes a panel read as glass is colour
     * varying behind it, not darkness. So the ground keeps the pools and loses
     * the night — a near-white base, a blue wash top-left and a cyan one
     * bottom-right at the opacity a light ground needs to show them, and a
     * slate dot grid instead of a white one.
     *
     * The panels over it are white-tinted rather than white: bg-white/60 with
     * a blur still takes its colour from whichever pool is behind it, which is
     * the effect the dark version was getting and the flat white page was not.
     */
    <section className="relative isolate overflow-hidden bg-[#F4F7FC] py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-56 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-500/25 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 -right-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-plug-cyan-400/25 blur-[130px]"
      />
      <span aria-hidden="true" className="grain -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent_0%,rgba(148,163,184,0.6)_20%,rgba(148,163,184,0.6)_80%,transparent_100%)]"
      />
      <div className="container-plug relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3.5 py-1.5 text-ui-xs font-semibold uppercase tracking-[0.14em] text-plug-navy-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400" />
            Side by side
          </span>
          <h1 className="mt-6 text-balance text-[clamp(2.75rem,6.4vw,4.5rem)] font-black leading-[0.98] tracking-[-0.04em] text-slate-900">
            Compare{' '}
            <span className="text-plug-blue-600">
              cars
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-slate-600">
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
            <div className="rounded-2xl border border-white/80 bg-white/65 p-10 text-center shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl">
              <p className="text-ui font-semibold text-slate-900">
                {cars.length === 1 ? 'Pick one more car' : 'Nothing selected yet'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-ui-sm leading-relaxed text-slate-600">
                Choose two to {MAX} cars from the database using the Compare button on each
                card, then open this page.
              </p>
              <Link
                href="/cars"
                className="group/cta mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-plug-navy-900 px-5 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
