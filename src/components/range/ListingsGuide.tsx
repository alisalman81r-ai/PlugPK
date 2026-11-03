// src/components/range/ListingsGuide.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { useIsoLayoutEffect } from '@/components/tools/motion'
import { Reveal } from '@/components/v2/Reveal'
import { CARD, Eyebrow, H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import { ArrowRight } from '@/components/ui/icons'
import { gsap, prefersReduced } from '@/lib/gsap'
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
 *
 * Motion (landing-v2 page-range-converter.js entrances): as each block comes
 * into view the two figures count up, their bars grow from the left (1.3s,
 * 0.12s apart), the catalogue strip grows segment by segment (1s, 0.08s
 * apart), and the three steps rise in on a soft overshoot (0.9s
 * back.out(1.4), 0.08s apart).
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

  const rootRef = React.useRef<HTMLElement>(null)
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReduced()) return
    const ctx = gsap.context((self) => {
      const one = (sel: string) => self.selector!(sel)[0] as Element | undefined
      const grow = { scaleX: 0, transformOrigin: '0 50%', ease: 'expo.out' }
      const byd = one('[data-byd]')
      if (byd) gsap.from(self.selector!('[data-byd-bar]'), { ...grow, duration: 1.3, stagger: 0.12, scrollTrigger: { trigger: byd, start: 'top 80%' } })
      const catq = one('[data-catq]')
      if (catq) gsap.from(self.selector!('[data-catq-s]'), { ...grow, duration: 1, stagger: 0.08, scrollTrigger: { trigger: catq, start: 'top 85%' } })
      const howto = one('[data-howto]')
      if (howto)
        gsap.from(self.selector!('[data-howto-step]'), {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'back.out(1.4)',
          stagger: 0.08,
          scrollTrigger: { trigger: howto, start: 'top 80%' },
        })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      aria-labelledby="listings-heading"
      className="grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div className="grid gap-4">
        <header data-shead="" className="mb-4 grid justify-items-start">
          <div data-shead-eyebrow="">
            <Eyebrow>On Pakistani listings</Eyebrow>
          </div>
          <h2 id="listings-heading" data-split="" className={cn(H2_CLASS, 'text-ink')}>
            Why two EVs can look <Hl>further apart</Hl> than they are
          </h2>
          <p data-shead-lead="" className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
            EVs reach Pakistan from Europe, China and elsewhere, and each brings the figure from its home market. So one
            listing might quote WLTP and the next a Chinese CLTC figure — and the CLTC car can look far ahead when the
            two are much closer on the same test.
          </p>
        </header>

        <Reveal>
          <article data-byd="" className={cn(CARD, 'p-[18px] sm:p-[26px]')}>
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
                    <span data-count={figure}>{figure}</span> km
                  </b>
                  <i
                    aria-hidden="true"
                    data-byd-bar=""
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
            <div data-catq="" className="rounded-[28px] border border-ink/10 bg-chalk px-5 py-6 sm:px-[26px]">
              <p className="text-[15px] font-semibold text-ink">The {total} EVs in our own catalogue quote:</p>
              <div aria-hidden="true" className="mt-4 flex h-3 gap-[3px]">
                {mix.map(([label, n]) => (
                  <i
                    key={label}
                    data-catq-s=""
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
                <ArrowRight size={18} className="transition-transform duration-[350ms] ease-spring group-hover/l:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        ) : null}
      </div>

      <aside aria-labelledby="listing-steps" className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
        <div
          data-theme="dark"
          data-reveal=""
          data-howto=""
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
                data-howto-step=""
                className="group/step grid grid-cols-[44px_1fr] gap-3 border-t border-white/[0.09] py-4 sm:grid-cols-[56px_1fr] sm:gap-4"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[44px] leading-[0.9] text-transparent [-webkit-text-stroke:1.4px_rgba(255,255,255,.4)] [transition:color_.35s,-webkit-text-stroke-color_.35s] group-hover/step:text-volt group-hover/step:[-webkit-text-stroke-color:#D4FF3A] sm:text-[54px]"
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
