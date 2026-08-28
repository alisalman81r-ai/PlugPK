// src/components/admin/CarInventory.tsx
'use client'

import { AlertTriangle, ChevronRight, ExternalLink, ImageOff, Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { CarAudit } from '@/lib/car-admin'
import { cn } from '@/lib/utils'

/**
 * The catalogue, as a working list.
 *
 * Filtering runs in the browser over the whole set. Thirty-six rows is far
 * inside the size where a round trip per keystroke would cost more than it
 * saves, and every field the filters touch is already on the page.
 *
 * ── Why a photograph column, and why it is first ───────────────────────
 *
 * Every other admin list leads with a name, because a station or a service is a
 * name. A car is a shape: an operator scanning for the Sealion 6 recognises the
 * car before they finish reading "Sealion". The thumbnail is also the fastest
 * possible check that a row has the *right* photograph — the failure this
 * catalogue is most exposed to, since two of its images were the wrong car
 * before the filename guards were tightened. A missing photo shows as a marked
 * empty frame rather than a blank cell, so the gap is a thing you can see and
 * count rather than an absence you have to notice.
 */

export interface CarInventoryProps {
  audits: CarAudit[]
}

type SortKey = 'name' | 'price' | 'completeness' | 'category'
type Lens = 'all' | 'attention' | 'no-photo' | 'indicative'

const LENSES: { key: Lens; label: string; hint: string }[] = [
  { key: 'all', label: 'All cars', hint: 'The whole catalogue' },
  { key: 'attention', label: 'Needs attention', hint: 'Carries at least one warning' },
  { key: 'no-photo', label: 'No photograph', hint: 'Falls back to a placeholder on the site' },
  { key: 'indicative', label: 'Indicative price', hint: 'Not from a dealer price list' },
]

const CATEGORY_TONE: Record<string, string> = {
  EV: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PHEV: 'border-blue-200 bg-blue-50 text-blue-700',
  REEV: 'border-violet-200 bg-violet-50 text-violet-700',
  Hybrid: 'border-amber-200 bg-amber-50 text-amber-700',
}

/** Green only at 100%: anything less is a row with work outstanding. */
function meterTone(value: number): string {
  if (value === 100) return 'bg-emerald-500'
  if (value >= 75) return 'bg-blue-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

export function CarInventory({ audits }: CarInventoryProps) {
  const [query, setQuery] = React.useState('')
  const [lens, setLens] = React.useState<Lens>('all')
  const [sort, setSort] = React.useState<SortKey>('name')

  const counts = React.useMemo(
    () => ({
      all: audits.length,
      attention: audits.filter((a) => a.issues.some((i) => i.level === 'warn')).length,
      'no-photo': audits.filter((a) => a.car.image === null).length,
      indicative: audits.filter((a) => !a.priceConfirmed).length,
    }),
    [audits],
  )

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    let rows = audits
    if (needle) {
      rows = rows.filter((audit) =>
        [audit.car.fullName, audit.car.brand, audit.car.model, audit.car.category, audit.car.slug]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    }

    if (lens === 'attention') {
      rows = rows.filter((audit) => audit.issues.some((issue) => issue.level === 'warn'))
    } else if (lens === 'no-photo') {
      rows = rows.filter((audit) => audit.car.image === null)
    } else if (lens === 'indicative') {
      rows = rows.filter((audit) => !audit.priceConfirmed)
    }

    return [...rows].sort((a, b) => {
      if (sort === 'price') return a.car.price.min - b.car.price.min
      // Least complete first: a completeness sort is a work queue, so the row
      // that needs doing belongs at the top rather than buried at the bottom.
      if (sort === 'completeness') return a.completeness - b.completeness
      if (sort === 'category') {
        return (
          a.car.category.localeCompare(b.car.category) ||
          a.car.fullName.localeCompare(b.car.fullName)
        )
      }
      return a.car.fullName.localeCompare(b.car.fullName)
    })
  }, [audits, query, lens, sort])

  return (
    <div>
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, brand or slug"
              aria-label="Search the catalogue"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-ui-sm text-slate-500">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-ui-sm font-medium text-slate-700 outline-none transition-shadow focus-visible:border-plug-blue-500 focus-visible:shadow-focus"
            >
              <option value="name">Name</option>
              <option value="category">Powertrain</option>
              <option value="price">Price, low to high</option>
              <option value="completeness">Least complete first</option>
            </select>
          </label>
        </div>

        {/*
          Lenses rather than a filter panel. Each one is a question an operator
          actually arrives with — "what is missing a photo?", "what still has a
          guessed price?" — and each carries its own count, so the answer is
          visible before the click.
        */}
        <div role="radiogroup" aria-label="Filter the catalogue" className="flex flex-wrap gap-2">
          {LENSES.map((entry) => {
            const selected = lens === entry.key
            const count = counts[entry.key]

            return (
              <button
                key={entry.key}
                type="button"
                role="radio"
                aria-checked={selected}
                title={entry.hint}
                onClick={() => setLens(entry.key)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-ui-sm font-semibold transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                  selected
                    ? 'border-slate-900 bg-plug-navy-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  // A lens with nothing behind it is not worth a click, but it
                  // is worth seeing: zero is the good news on these three.
                  !selected && count === 0 && 'opacity-50',
                )}
              >
                {entry.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold',
                    selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── The list ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">
              Every car in the catalogue, with its data completeness and outstanding issues.
            </caption>
            <thead>
              <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                <th scope="col" className="px-5 py-3 font-semibold">
                  Car
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Powertrain
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Price
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Battery
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Range
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Power
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Data
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {visible.map((audit) => {
                const { car } = audit
                const warnings = audit.issues.filter((issue) => issue.level === 'warn')
                const range = car.range ?? car.electricRange
                const rangeMax = car.range !== null ? car.rangeMax : car.electricRangeMax

                return (
                  <tr
                    key={car.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {car.image ? (
                          <Image
                            src={car.image}
                            alt=""
                            width={72}
                            height={48}
                            className="h-12 w-[72px] shrink-0 rounded-md object-cover ring-1 ring-slate-900/10"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex h-12 w-[72px] shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400"
                          >
                            <ImageOff size={16} />
                          </span>
                        )}

                        <div className="min-w-0">
                          <Link
                            href={`/admin/cars/${car.slug}`}
                            className="block truncate font-semibold text-slate-900 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            {car.fullName}
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-ui-xs text-slate-400">
                            {car.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-ui-xs font-bold',
                          CATEGORY_TONE[car.category] ?? 'border-slate-200 bg-slate-50 text-slate-600',
                        )}
                      >
                        {car.category}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <p className="whitespace-nowrap text-ui-sm font-medium text-slate-700">
                        {car.price.display.replace(' (indicative)', '')}
                      </p>
                      {!audit.priceConfirmed ? (
                        <p className="mt-0.5 text-ui-xs font-semibold text-amber-600">indicative</p>
                      ) : null}
                    </td>

                    {/* An em dash, not a zero. A car with no published battery
                        figure is not a car with a 0 kWh battery. */}
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-ui-sm text-slate-600">
                      {car.batteryCapacity !== null ? `${car.batteryCapacity} kWh` : <Dash />}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-ui-sm text-slate-600">
                      {range !== null ? (
                        <>
                          {range}
                          {rangeMax !== null ? `–${rangeMax}` : ''} km
                          {car.range === null ? (
                            <span className="ml-1 text-ui-xs text-slate-400">EV-only</span>
                          ) : null}
                        </>
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-ui-sm text-slate-600">
                      {car.power !== null ? `${car.power} hp` : <Dash />}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-200"
                          role="img"
                          aria-label={`${audit.completeness}% of expected fields present`}
                        >
                          <span
                            className={cn('block h-full rounded-full', meterTone(audit.completeness))}
                            style={{ width: `${audit.completeness}%` }}
                          />
                        </span>
                        <span className="font-mono text-ui-xs tabular-nums text-slate-500">
                          {audit.filled}/{audit.expected}
                        </span>
                        {warnings.length > 0 ? (
                          <AlertTriangle
                            size={14}
                            className="shrink-0 text-amber-500"
                            aria-label={warnings.map((issue) => issue.label).join('; ')}
                          />
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/cars/${car.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${car.fullName} on the live site`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <Link
                          href={`/admin/cars/${car.slug}`}
                          aria-label={`Inspect ${car.fullName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                        >
                          <ChevronRight size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold text-slate-900">Nothing matches</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              {lens === 'all'
                ? `No car matches “${query.trim()}”.`
                : 'Nothing in this view — which, for this filter, is the good outcome.'}
            </p>
            {(query || lens !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setLens('all')
                }}
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-300 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                Show all cars
              </button>
            )}
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-3 text-ui-sm text-slate-500">
        Showing <span className="font-semibold text-slate-900">{visible.length}</span> of{' '}
        {audits.length} cars
      </p>
    </div>
  )
}

/** The placeholder for a figure that was never published. */
function Dash() {
  return (
    <span className="text-slate-300" title="Not published">
      —
    </span>
  )
}
