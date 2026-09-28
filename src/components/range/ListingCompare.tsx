// src/components/range/ListingCompare.tsx
'use client'

import * as React from 'react'

import { Info } from '@/components/ui/icons'
import { compareListings, STANDARD_ORDER, type RangeStandard } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

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

  const max = result ? Math.max(result.a.high, result.b.high, kmA ?? 0, kmB ?? 0) * 1.05 : 1
  const pct = (km: number) => `${Math.min(100, (km / max) * 100)}%`

  return (
    <section aria-labelledby="compare-heading" id="compare">
      <div className="max-w-2xl">
        <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-700">Compare two listings</p>
        <h2
          id="compare-heading"
          className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          Put both cars on the same test
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-600">
          Two listings on different standards can&rsquo;t be compared as they stand. Enter both — we restate them on
          WLTP and show how far apart they really are likely to be.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <ListingInput
            label="Listing A"
            side={a}
            onChange={(next) => {
              touchedA.current = true
              setA(next)
            }}
            invalid={a.km.trim() !== '' && kmA == null}
          />
          <ListingInput label="Listing B" side={b} onChange={setB} invalid={b.km.trim() !== '' && kmB == null} />
        </div>

        <div aria-live="polite" className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 sm:p-7">
          {result && kmA && kmB ? (
            <>
              <p className="text-ui-sm text-slate-500">
                {result.listedGap === 0 ? (
                  'Listed at the same figure. '
                ) : (
                  <>
                    As listed, they are{' '}
                    <span className="font-semibold text-slate-900">{result.listedGap.toLocaleString('en-PK')} km</span>{' '}
                    apart.{' '}
                  </>
                )}
                {result.sameStandard
                  ? `Both are on ${a.standard} already, so they compare directly:`
                  : 'On the same test (WLTP):'}
              </p>

              <ul className="mt-5 space-y-5">
                {(
                  [
                    ['A', result.a, kmA, a.standard],
                    ['B', result.b, kmB, b.standard],
                  ] as const
                ).map(([name, band, listed, standard]) => (
                  <li key={name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-ui font-semibold text-slate-900">
                        Listing {name}{' '}
                        <span className="font-normal text-slate-500">
                          · {listed} km {standard}
                        </span>
                      </span>
                      <span className="text-right text-ui font-bold tabular-nums text-slate-900">
                        {result.sameStandard || standard === 'WLTP' ? '' : '~'}
                        {band.typical} km
                        {band.low !== band.high ? (
                          <span className="ml-1.5 text-ui-sm font-normal text-slate-500">
                            {band.low}–{band.high}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div aria-hidden="true" className="relative mt-2 h-3">
                      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
                      <span
                        className={cn(
                          'absolute top-0 h-3 rounded-full transition-[left,width] duration-300 ease-out motion-reduce:transition-none',
                          name === 'A' ? 'bg-plug-blue-600' : 'bg-plug-cyan-500',
                        )}
                        style={{
                          left: pct(band.low),
                          width: band.low === band.high ? '6px' : `calc(${pct(band.high)} - ${pct(band.low)})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3.5 text-ui leading-relaxed text-slate-700">
                {result.relation === 'level' ? (
                  <>
                    <strong className="font-semibold text-slate-900">Level on range.</strong> Same figure, same
                    test. If you meant to compare two different cars, enter the other listing&rsquo;s figure.
                  </>
                ) : result.sameStandard && result.gap ? (
                  <>
                    <strong className="font-semibold text-slate-900">
                      Listing {result.relation === 'a-further' ? 'A' : 'B'} is rated {result.gap.low} km further
                    </strong>{' '}
                    on {a.standard}. No conversion needed — both came from the same test, so this gap is the cars.
                  </>
                ) : result.relation === 'overlap' ? (
                  result.listedGap === 0 ? (
                    <>
                      <strong className="font-semibold text-slate-900">Not as equal as they look.</strong> The same
                      figure on {a.standard} and {b.standard} means different things: on WLTP they come to about{' '}
                      {result.a.typical} and {result.b.typical} km, though their likely spreads overlap.
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold text-slate-900">Closer than they look.</strong> Their likely
                      spreads overlap, so on the same test these two could be near level — much of the{' '}
                      {result.listedGap} km gap may be the tests, not the cars.
                    </>
                  )
                ) : result.gap ? (
                  <>
                    <strong className="font-semibold text-slate-900">
                      Listing {result.relation === 'a-further' ? 'A' : 'B'} is likely to go further
                    </strong>{' '}
                    on the same test — by roughly {result.gap.low}–{result.gap.high} km
                    {result.listedGap > 0 ? `, against the ${result.listedGap} km the listings suggest` : ''}.
                  </>
                ) : null}
              </p>

              <p className="mt-3 flex gap-2 text-ui-sm leading-relaxed text-slate-500">
                <Info size={16} className="mt-0.5 shrink-0 text-plug-cyan-700" aria-hidden="true" />
                <span>
                  Range only. Battery size, charging speed, price and where you can charge matter too — this says
                  nothing about which car suits you.
                </span>
              </p>
            </>
          ) : (
            <div className="grid h-full min-h-[12rem] place-items-center text-center">
              <p className="max-w-xs text-ui-sm text-slate-500">
                Enter both listings&rsquo; ranges — any figure from 1 to 2,000 km — to compare them.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ListingInput({
  label,
  side,
  onChange,
  invalid,
}: {
  label: string
  side: Side
  onChange: (next: Side) => void
  invalid: boolean
}) {
  const id = React.useId()
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-ui-sm font-semibold text-slate-900">
          {label}
        </label>
        {invalid ? <span className="text-ui-sm text-red-600">Check the figure</span> : null}
      </div>
      <div
        className={cn(
          'mt-2 flex items-center rounded-xl border-[1.5px] bg-white px-4 focus-within:shadow-focus',
          invalid ? 'border-red-300' : 'border-slate-200 focus-within:border-plug-blue-500',
        )}
      >
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={2000}
          value={side.km}
          onChange={(e) => onChange({ ...side, km: e.target.value })}
          className="h-12 w-full min-w-0 bg-transparent text-xl font-bold tabular-nums text-slate-900 outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-ui-sm font-medium text-slate-400">km</span>
      </div>
      <div role="radiogroup" aria-label={`${label} standard`} className="mt-2.5 grid grid-cols-4 gap-1.5">
        {STANDARD_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={side.standard === s}
            onClick={() => onChange({ ...side, standard: s })}
            className={cn(
              'min-h-10 rounded-lg text-ui-sm font-bold tracking-wide transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-1',
              side.standard === s ? 'bg-plug-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
