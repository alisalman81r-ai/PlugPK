// src/components/range/ListingsGuide.tsx
import Link from 'next/link'

import { Reveal } from '@/components/v2/Reveal'
import { CARD, Eyebrow, H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import { ArrowRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import { REALISM, TONE_PILL } from './realism'

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

/** Each standard's colour in the catalogue strip and its count chip. */
const MIX_TONE: Record<string, string> = {
  WLTP: 'bg-ink text-white',
  NEDC: 'bg-[#8A5300] text-white',
  CLTC: 'bg-[#B42E05] text-white',
  EPA: 'bg-[#157A45] text-white',
  'No standard stated': 'bg-stone text-ink',
}

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
    <section
      aria-labelledby="listings-heading"
      className="grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div className="grid gap-4">
        <header className="mb-4 grid justify-items-start">
          <Eyebrow>On Pakistani listings</Eyebrow>
          <h2 id="listings-heading" className={cn(H2_CLASS, 'text-ink')}>
            Why two EVs can look <Hl>further apart</Hl> than they are
          </h2>
          <p className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
            EVs reach Pakistan from Europe, China and elsewhere, and each brings the figure from its home market. So one
            listing might quote WLTP and the next a Chinese CLTC figure — and the CLTC car can look far ahead when the
            two are much closer on the same test.
          </p>
        </header>

        <Reveal>
          <article className={cn(CARD, 'p-[18px] sm:p-[26px]')}>
            <h3 className="font-display text-[22px] leading-[1.15] text-ink">Same car, two official figures</h3>
            <p className="mt-1.5 text-sm text-muted">BYD Atto 3, 60.48 kWh battery, as published by BYD</p>
            <div className="mt-[22px] grid gap-3.5">
              {(
                [
                  ['CLTC', 510, 1],
                  ['WLTP', 420, 420 / 510],
                ] as const
              ).map(([std, figure, w]) => (
                <div
                  key={std}
                  className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-2xl bg-[#F7F6F1] px-4 py-3.5 sm:grid-cols-[74px_auto_1fr]"
                >
                  <span className={cn(TONE_PILL, 'justify-self-start', REALISM[std].tone)}>{std}</span>
                  <b className="whitespace-nowrap font-mono text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
                    {figure} km
                  </b>
                  <i
                    aria-hidden="true"
                    className={cn('col-span-full block h-2 rounded sm:col-span-1', std === 'CLTC' ? 'bg-ink' : 'bg-volt-ink')}
                    style={{ width: `${w * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-[18px] text-[14.5px] leading-[1.6] text-muted">
              Nothing about the car changed — only the test. A 90 km gap between two listings can be entirely this.
            </p>
          </article>
        </Reveal>

        {total > 0 ? (
          <Reveal>
            <div className="rounded-[28px] border border-ink/10 bg-chalk px-5 py-6 sm:px-[26px]">
              <p className="text-[15px] font-semibold text-ink">The {total} EVs in our own catalogue quote:</p>
              <div aria-hidden="true" className="mt-4 flex h-3 gap-[3px]">
                {mix.map(([label, n]) => (
                  <i
                    key={label}
                    className={cn(
                      'rounded-[3px]',
                      label === 'No standard stated'
                        ? 'border border-fog bg-[repeating-linear-gradient(-45deg,#A8A59B_0_3px,transparent_3px_6px)]'
                        : MIX_TONE[label],
                    )}
                    style={{ flex: `${n} 1 0` }}
                  />
                ))}
              </div>
              <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0">
                {mix.map(([label, n]) => (
                  <li
                    key={label}
                    className="inline-flex h-[34px] items-center gap-[7px] rounded-full border border-ink/10 bg-white pl-1.5 pr-[13px] text-[13.5px] text-ink"
                  >
                    <b
                      className={cn(
                        'inline-grid h-6 min-w-6 place-items-center rounded-full px-[5px] font-mono text-xs font-semibold',
                        MIX_TONE[label],
                      )}
                    >
                      {n}
                    </b>
                    {label}
                  </li>
                ))}
              </ul>
              <Link
                href="/cars"
                className="group/l mt-2 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-ink"
              >
                Browse the cars
                <ArrowRight size={18} className="transition-transform duration-300 ease-spring group-hover/l:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        ) : null}
      </div>

      <aside aria-labelledby="listing-steps" className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
        <div
          data-theme="dark"
          className="relative isolate overflow-hidden rounded-[28px] bg-ink px-5 py-6 text-white sm:p-[30px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-[1] bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.03)_22px_23px)]"
          />
          <h3 id="listing-steps" className="mb-[22px] font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt">
            Comparing two listings
          </h3>
          <ol className="m-0 grid list-none gap-1 p-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="group/step grid grid-cols-[44px_1fr] gap-3 border-t border-white/[0.09] py-4 sm:grid-cols-[56px_1fr] sm:gap-4"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[44px] leading-[0.9] text-transparent transition-colors duration-300 [-webkit-text-stroke:1.4px_rgba(255,255,255,.4)] group-hover/step:text-volt group-hover/step:[-webkit-text-stroke-color:#D4FF3A] sm:text-[54px]"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="mb-1.5 mt-1 font-display text-xl leading-[1.2] text-white pg-medium">{step.title}</p>
                  <p className="text-[14.5px] leading-[1.6] text-white/70">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3.5 border-t border-white/[0.09] pt-[18px] text-[13.5px] leading-[1.6] text-white/55">
            Range is one number among several. Battery size, charging speed and where you can charge matter as much for
            what an EV is like to live with — and none of this says which car is better for you.
          </p>
        </div>
      </aside>
    </section>
  )
}
