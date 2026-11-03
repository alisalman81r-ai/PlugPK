// src/components/range/RoadEstimates.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { MovingBar, TweenNumber, useIsoLayoutEffect } from '@/components/tools/motion'
import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { CARD, Eyebrow, H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import { ArrowUpRight, Gauge, Info, Route, Sun, Users } from '@/components/ui/icons'
import type { IconType } from '@/components/ui/icons'
import { gsap, prefersReduced } from '@/lib/gsap'
import type { RangeStandard, RoadEstimate, ScenarioId } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import type { RangeCar } from './types'

/**
 * What the quoted figure might come to on Pakistani roads.
 *
 * Three situations, each a band rather than a number, each with the
 * measurement it rests on printed underneath — the point of this block is
 * that a test-cycle figure is a starting line, so it would undo itself by
 * giving one confident answer. Where the catalogue has what owners report for
 * the chosen car, that sits beside the estimates, labelled for what it is.
 *
 * Each card's bar is the quoted figure end to end: the ink segment is the
 * likely band, the volt tick the most likely figure.
 *
 * Motion (landing-v2): the heading block rises in whole — it holds a live
 * figure, so its words are not split — and each card's band and tick grow
 * from the left as the card comes into view (1.2s expo.out). The figures
 * roll and the band glides whenever the quoted range changes.
 */

const ICONS: Record<ScenarioId, IconType> = {
  mixed: Route,
  summer: Sun,
  motorway: Gauge,
}

export interface RoadEstimatesProps {
  estimates: RoadEstimate[]
  km: number
  standard: RangeStandard
  car: RangeCar | null
}

const NOTE = 'flex gap-3.5 rounded-[20px] border border-ink/10 bg-chalk px-[22px] py-[18px] text-[14.5px] leading-[1.6] text-muted [&_strong]:font-semibold [&_strong]:text-ink'

export function RoadEstimates({ estimates, km, standard, car }: RoadEstimatesProps) {
  const owner = car && car.ownerLowKm ? car : null
  const share = (v: number) => Math.min(100, (v / km) * 100)

  const rootRef = React.useRef<HTMLElement>(null)
  useIsoLayoutEffect(() => {
    if (!rootRef.current || prefersReduced()) return
    const ctx = gsap.context((self) => {
      self.selector!('[data-rw-card]').forEach((card: Element) =>
        gsap.from(card.querySelectorAll('[data-rw-mark]'), {
          scaleX: 0,
          transformOrigin: '0 50%',
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 85%' },
        }),
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} aria-labelledby="road-heading">
      <header data-reveal="" className="mb-[clamp(32px,4vw,48px)] grid justify-items-start">
        <Eyebrow>Real-world estimate</Eyebrow>
        <h2 id="road-heading" className={cn(H2_CLASS, 'text-ink')}>
          <span className="whitespace-nowrap">
            {km.toLocaleString('en-PK')} km {standard}
          </span>{' '}
          on <Hl>Pakistani roads</Hl>
        </h2>
        <p className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
          A test figure is a starting line, not a promise. Here is roughly where it tends to land, in three situations
          that published tests have actually measured. Treat each as a likely band for a healthy battery, not a figure
          for your car.
        </p>
      </header>

      <RevealGroup className="grid gap-4 lg:grid-cols-3">
        {estimates.map((e) => {
          const Icon = ICONS[e.scenario.id]
          return (
            <RevealItem key={e.scenario.id} className="h-full">
              <article
                data-rw-card=""
                className={cn(
                  CARD,
                  // .rw__card:hover — up 4px and the deeper shadow, on the card's .45s out-curve
                  'group/rw flex h-full flex-col px-5 pb-6 pt-[22px] [transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:shadow-e2 hover:[translate:0_-4px] sm:px-[26px] sm:pt-[26px]',
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-chalk text-ink transition-colors duration-300 group-hover/rw:bg-ink group-hover/rw:text-volt">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="mb-1 mt-0.5 font-display text-[21px] leading-[1.15] text-ink">{e.scenario.title}</h3>
                    <p className="text-[13.5px] leading-[1.45] text-muted">{e.scenario.conditions}</p>
                  </div>
                </div>

                <p className="mt-[26px] whitespace-nowrap font-mono text-[clamp(38px,3.6vw,52px)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink">
                  <TweenNumber value={e.low} format={String} />–<TweenNumber value={e.high} format={String} />
                  <small className="ml-2 text-base font-medium tracking-normal text-muted">km</small>
                </p>
                <p className="mt-2.5 text-[14.5px] text-muted">
                  Most likely around{' '}
                  <b className="font-mono font-semibold text-ink">
                    <TweenNumber value={e.typical} format={String} /> km
                  </b>
                </p>

                <div aria-hidden="true" className="relative mt-7 h-2.5 rounded-[5px] bg-stone after:absolute after:-bottom-1 after:-top-1 after:right-0 after:w-0.5 after:rounded-[1px] after:bg-ink after:content-['']">
                  <MovingBar
                    data-rw-mark=""
                    className="absolute inset-y-0 left-0 w-0 rounded-[5px] bg-ink"
                    left={share(e.low)}
                    width={Math.max(0, share(e.high) - share(e.low))}
                  />
                  <MovingBar
                    data-rw-mark=""
                    className="absolute -top-[5px] left-0 -ml-0.5 h-5 w-1 rounded-sm bg-volt shadow-[0_0_0_2px_#0B0C0E]"
                    left={share(e.typical)}
                  />
                  <span className="absolute -top-[22px] right-0 font-mono text-[10.5px] font-medium text-muted">{standard}</span>
                </div>
                <p className="mt-3 font-mono text-[13px] font-medium tabular-nums text-muted">
                  ~{Math.round((e.typical / km) * 100)}% of the quoted {standard} figure
                </p>

                <p className="mt-auto pt-[22px] text-[13px] leading-[1.5] text-muted">
                  <span className="block border-t border-dashed border-ink/15 pt-3.5">
                    <b className="font-semibold text-ink">Based on:</b> {e.scenario.basis}
                  </span>
                </p>
              </article>
            </RevealItem>
          )
        })}
      </RevealGroup>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <p data-reveal="" className={NOTE}>
          <Info size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
          <span>
            <strong>Motorway in June, car full?</strong> Expect less than the motorway band. Heat, AC and weight each
            take their share on top of speed — nobody has published a clean measurement of all three together, so we
            won&rsquo;t put a number on it.
          </span>
        </p>

        {owner ? (
          <div data-reveal="" className={cn(NOTE, 'border-volt-edge bg-volt-tint')}>
            <Users size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
            <p>
              <strong>
                Owners of the {owner.name} report {owner.ownerLowKm}
                {owner.ownerHighKm ? `–${owner.ownerHighKm}` : ''} km.
              </strong>{' '}
              That is from our catalogue, not a test: how and where each owner drives varies, so it can sit above or
              below the estimates here.{' '}
              <Link
                href={`/cars/${owner.slug}`}
                className="inline-flex items-center gap-0.5 font-semibold text-ink underline decoration-volt-ink/50 underline-offset-[3px]"
              >
                Car details
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </p>
          </div>
        ) : (
          <p data-reveal="" className={NOTE}>
            <Route size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
            <span>
              <strong>City traffic is kinder to an EV</strong> than to a petrol car. Crawling and stopping cost little,
              and braking puts some energy back — it&rsquo;s sustained speed and heat that shrink the range.
            </span>
          </p>
        )}
      </div>
    </section>
  )
}
