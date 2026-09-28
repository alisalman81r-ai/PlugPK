// src/components/range/RangeConverter.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { AlertCircle, ArrowDown, ArrowUpRight, Check, ChevronDown, Info, Link2 } from '@/components/ui/icons'
import {
  convertRange,
  roadEstimates,
  STANDARD_ORDER,
  STANDARDS,
  type RangeStandard,
} from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import { EquivalentChart } from './EquivalentChart'
import { ListingCompare } from './ListingCompare'
import { RoadEstimates } from './RoadEstimates'
import { TripCheck } from './TripCheck'
import type { RangeCar } from './types'

/**
 * The converter: what the driver has, and what it comes to.
 *
 * Two cards side by side rather than one: the left is the question — a
 * figure and the standard it was quoted on, optionally filled from a car —
 * and the right is the answer. Under both, the part a generic converter
 * leaves out: what that figure might mean on a road in Pakistan.
 *
 * Nothing here computes. lib/range-standards does, and every number it
 * returns is a band; this file only decides how the driver asks.
 *
 * A car whose catalogue row states no standard fills the figure but leaves
 * the standard unset, and the answer waits for the driver to choose it.
 * Guessing WLTP would be exactly the mistake the page exists to prevent.
 *
 * The figure, standard and car live in the address too (?km=510&std=CLTC),
 * so "what does this listing actually mean" can be sent to someone as a link
 * and opens showing the same answer.
 */

/** Real published figures, one per common case, so the first tap teaches something. */
const EXAMPLES: { km: number; standard: RangeStandard; label: string }[] = [
  { km: 510, standard: 'CLTC', label: 'A China-spec listing' },
  { km: 410, standard: 'NEDC', label: 'An older-standard brochure' },
  { km: 420, standard: 'WLTP', label: 'A European-spec sheet' },
]

/** "a, b and c", for the summary sentence. */
function listJoin(parts: string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

function parseStandardParam(value: string | null): RangeStandard | null {
  const v = value?.trim().toUpperCase()
  return v === 'EPA' || v === 'WLTP' || v === 'NEDC' || v === 'CLTC' ? v : null
}

const SELECT =
  'h-12 w-full cursor-pointer appearance-none rounded-xl border-[1.5px] border-slate-200 bg-white pl-4 pr-11 text-ui text-slate-900 transition-all duration-150 focus:border-plug-blue-500 focus:shadow-focus focus:outline-none'

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
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
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

  const applyExample = (e: (typeof EXAMPLES)[number]) => {
    setSlug('')
    setKmText(String(e.km))
    setStandard(e.standard)
  }

  const byBrand = React.useMemo(() => {
    const groups = new Map<string, RangeCar[]>()
    for (const c of cars) groups.set(c.brand, [...(groups.get(c.brand) ?? []), c])
    return [...groups.entries()]
  }, [cars])

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
      : km <= 0
        ? 'Enter a range above 0 km.'
        : km > MAX_KM
          ? `No production EV is rated past ${MAX_KM.toLocaleString('en-PK')} km — check the figure.`
          : null

  const ready = !kmProblem && km != null && standard != null
  const rows = ready ? convertRange(km, standard) : null
  const road = ready ? roadEstimates(km, standard) : null

  return (
    <div className="space-y-16 lg:space-y-20">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
        {/* ── The question ─────────────────────────────────────────── */}
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(5,36,30,0.05),0_24px_60px_-32px_rgba(5,36,30,0.35)] sm:p-7">
          <h2 className="text-ui font-semibold text-slate-900">Your range figure</h2>
          <p className="mt-1 text-ui-sm text-slate-500">Type it in, or start from a car we list.</p>

          <div className="mt-5">
            <label htmlFor="range-car" className="mb-1.5 block text-sm font-medium text-slate-700">
              EV <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <select id="range-car" value={slug} onChange={(e) => chooseCar(e.target.value)} className={SELECT}>
                <option value="">I&rsquo;ll type my own figure</option>
                {byBrand.map(([brand, list]) => (
                  <optgroup key={brand} label={brand}>
                    {list.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>

            {car ? (
              <p className="mt-2.5 text-ui-sm leading-relaxed text-slate-500">
                {car.rangeMaxKm
                  ? `Listed at ${car.rangeKm}–${car.rangeMaxKm} km across versions; we've used ${car.rangeKm}. Change it for yours.`
                  : `Listed at ${car.rangeKm} km${car.standard ? ` ${car.standard}` : ''}.`}{' '}
                <Link
                  href={`/cars/${car.slug}`}
                  className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
                >
                  Full specs
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <label htmlFor="range-km" className="mb-1.5 block text-sm font-medium text-slate-700">
              Quoted range
            </label>
            <div
              className={cn(
                'flex items-baseline rounded-2xl border-[1.5px] bg-white px-5 py-3 transition-all duration-150 focus-within:shadow-focus',
                kmProblem && kmText.trim() !== ''
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
                className="w-full min-w-0 appearance-none bg-transparent text-[2.5rem] font-bold leading-none tracking-tight tabular-nums text-slate-900 outline-none placeholder:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="420"
              />
              <span className="ml-2 shrink-0 text-xl font-semibold text-slate-400">km</span>
            </div>
            <p id="range-km-help" className={cn('mt-2 text-ui-sm', kmProblem && kmText.trim() !== '' ? 'text-red-600' : 'text-slate-500')}>
              {kmProblem && kmText.trim() !== '' ? kmProblem : 'The figure on the brochure, listing or spec sheet.'}
            </p>

            {/* Not shown once a car is chosen: the car's own figure is the example. */}
            {car ? null : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-ui-sm text-slate-500">Try:</span>
                {EXAMPLES.map((e) => {
                  const on = kmText === String(e.km) && standard === e.standard
                  return (
                    <button
                      key={e.standard}
                      type="button"
                      onClick={() => applyExample(e)}
                      aria-pressed={on}
                      title={e.label}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-ui-sm font-medium tabular-nums transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                        on
                          ? 'border-plug-blue-600 bg-plug-blue-600/[0.06] text-plug-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                      )}
                    >
                      {e.km} km <span className={on ? 'text-plug-blue-600/70' : 'text-slate-400'}>{e.standard}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <fieldset className="mt-6">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Quoted on which standard?</legend>
            {car && !car.standard && standard == null ? (
              <p className="mb-2.5 flex gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-ui-sm text-amber-900">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                We don&rsquo;t know which standard this car&rsquo;s figure uses. Check the brochure and pick it here.
              </p>
            ) : null}
            <div role="radiogroup" aria-label="Range standard" className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {STANDARD_ORDER.map((s) => {
                const on = standard === s
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setStandard(s)}
                    className={cn(
                      'flex min-h-[4.25rem] flex-col items-start justify-center rounded-xl border-[1.5px] px-3.5 py-2.5 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                      on
                        ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300',
                    )}
                  >
                    <span className="text-lg font-bold leading-tight tracking-wide">{s}</span>
                    <span className={cn('text-ui-sm leading-snug', on ? 'text-white/70' : 'text-slate-500')}>
                      {STANDARDS[s].region}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* ── The answer ───────────────────────────────────────────── */}
        <section
          aria-live="polite"
          aria-label="Approximate comparison"
          className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(5,36,30,0.05),0_24px_60px_-32px_rgba(5,36,30,0.35)] sm:p-7"
        >
          {rows && km != null && standard ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-400">You have</p>
                  <p className="mt-1 text-[clamp(2.25rem,5vw,3rem)] font-bold leading-none tracking-tight tabular-nums text-slate-900">
                    {km.toLocaleString('en-PK')} km
                    <span className="ml-2 align-middle text-ui font-bold tracking-wide text-plug-blue-600">
                      {standard}
                    </span>
                  </p>
                </div>
                <p className="flex items-center gap-1.5 pb-1 text-ui-sm font-semibold text-plug-cyan-700">
                  <ArrowDown size={16} aria-hidden="true" />
                  Approximate comparison
                </p>
              </div>

              {/* The whole answer in one sentence, for anyone who doesn't read charts. */}
              <p className="mt-5 text-ui leading-relaxed text-slate-700">
                <strong className="font-semibold text-slate-900">
                  {km.toLocaleString('en-PK')} km on {standard}
                </strong>{' '}
                is roughly{' '}
                {listJoin(
                  rows
                    .filter((r) => !r.quoted)
                    .map((r) => `${r.typical.toLocaleString('en-PK')} km on ${r.standard}`),
                )}
                .
              </p>

              <div className="mt-6">
                <EquivalentChart rows={rows} />
              </div>

              <p className="mt-6 flex gap-2 border-t border-slate-100 pt-4 text-ui-sm leading-relaxed text-slate-500">
                <Info size={16} className="mt-0.5 shrink-0 text-plug-cyan-700" aria-hidden="true" />
                <span>
                  Estimated equivalents, not conversions. Each standard is a different test drive, and cars differ
                  in how they cope with each — so the spread matters as much as the middle figure.
                </span>
              </p>

              <button
                type="button"
                onClick={copyLink}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2"
              >
                {copied === 'done' ? (
                  <Check size={16} className="text-plug-cyan-700" aria-hidden="true" />
                ) : (
                  <Link2 size={16} aria-hidden="true" />
                )}
                {copied === 'done'
                  ? 'Link copied'
                  : copied === 'failed'
                    ? 'Copy the address bar instead'
                    : 'Copy link to this result'}
              </button>
            </>
          ) : (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
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

      {road && km != null && standard ? (
        <div className="space-y-4">
          <RoadEstimates estimates={road} km={km} standard={standard} car={car} />
          <TripCheck estimates={road} />
        </div>
      ) : null}

      <ListingCompare initialKm={ready ? km : null} initialStandard={ready ? standard : null} />
    </div>
  )
}
