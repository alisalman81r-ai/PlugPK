// src/components/range/ListingsGuide.tsx
import Link from 'next/link'

import { ArrowRight } from '@/components/ui/icons'

import type { StandardCounts } from './types'

/**
 * What a buyer in Pakistan actually sees, and how to read it.
 *
 * The counts are the catalogue's own, read at build time: how many of the EVs
 * we list quote each standard, and how many quote none. That mix is the
 * problem in one line — side-by-side listings here are routinely on different
 * tests — so it is shown rather than described.
 *
 * The worked example is one car with two published figures, so it shows the
 * effect without suggesting any car is better than another.
 */

export interface ListingsGuideProps {
  counts: StandardCounts
}

const STEPS = [
  {
    title: 'Find the standard',
    body: 'Look for WLTP, EPA, NEDC or CLTC beside the figure. If a listing doesn’t say, ask the dealer — a range without its standard can’t be compared.',
  },
  {
    title: 'Put both cars on one standard',
    body: 'Enter both in “Compare two listings” above. It puts them on WLTP and shows how far apart they are likely to be — spreads included.',
  },
  {
    title: 'Plan on the lower end',
    body: 'For a trip you care about — a summer motorway run especially — use the lower end of the real-world estimate, and keep a charger in reach.',
  },
]

export function ListingsGuide({ counts }: ListingsGuideProps) {
  const total = counts.WLTP + counts.EPA + counts.NEDC + counts.CLTC + counts.unstated
  const mix = (
    [
      ['WLTP', counts.WLTP],
      ['NEDC', counts.NEDC],
      ['CLTC', counts.CLTC],
      ['EPA', counts.EPA],
      ['No standard stated', counts.unstated],
    ] as const
  ).filter(([, n]) => n > 0)

  return (
    <section aria-labelledby="listings-heading" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-700">On Pakistani listings</p>
        <h2
          id="listings-heading"
          className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          Why two EVs can look further apart than they are
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-600">
          EVs reach Pakistan from Europe, China and elsewhere, and each brings the figure from its home market. So
          one listing might quote WLTP and the next a Chinese CLTC figure — and the CLTC car can look far
          ahead when the two are much closer on the same test.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-ui-sm font-semibold text-slate-900">Same car, two official figures</p>
          <p className="mt-1 text-ui-sm text-slate-500">BYD Atto 3, 60.48 kWh battery, as published by BYD</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="block text-ui-sm font-bold tracking-wide text-slate-500">CLTC</span>
              <span className="text-2xl font-bold tabular-nums text-slate-900">510 km</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="block text-ui-sm font-bold tracking-wide text-slate-500">WLTP</span>
              <span className="text-2xl font-bold tabular-nums text-slate-900">420 km</span>
            </div>
          </div>
          <p className="mt-3 text-ui-sm leading-relaxed text-slate-600">
            Nothing about the car changed — only the test. A 90 km gap between two listings can be entirely this.
          </p>
        </div>

        {total > 0 ? (
          <div className="mt-4 rounded-2xl bg-slate-100/80 p-5">
            <p className="text-ui-sm font-semibold text-slate-900">
              The {total} EVs in our own catalogue quote:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {mix.map(([label, n]) => (
                <li
                  key={label}
                  className="inline-flex items-baseline gap-1.5 rounded-full bg-white px-3 py-1.5 text-ui-sm text-slate-600"
                >
                  <span className="font-bold tabular-nums text-slate-900">{n}</span>
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/cars"
              className="mt-4 inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-600 hover:text-plug-cyan-700"
            >
              Browse the cars
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="lg:pt-10">
        <h3 className="text-ui font-semibold text-slate-900">Comparing two listings</h3>
        <ol className="mt-5 space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-plug-blue-600 text-ui-sm font-bold text-white"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-ui font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-ui leading-relaxed text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-ui-sm leading-relaxed text-slate-500">
          Range is one number among several. Battery size, charging speed and where you can charge matter as much
          for what an EV is like to live with — and none of this says which car is better for you.
        </p>
      </div>
    </section>
  )
}
