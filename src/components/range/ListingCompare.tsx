// src/components/range/ListingCompare.tsx
'use client'

import * as React from 'react'

import { MovingBar, TweenNumber, useIsoLayoutEffect } from '@/components/tools/motion'
import { CARD, Eyebrow, H2_CLASS, Hl, LEAD_CLASS, SEG, segButtonClass } from '@/components/v2/ui'
import { Info } from '@/components/ui/icons'
import { gsap, prefersReduced } from '@/lib/gsap'
import { compareListings, STANDARD_ORDER, type RangeStandard } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import { Axis } from './Axis'

/**
 * Two listings, put on the same test.
 *
 * The Pakistani listings problem in one control: one car quoted on CLTC, the
 * other on WLTP, and a gap between them that may be mostly the tests. Both are
 * restated on WLTP with their likely spreads, and the verdict says only how
 * the ranges relate — never which car to buy.
 *
 * Listing A starts from whatever the converter above holds, so a driver who
 * has already entered one car only has to add the other. After that the two
 * are independent: editing A here does not rewrite the converter.
 *
 * Motion (landing-v2 renderCompare): the two tracks grow from the left when
 * the result scrolls into view; then the figures roll (0.8s), the spreads and
 * markers glide (0.9s), and a changed verdict lifts into place (0.6s), all on
 * expo.out.
 */

export interface ListingCompareProps {
  initialKm: number | null
  initialStandard: RangeStandard | null
}

interface Side {
  km: string
  standard: RangeStandard
}

function parse(text: string): number | null {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) && n > 0 && n <= 2000 ? n : null
}

export function ListingCompare({ initialKm, initialStandard }: ListingCompareProps) {
  const [a, setA] = React.useState<Side>({ km: initialKm ? String(initialKm) : '510', standard: initialStandard ?? 'CLTC' })
  // A China-spec figure, so the first view already shows two standards side by
  // side against the converter's default (420 km WLTP) — the real case.
  const [b, setB] = React.useState<Side>({ km: '510', standard: 'CLTC' })

  // Follow the converter until the driver edits A here themselves.
  const touchedA = React.useRef(false)
  React.useEffect(() => {
    if (touchedA.current || !initialKm || !initialStandard) return
    setA({ km: String(initialKm), standard: initialStandard })
  }, [initialKm, initialStandard])

  const kmA = parse(a.km)
  const kmB = parse(b.km)
  const result = kmA && kmB ? compareListings({ km: kmA, standard: a.standard }, { km: kmB, standard: b.standard }) : null

  // The shared WLTP scale under both bars (the design's compare axis): from a
  // round figure below the lower band to just past the larger figure.
  let scale: { a: number; b: number } | null = null
  if (result && kmA && kmB) {
    const top = Math.max(result.a.high, result.b.high, kmA, kmB)
    const lo0 = Math.min(result.a.low, result.b.low)
    scale = {
      a: Math.max(0, Math.floor((lo0 - Math.max(30, (top - lo0) * 0.5)) / 50) * 50),
      b: Math.ceil((top * 1.05) / 50) * 50,
    }
  }
  const at = (v: number) => (scale ? Math.min(100, Math.max(0, ((v - scale.a) / (scale.b - scale.a)) * 100)) : 0)

  /* the tracks grow in as the result comes into view */
  const outRef = React.useRef<HTMLDivElement>(null)
  useIsoLayoutEffect(() => {
    const out = outRef.current
    if (!out || prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-cmp-track] > i', {
        scaleX: 0,
        transformOrigin: '0 50%',
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: out, start: 'top 80%' },
      })
    }, out)
    return () => ctx.revert()
  }, [])

  /* a new verdict lifts into place */
  const verdictRef = React.useRef<HTMLParagraphElement>(null)
  const lastVerdict = React.useRef<string | null>(null)
  useIsoLayoutEffect(() => {
    const el = verdictRef.current
    if (!el) {
      lastVerdict.current = null
      return
    }
    const text = el.textContent ?? ''
    if (lastVerdict.current !== null && lastVerdict.current !== text && !prefersReduced()) {
      gsap.fromTo(el, { y: 8, autoAlpha: 0.4 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' })
    }
    lastVerdict.current = text
  })

  return (
    <section aria-labelledby="compare-heading">
      <header data-shead="" className="mb-[clamp(32px,4vw,48px)] grid justify-items-start">
        <div data-shead-eyebrow="">
          <Eyebrow>Compare two listings</Eyebrow>
        </div>
        <h2 id="compare-heading" data-split="" className={cn(H2_CLASS, 'text-ink')}>
          Put both cars on the <Hl>same test</Hl>
        </h2>
        <p data-shead-lead="" className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
          Two listings on different standards can&rsquo;t be compared as they stand. Enter both — we restate them on
          WLTP and show how far apart they really are likely to be.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ListingInput
            name="A"
            side={a}
            onChange={(next) => {
              touchedA.current = true
              setA(next)
            }}
            invalid={a.km.trim() !== '' && kmA == null}
          />
          <ListingInput name="B" side={b} onChange={setB} invalid={b.km.trim() !== '' && kmB == null} />
        </div>

        <div ref={outRef} data-reveal="" aria-live="polite" className={cn(CARD, 'px-[18px] py-5 sm:px-[30px] sm:py-7')}>
          {result && kmA && kmB && scale ? (
            <>
              <p className="mb-[22px] text-[15px] text-muted">
                {result.listedGap === 0 ? (
                  'Listed at the same figure. '
                ) : (
                  <>
                    As listed, they are{' '}
                    <b className="font-mono font-semibold text-ink">
                      <TweenNumber value={result.listedGap} /> km
                    </b>{' '}
                    apart.{' '}
                  </>
                )}
                {result.sameStandard
                  ? `Both are on ${a.standard} already, so they compare directly:`
                  : 'On the same test (WLTP):'}
              </p>

              <ul className="m-0 grid list-none gap-[22px] p-0">
                {(
                  [
                    ['A', result.a, kmA, a.standard],
                    ['B', result.b, kmB, b.standard],
                  ] as const
                ).map(([name, band, listed, standard]) => {
                  const exact = band.low === band.high
                  return (
                    <li key={name}>
                      <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="inline-flex flex-wrap items-center gap-2.5 text-[15px] font-semibold text-ink">
                          <Badge>{name}</Badge>
                          Listing {name}
                          <span className="font-mono text-[13px] font-medium text-muted">
                            · {listed} km {standard}
                          </span>
                        </span>
                        <span className="whitespace-nowrap font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
                          {result.sameStandard || standard === 'WLTP' ? '' : <span className="font-normal text-fog">~</span>}
                          <TweenNumber value={band.typical} format={String} /> km
                          {!exact ? (
                            <small className="ml-2 text-[13px] font-medium tracking-normal text-muted">
                              <TweenNumber value={band.low} format={String} />–<TweenNumber value={band.high} format={String} />
                            </small>
                          ) : null}
                        </span>
                      </div>
                      <div aria-hidden="true" data-cmp-track="" className="relative h-4 rounded-lg bg-stone">
                        <MovingBar
                          className={cn(
                            'absolute inset-y-0 left-0 w-0 min-w-[6px] rounded-lg',
                            name === 'A'
                              ? 'bg-ink'
                              : 'bg-[repeating-linear-gradient(-45deg,#0B0C0E_0_5px,#34373D_5px_8px)]',
                          )}
                          style={{ marginLeft: exact ? '-3px' : undefined }}
                          left={at(band.low)}
                          width={Math.max(0, at(band.high) - at(band.low))}
                        />
                        {/* Kept when exact (hidden, as .is-exact does), so it can glide back. */}
                        <MovingBar
                          className={cn(
                            'absolute -top-[5px] left-0 -ml-0.5 h-[26px] w-1 rounded-sm bg-volt shadow-[0_0_0_2px_#0B0C0E]',
                            exact && 'hidden',
                          )}
                          left={at(band.typical)}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <Axis a={scale.a} b={scale.b} className="mt-3.5" />

              <p ref={verdictRef} className="mt-6 rounded-[18px] border border-[#DDF58C] bg-[#F1FFD0] px-5 py-[18px] text-[15px] leading-[1.6] text-[#2B3800] [&_strong]:font-bold [&_strong]:text-ink">
                {result.relation === 'level' ? (
                  <>
                    <strong>Level on range.</strong> Same figure, same test. If you meant to compare two different cars,
                    enter the other listing&rsquo;s figure.
                  </>
                ) : result.sameStandard && result.gap ? (
                  <>
                    <strong>
                      Listing {result.relation === 'a-further' ? 'A' : 'B'} is rated {result.gap.low} km further
                    </strong>{' '}
                    on {a.standard}. No conversion needed — both came from the same test, so this gap is the cars.
                  </>
                ) : result.relation === 'overlap' ? (
                  result.listedGap === 0 ? (
                    <>
                      <strong>Not as equal as they look.</strong> The same figure on {a.standard} and {b.standard} means
                      different things: on WLTP they come to about {result.a.typical} and {result.b.typical} km, though
                      their likely spreads overlap.
                    </>
                  ) : (
                    <>
                      <strong>Closer than they look.</strong> Their likely spreads overlap, so on the same test these two
                      could be near level — much of the {result.listedGap} km gap may be the tests, not the cars.
                    </>
                  )
                ) : result.gap ? (
                  <>
                    <strong>Listing {result.relation === 'a-further' ? 'A' : 'B'} is likely to go further</strong> on the
                    same test — by roughly {result.gap.low}–{result.gap.high} km
                    {result.listedGap > 0 ? `, against the ${result.listedGap} km the listings suggest` : ''}.
                  </>
                ) : null}
              </p>

              <p className="mt-4 flex gap-2.5 text-[13px] leading-[1.55] text-muted">
                <Info size={18} className="mt-px shrink-0" aria-hidden="true" />
                <span>
                  Range only. Battery size, charging speed, price and where you can charge matter too — this says
                  nothing about which car suits you.
                </span>
              </p>
            </>
          ) : (
            <div className="grid min-h-[12rem] place-items-center text-center">
              <p className="max-w-xs text-sm text-muted">
                Enter both listings&rsquo; ranges — any figure from 1 to 2,000 km — to compare them.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-grid size-[26px] place-items-center rounded-lg bg-ink font-mono text-xs font-semibold text-white">
      {children}
    </span>
  )
}

function ListingInput({
  name,
  side,
  onChange,
  invalid,
}: {
  name: 'A' | 'B'
  side: Side
  onChange: (next: Side) => void
  invalid: boolean
}) {
  const id = React.useId()
  const label = `Listing ${name}`
  return (
    <fieldset data-reveal="" className={cn(CARD, 'm-0 grid min-w-0 gap-3.5 p-[18px] sm:p-[22px]')}>
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-ink">
          <Badge>{name}</Badge>
          {label}
        </label>
        {invalid ? <span className="text-[13px] font-medium text-[#B42E05]">Check the figure</span> : null}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={2000}
          value={side.km}
          onChange={(e) => onChange({ ...side, km: e.target.value })}
          aria-invalid={invalid ? true : undefined}
          className={cn(
            'h-16 w-full min-w-0 appearance-none rounded-[14px] border-[1.5px] bg-white pl-4 pr-[52px] font-mono text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink focus:shadow-focus [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            invalid ? 'border-[#FFB59C]' : 'border-ink/10 hover:border-ink/25',
          )}
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-4 font-mono text-sm font-medium text-muted">
          km
        </span>
      </div>
      <div role="radiogroup" aria-label={`${label} standard`} className={cn(SEG, 'grid w-full grid-cols-4')}>
        {STANDARD_ORDER.map((s) => {
          const on = side.standard === s
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ ...side, standard: s })}
              className={cn(
                segButtonClass(on, 'min-h-11 content-center px-1 font-mono tracking-[0.04em] focus-visible:shadow-focus focus-visible:outline-none sm:px-2'),
                on && 'bg-ink text-white',
              )}
            >
              {s}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
