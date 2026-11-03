// src/components/range/RangeConverter.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { CarPicker, type PickerCar } from '@/components/tools/CarPicker'
import { useMyCar } from '@/hooks/useMyCar'
import { AlertCircle, ArrowUpRight, Check, ChevronDown, Gauge, Info, Link2 } from '@/components/ui/icons'
import { FLABEL, Lift, SEG, Section, Wrap, btnClass, segButtonClass } from '@/components/v2/ui'
import { MIN_RANGE_KM, convertRange, roadEstimates, STANDARDS, type RangeStandard } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import { ListingCompare } from './ListingCompare'
import { Axis } from './Axis'
import { REALISM, REALISM_ORDER, TONE_PILL } from './realism'
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


/** The tabs and the results both run strictest first. */
const TAB_ORDER = REALISM_ORDER

function parseStandardParam(value: string | null): RangeStandard | null {
  const v = value?.trim().toUpperCase()
  return v === 'EPA' || v === 'WLTP' || v === 'NEDC' || v === 'CLTC' ? v : null
}

/** The picker row: the quoted figure and the test it came from. */
function pickerMeta(c: RangeCar): string {
  const figure = c.rangeMaxKm && c.rangeMaxKm !== c.rangeKm ? `${c.rangeKm}–${c.rangeMaxKm} km` : `${c.rangeKm} km`
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
  /** The link named a car or a figure of its own, which the driver's car must not override. */
  const linkChose = React.useRef(false)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    linkChose.current = q.has('car') || q.has('km')
    // A shared link picks the car first; otherwise the driver's own car does (below).
    const fromCar = cars.find((c) => c.slug === q.get('car'))
    if (fromCar) {
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

  /*
    The driver's own car, from their garage: picked once, after the link has
    been read, and only when the link chose nothing and the driver has not
    picked anything yet. No car in the garage, nothing is pre-selected.
  */
  const myCar = useMyCar()
  const appliedMyCar = React.useRef(false)
  React.useEffect(() => {
    if (!hydrated || myCar === undefined || appliedMyCar.current) return
    appliedMyCar.current = true
    if (linkChose.current || slug || !myCar) return
    if (cars.some((c) => c.slug === myCar.slug)) chooseCar(myCar.slug)
    // chooseCar is recreated each render; this runs once by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, myCar, cars, slug])

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
      : km < MIN_RANGE_KM
        ? `Enter a range of at least ${MIN_RANGE_KM} km — the figure from the brochure or listing.`
        : km > MAX_KM
          ? `No production EV is rated past ${MAX_KM.toLocaleString('en-PK')} km — check the figure.`
          : null
  const showProblem = kmProblem != null && kmText.trim() !== ''

  const ready = !kmProblem && km != null && standard != null
  const converted = ready ? convertRange(km, standard) : null
  // Strictest first, so the list reads from the figure to trust most.
  const rows = converted ? TAB_ORDER.map((s) => converted.find((r) => r.standard === s)!) : null
  const road = ready ? roadEstimates(km, standard) : null

  /** The nudge buttons on the figure: ±10 km, kept inside the field's limits. */
  const nudge = (by: number) => {
    const base = km != null && Number.isFinite(km) ? km : 0
    setKmText(String(Math.min(MAX_KM, Math.max(1, Math.round(base + by)))))
  }

  // One shared km scale for the four lanes, padded either side (the design's lane maths).
  let scale: { a: number; b: number } | null = null
  if (rows) {
    const lo = Math.min(...rows.map((r) => r.low))
    const hi = Math.max(...rows.map((r) => r.high))
    const pad = Math.max(20, (hi - lo) * 0.18)
    scale = { a: Math.max(0, Math.floor((lo - pad) / 10) * 10), b: Math.ceil((hi + pad) / 10) * 10 }
  }
  const at = (v: number) => (scale ? ((v - scale.a) / (scale.b - scale.a)) * 100 : 0)

  const linkClass =
    'inline-flex min-h-8 items-center gap-1 font-semibold text-ink underline decoration-volt-ink/40 underline-offset-[3px] transition-colors hover:decoration-ink'

  return (
    <>
      <Lift className="overflow-visible">
        {/* ── The sheet: question on the left, the instrument on the right ── */}
        <div className="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="grid content-start gap-[26px] rounded-t-3xl bg-paper bg-[linear-gradient(180deg,#FAF9F5_55%,transparent_100%),radial-gradient(rgba(11,12,14,.08)_1px,transparent_1.5px)] bg-[length:auto,14px_14px] px-[18px] py-[22px] sm:rounded-t-[32px] sm:p-8 md:grid-cols-2 md:gap-x-6 xl:grid-cols-1 xl:rounded-l-[32px] xl:rounded-tr-none">
            <div className="md:col-span-2 xl:col-span-1">
              <CarPicker
                ownCar={myCar}
                id="range-car"
                label="Your EV (optional)"
                plainLabel
                cars={pickerCars}
                value={slug}
                onChange={chooseCar}
                placeholder="Select your EV to fill this in"
                noneLabel="Not in the list — I’ll type the range"
                hint={
                  car ? (
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] leading-[1.5] text-muted">
                      <span>
                        {car.rangeMaxKm && car.rangeMaxKm !== car.rangeKm
                          ? `Listed at ${car.rangeKm}–${car.rangeMaxKm} km across versions; we've used ${car.rangeKm}.`
                          : `Listed at ${car.rangeKm} km${car.standard ? ` ${car.standard}` : ''}.`}
                      </span>
                      <Link href={`/cars/${car.slug}`} className={linkClass}>
                        Full specs
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                      <Link href={`/charging-calculator?car=${car.slug}`} className={linkClass}>
                        How long to charge it
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    </p>
                  ) : null
                }
              />
            </div>

            <fieldset className="m-0 grid min-w-0 gap-2.5 border-0 p-0">
              <legend className={cn(FLABEL, 'mb-2.5 p-0')}>Convert from</legend>
              {car && !car.standard && standard == null ? (
                <p className="flex gap-2.5 rounded-[14px] border border-[#FFE0A3] bg-[#FFF6E3] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#8A5300]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  We don&rsquo;t know which standard this car&rsquo;s figure uses. Check the brochure and pick it here.
                </p>
              ) : null}
              <div role="radiogroup" aria-label="Range standard" className={cn(SEG, 'grid w-full grid-cols-4')}>
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
                        segButtonClass(on, 'min-h-11 content-center px-1.5 font-mono tracking-[0.04em] focus-visible:shadow-focus focus-visible:outline-none sm:px-4'),
                        on && 'bg-ink text-white shadow-[0_8px_18px_-10px_rgba(11,12,14,.6)]',
                      )}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
              {standard ? (
                <p aria-live="polite" className="text-[13px] text-muted">
                  {standard} is used in {STANDARDS[standard].region}.
                </p>
              ) : null}
            </fieldset>

            <div className="grid gap-2">
              <label htmlFor="range-km" className={FLABEL}>
                Quoted range
              </label>
              <div
                className={cn(
                  'relative flex h-20 items-center rounded-[20px] border-[1.5px] bg-white transition-[border-color,box-shadow] duration-200 focus-within:shadow-focus sm:h-[92px]',
                  showProblem ? 'border-[#FFB59C] focus-within:border-[#B42E05]' : 'border-ink/10 focus-within:border-ink',
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
                  className="h-full w-full min-w-0 flex-1 appearance-none bg-transparent pl-[18px] font-mono text-[38px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink outline-none placeholder:text-fog [-moz-appearance:textfield] sm:pl-6 sm:text-[46px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="420"
                />
                <span aria-hidden="true" className="mr-3.5 font-mono text-lg font-medium text-muted">
                  km
                </span>
                <div className="mr-2.5 grid gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(10)}
                    aria-label="Add 10 km"
                    className="grid h-[30px] w-11 place-items-center rounded-[10px] bg-chalk text-ink transition-[background-color,transform] duration-300 ease-spring hover:bg-volt active:scale-90 sm:h-[34px]"
                  >
                    <ChevronDown size={18} className="rotate-180" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(-10)}
                    aria-label="Subtract 10 km"
                    className="grid h-[30px] w-11 place-items-center rounded-[10px] bg-chalk text-ink transition-[background-color,transform] duration-300 ease-spring hover:bg-volt active:scale-90 sm:h-[34px]"
                  >
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p id="range-km-help" className={cn('text-[13px] leading-[1.5]', showProblem ? 'text-[#B42E05]' : 'text-muted')}>
                {showProblem ? kmProblem : 'The figure on the brochure, listing or spec sheet.'}
              </p>
            </div>
          </div>

          {/* ── The answer ───────────────────────────────────────────── */}
          <section
            aria-live="polite"
            aria-label="Your range on each standard"
            data-theme="dark"
            className="relative isolate overflow-hidden rounded-b-3xl bg-ink px-[18px] pb-5 pt-6 text-white sm:rounded-b-[32px] sm:px-8 sm:pb-[26px] sm:pt-[30px] xl:rounded-r-[32px] xl:rounded-bl-none"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-[1] bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:linear-gradient(180deg,#000,transparent_85%)]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-[180px] -top-[200px] -z-[1] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.12),transparent_70%)]"
            />

            {rows && km != null && standard && scale ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.09] pb-4">
                  <p className="font-mono text-xs font-semibold uppercase leading-[1.3] tracking-[0.16em] text-white/60">
                    <span className="tracking-[0.04em] text-white">{km.toLocaleString('en-PK')}</span> km {standard} is roughly
                  </p>
                  <span aria-hidden="true" className="flex gap-[5px]">
                    <i className="size-1.5 rounded-full bg-volt shadow-[0_0_10px_rgba(212,255,58,.8)]" />
                    <i className="size-1.5 rounded-full bg-white/[0.18]" />
                    <i className="size-1.5 rounded-full bg-white/[0.18]" />
                  </span>
                </div>

                <ul className="m-0 list-none p-0">
                  {rows.map((row, i) => {
                    const r = REALISM[row.standard]
                    const prevQuoted = i > 0 && rows[i - 1]?.quoted === true
                    return (
                      <li
                        key={row.standard}
                        className={cn(
                          'relative -mx-2.5 grid grid-cols-1 gap-x-5 gap-y-2.5 rounded-[18px] border px-2.5 pb-3.5 pt-4 transition-colors duration-300 sm:-mx-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-y-3.5 sm:px-4 sm:pb-4 sm:pt-[18px]',
                          row.quoted ? 'border-volt/30 bg-volt/[0.06]' : 'border-transparent',
                          i > 0 &&
                            !row.quoted &&
                            !prevQuoted &&
                            'before:absolute before:inset-x-2.5 before:-top-px before:h-px before:bg-white/[0.09] before:content-[""] sm:before:inset-x-4',
                        )}
                      >
                        <div className="flex items-baseline gap-3 sm:grid sm:content-start sm:gap-1.5">
                          <b
                            className={cn(
                              'whitespace-nowrap font-mono text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[38px]',
                              row.quoted ? 'text-volt' : 'text-white',
                            )}
                          >
                            {row.quoted ? null : <span className="mr-0.5 font-normal text-fog">≈</span>}
                            {row.typical.toLocaleString('en-PK')}
                          </b>
                          <span
                            className={cn(
                              'font-mono text-[12.5px] font-medium leading-[1.2] tabular-nums',
                              row.quoted ? 'text-volt/85' : 'text-fog',
                            )}
                          >
                            {row.quoted ? 'km · entered' : `${row.low}–${row.high} km`}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2.5">
                            <b className="font-mono text-base font-semibold leading-none tracking-[0.06em]">{row.standard}</b>
                            <span className={cn(TONE_PILL, 'h-[22px]', r.toneDark)}>{r.badge}</span>
                          </p>
                          <p className="mt-1.5 text-[13px] text-white/60">{STANDARDS[row.standard].name}</p>
                          <p className="mt-1.5 text-pretty text-sm leading-[1.55] text-white/80">{r.note}</p>
                        </div>
                        {/* Where this standard sits on the shared km scale. */}
                        <div
                          aria-hidden="true"
                          className="relative col-span-full h-3.5 rounded-[7px] bg-white/[0.03] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.07)_0_1px,transparent_1px_10%)]"
                        >
                          <i
                            className={cn('absolute bottom-[3px] top-[3px] rounded transition-[left,width] duration-700 ease-out', r.band)}
                            style={{ left: `${at(row.low)}%`, width: `${Math.max(0, at(row.high) - at(row.low))}%` }}
                          />
                          <i
                            className={cn(
                              'absolute top-1/2 -ml-0.5 -mt-[11px] h-[22px] w-1 rounded-sm transition-[left] duration-700 ease-out',
                              row.quoted
                                ? 'bg-volt shadow-[0_0_0_3px_#0B0C0E,0_0_14px_rgba(212,255,58,.9)]'
                                : 'bg-white shadow-[0_0_0_3px_#0B0C0E]',
                            )}
                            style={{ left: `${at(row.typical)}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <Axis a={scale.a} b={scale.b} dark className="mt-2.5" />

                <div className="mt-7 flex flex-col items-stretch justify-between gap-[18px] border-t border-white/[0.09] pt-[18px] sm:flex-row sm:items-center">
                  <p className="flex max-w-[34rem] gap-2.5 text-[13px] leading-[1.5] text-white/60">
                    <Info size={18} className="mt-px shrink-0 text-fog" aria-hidden="true" />
                    Estimates, not exact conversions — the small range under each figure is the likely spread.
                  </p>
                  <button
                    type="button"
                    onClick={copyLink}
                    className={btnClass(
                      'ghostDark',
                      'sm',
                      cn('shrink-0 [&_svg]:h-4 [&_svg]:w-4', copied === 'done' && 'border-volt text-volt'),
                    )}
                  >
                    {copied === 'done' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                    {copied === 'done' ? 'Link copied' : copied === 'failed' ? 'Copy the address bar instead' : 'Copy link'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[16rem] flex-col items-center justify-center py-6 text-center">
                <span className="grid size-12 place-items-center rounded-full border border-white/[0.12] text-volt">
                  <Gauge size={22} aria-hidden="true" />
                </span>
                <p className="mt-4 text-base font-semibold text-white">
                  {standard == null ? 'Pick the standard to compare' : 'Enter a range to compare'}
                </p>
                <p className="mt-1.5 max-w-xs text-sm leading-[1.55] text-fog">
                  {standard == null
                    ? 'The same figure means different things on each standard, so we need to know which one it is.'
                    : kmProblem}
                </p>
              </div>
            )}
          </section>
        </div>
      </Lift>

      <Section tone="chalk" id="standards">
        <Wrap>
          <StandardsTable />
        </Wrap>
      </Section>

      {road && km != null && standard ? (
        <Section tone="paper" id="real-world">
          <Wrap>
            <RoadEstimates estimates={road} km={km} standard={standard} car={car} />
          </Wrap>
        </Section>
      ) : null}

      <Section tone="chalk" id="compare">
        <Wrap>
          <ListingCompare initialKm={ready ? km : null} initialStandard={ready ? standard : null} />
        </Wrap>
      </Section>
    </>
  )
}
