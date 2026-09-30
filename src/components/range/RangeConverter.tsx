// src/components/range/RangeConverter.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { CarPicker, type PickerCar } from '@/components/tools/CarPicker'
import { AlertCircle, ArrowUpRight, Check, Info, Link2 } from '@/components/ui/icons'
import { convertRange, roadEstimates, STANDARDS, type RangeStandard } from '@/lib/range-standards'
import { readRememberedCar, rememberCar } from '@/lib/remembered-car'
import { cn } from '@/lib/utils'

import { ListingCompare } from './ListingCompare'
import { REALISM, REALISM_ORDER } from './realism'
import { RoadEstimates } from './RoadEstimates'
import { StandardsTable } from './StandardsTable'
import type { RangeCar } from './types'

/**
 * The converter: what the driver has, and what it comes to.
 *
 * One card: pick the standard and type the figure on one side, and the four
 * equivalents appear on the other, each marked by how far to trust it. It
 * rises into the page header like the other tools' cards. Under it, the part
 * a generic converter leaves out: what that figure might mean on a road in
 * Pakistan.
 *
 * Nothing here computes. lib/range-standards does, and every number it
 * returns is a band; this file only decides how the driver asks and reads.
 *
 * A car whose catalogue row states no standard fills the figure but leaves
 * the standard unset, and the answer waits for the driver to choose it.
 * Guessing WLTP would be exactly the mistake the page exists to prevent.
 *
 * The figure, standard and car live in the address too (?km=510&std=CLTC),
 * so "what does this listing actually mean" can be sent to someone as a link
 * and opens showing the same answer.
 */

/** Same measure as the charging calculator and /community. */
const STAGE = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10'

/** The tabs and the results both run strictest first. */
const TAB_ORDER = REALISM_ORDER

function parseStandardParam(value: string | null): RangeStandard | null {
  const v = value?.trim().toUpperCase()
  return v === 'EPA' || v === 'WLTP' || v === 'NEDC' || v === 'CLTC' ? v : null
}

/** The picker row: the quoted figure and the test it came from. */
function pickerMeta(c: RangeCar): string {
  const figure = c.rangeMaxKm ? `${c.rangeKm}–${c.rangeMaxKm} km` : `${c.rangeKm} km`
  return c.standard ? `${figure} ${c.standard}` : figure
}

const MAX_KM = 2000

function parseKm(text: string): number | null {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export interface RangeConverterProps {
  cars: RangeCar[]
}

export function RangeConverter({ cars }: RangeConverterProps) {
  const [slug, setSlug] = React.useState('')
  const [kmText, setKmText] = React.useState('420')
  const [standard, setStandard] = React.useState<RangeStandard | null>('WLTP')

  const car = cars.find((c) => c.slug === slug) ?? null

  /*
    Read the address once, after mount — the page is static, so the server
    never sees the query — then keep it in step with every change. replaceState
    rather than pushState: each keystroke is not a page the back button should
    step through.
  */
  const [hydrated, setHydrated] = React.useState(false)
  const [fromMemory, setFromMemory] = React.useState(false)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const linkHasState = q.has('car') || q.has('km') || q.has('std')
    const fromCar =
      cars.find((c) => c.slug === q.get('car')) ??
      (linkHasState ? undefined : cars.find((c) => c.slug === readRememberedCar()))
    if (fromCar) {
      setFromMemory(!q.has('car'))
      setSlug(fromCar.slug)
      setKmText(String(fromCar.rangeKm))
      setStandard(fromCar.standard)
    }
    const qKm = q.get('km')
    if (qKm && Number.isFinite(Number(qKm))) setKmText(qKm)
    const qStd = parseStandardParam(q.get('std'))
    if (qStd) setStandard(qStd)
    setHydrated(true)
  }, [cars])

  React.useEffect(() => {
    if (!hydrated) return
    const q = new URLSearchParams()
    if (slug) q.set('car', slug)
    if (kmText.trim()) q.set('km', kmText.trim())
    if (standard) q.set('std', standard)
    const query = q.toString()
    window.history.replaceState(window.history.state, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  }, [hydrated, slug, kmText, standard])

  const [copied, setCopied] = React.useState<'idle' | 'done' | 'failed'>('idle')
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
    window.setTimeout(() => setCopied('idle'), 2500)
  }

  const pickerCars: PickerCar[] = React.useMemo(
    () =>
      cars.map((c) => ({
        slug: c.slug,
        name: c.name,
        brand: c.brand,
        meta: pickerMeta(c),
        flag: c.standard ? null : 'standard not stated',
      })),
    [cars],
  )

  const chooseCar = (next: string) => {
    setSlug(next)
    setFromMemory(false)
    rememberCar(next || null)
    const picked = cars.find((c) => c.slug === next)
    if (!picked) return
    setKmText(String(picked.rangeKm))
    setStandard(picked.standard)
  }

  const km = parseKm(kmText)
  const kmProblem =
    km == null
      ? kmText.trim() === ''
        ? 'Enter the range from the brochure or listing.'
        : 'Enter the range as a number of kilometres.'
      : km <= 0
        ? 'Enter a range above 0 km.'
        : km > MAX_KM
          ? `No production EV is rated past ${MAX_KM.toLocaleString('en-PK')} km — check the figure.`
          : null
  const showProblem = kmProblem != null && kmText.trim() !== ''

  const ready = !kmProblem && km != null && standard != null
  const converted = ready ? convertRange(km, standard) : null
  // Strictest first, so the list reads from the figure to trust most.
  const rows = converted ? TAB_ORDER.map((s) => converted.find((r) => r.standard === s)!) : null
  const road = ready ? roadEstimates(km, standard) : null

  return (
    <>
      <div className={`relative -mt-20 sm:-mt-24 ${STAGE}`}>
        {/* ── The card: question on the left, answer on the right ───── */}
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(5,36,30,0.05),0_24px_60px_-32px_rgba(5,36,30,0.35)] lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-5 p-5 sm:p-7 lg:p-8">
              <CarPicker
                id="range-car"
                label="Your EV (optional)"
                cars={pickerCars}
                value={slug}
                onChange={chooseCar}
                placeholder="Select your EV to fill this in"
                noneLabel="Not in the list — I’ll type the range"
                hint={
                  car ? (
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ui-sm leading-relaxed text-slate-500">
                      <span>
                        {fromMemory ? 'Remembered from last time. ' : ''}
                        {car.rangeMaxKm
                          ? `Listed at ${car.rangeKm}–${car.rangeMaxKm} km across versions; we've used ${car.rangeKm}.`
                          : `Listed at ${car.rangeKm} km${car.standard ? ` ${car.standard}` : ''}.`}
                      </span>
                      <Link
                        href={`/cars/${car.slug}`}
                        className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
                      >
                        Full specs
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/charging-calculator?car=${car.slug}`}
                        className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
                      >
                        How long to charge it
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    </p>
                  ) : null
                }
              />

              <fieldset>
                <legend className="mb-2 text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Convert from
                </legend>
                {car && !car.standard && standard == null ? (
                  <p className="mb-2.5 flex gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-ui-sm text-amber-900">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                    We don&rsquo;t know which standard this car&rsquo;s figure uses. Check the brochure and pick it here.
                  </p>
                ) : null}
                <div role="radiogroup" aria-label="Range standard" className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
                  {TAB_ORDER.map((s) => {
                    const on = standard === s
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        title={STANDARDS[s].region}
                        onClick={() => setStandard(s)}
                        className={cn(
                          'min-h-11 rounded-xl text-ui-sm font-bold tracking-wide transition-all duration-150 sm:text-ui',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                          on
                            ? 'bg-plug-blue-600 text-white shadow-blue'
                            : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
                        )}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
                {standard ? (
                  <p className="mt-2 text-ui-sm text-slate-500">
                    {standard} is used in {STANDARDS[standard].region}.
                  </p>
                ) : null}
              </fieldset>

              <div>
                <label
                  htmlFor="range-km"
                  className="mb-2 block text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-500"
                >
                  Quoted range
                </label>
                <div
                  className={cn(
                    'flex items-baseline rounded-2xl border-[1.5px] bg-white px-5 py-3 transition-all duration-150 focus-within:shadow-focus',
                    showProblem
                      ? 'border-red-300 focus-within:border-red-400'
                      : 'border-slate-200 focus-within:border-plug-blue-500',
                  )}
                >
                  <input
                    id="range-km"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_KM}
                    step={1}
                    value={kmText}
                    onChange={(e) => setKmText(e.target.value)}
                    aria-invalid={kmProblem ? true : undefined}
                    aria-describedby="range-km-help"
                    className="w-full min-w-0 appearance-none bg-transparent text-[2.25rem] font-bold leading-none tracking-tight tabular-nums text-slate-900 outline-none placeholder:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="420"
                  />
                  <span className="ml-2 shrink-0 text-lg font-semibold text-slate-400">km</span>
                </div>
                <p id="range-km-help" className={`mt-2 text-ui-sm ${showProblem ? 'text-red-600' : 'text-slate-500'}`}>
                  {showProblem ? kmProblem : 'The figure on the brochure, listing or spec sheet.'}
                </p>
              </div>
            </div>

            {/* ── The answer ───────────────────────────────────────────── */}
            <section
              aria-live="polite"
              aria-label="Your range on each standard"
              className="border-t border-slate-100 bg-slate-50/70 px-5 pb-5 pt-4 sm:px-7 sm:pb-6 lg:border-l lg:border-t-0 lg:p-8"
            >
              {rows && km != null && standard ? (
                <>
                  <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {km.toLocaleString('en-PK')} km {standard} is roughly
                  </p>

                  <ul className="mt-2 divide-y divide-slate-200/70">
                    {rows.map((row) => {
                      const r = REALISM[row.standard]
                      return (
                        <li
                          key={row.standard}
                          className={cn(
                            'grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]',
                            row.quoted && '-mx-3 rounded-2xl border-0 bg-white px-3 ring-1 ring-plug-blue-600/15',
                          )}
                        >
                          <div className="leading-tight">
                            <p className="text-[1.75rem] font-bold tracking-tight tabular-nums text-slate-900">
                              {row.quoted ? '' : <span className="mr-0.5 text-slate-400">≈</span>}
                              {row.typical.toLocaleString('en-PK')}
                            </p>
                            <p className="mt-1 text-ui-sm tabular-nums text-slate-500">
                              {row.quoted ? 'km · entered' : `${row.low}–${row.high} km`}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-ui font-bold text-slate-900">{row.standard}</span>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider ring-1 ring-inset',
                                  r.tone,
                                )}
                              >
                                {r.badge}
                              </span>
                            </p>
                            <p className="mt-0.5 text-ui-sm font-medium text-slate-600">{STANDARDS[row.standard].name}</p>
                            <p className="mt-1 text-ui-sm leading-relaxed text-slate-500">{r.note}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
                    <p className="flex max-w-sm gap-2 text-ui-sm leading-relaxed text-slate-500">
                      <Info size={16} className="mt-0.5 shrink-0 text-plug-cyan-700" aria-hidden="true" />
                      Estimates, not exact conversions — the small range under each figure is the likely spread.
                    </p>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2"
                    >
                      {copied === 'done' ? (
                        <Check size={16} className="text-plug-cyan-700" aria-hidden="true" />
                      ) : (
                        <Link2 size={16} aria-hidden="true" />
                      )}
                      {copied === 'done' ? 'Link copied' : copied === 'failed' ? 'Copy the address bar instead' : 'Copy link'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[10rem] flex-col items-center justify-center py-4 text-center">
                  <p className="text-ui font-semibold text-slate-900">
                    {standard == null ? 'Pick the standard to compare' : 'Enter a range to compare'}
                  </p>
                  <p className="mt-1.5 max-w-xs text-ui-sm leading-relaxed text-slate-500">
                    {standard == null
                      ? 'The same figure means different things on each standard, so we need to know which one it is.'
                      : kmProblem}
                  </p>
                </div>
              )}
            </section>
        </div>
      </div>

      <div className={`${STAGE} mt-16 space-y-16 lg:mt-20 lg:space-y-20`}>
        <StandardsTable />

        {road && km != null && standard ? (
          <RoadEstimates estimates={road} km={km} standard={standard} car={car} />
        ) : null}

        <ListingCompare initialKm={ready ? km : null} initialStandard={ready ? standard : null} />
      </div>
    </>
  )
}
