// src/components/admin/CarInventory.tsx
'use client'

import { AlertTriangle, ChevronRight, ExternalLink, ImageOff } from '@/components/ui/icons'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { CarAudit } from '@/lib/car-admin'
import { electricDistance, electricDistanceMax } from '@/lib/cars'
import { cn } from '@/lib/utils'

import { AdminSearch } from './AdminSearch'
import { LENSES, type Lens, type SortKey } from './car-inventory-filter'
import { buildHref, flattenParams } from './list-params'

/**
 * The catalogue, as a working list.
 *
 * Search, lens and sort are in the URL and applied by the cars page on the
 * server, which hands this component one page of rows (see
 * car-inventory-filter.ts).
 *
 * ── Why a photograph column, and why it is first ───────────────────────
 *
 * Every other admin list leads with a name, because a station or a service is a
 * name. A car is a shape: an operator scanning for the Sealion 6 recognises the
 * car before they finish reading "Sealion". The thumbnail is also the fastest
 * possible check that a row has the *right* photograph. A missing photo shows
 * as a marked empty frame rather than a blank cell, so the gap is a thing you
 * can see and count rather than an absence you have to notice.
 */

export interface CarInventoryProps {
  /** One page, already filtered and sorted. */
  audits: CarAudit[]
  /** Matches across every page. */
  total: number
  counts: Record<Lens, number>
  lens: Lens
  sort: SortKey
  query: string
}

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

export function CarInventory({ audits, total, counts, lens, sort, query }: CarInventoryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = flattenParams(Object.fromEntries(searchParams.entries()))
  const visible = audits

  return (
    <div>
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <AdminSearch placeholder="Search by name, brand or slug" label="Search the catalogue" />

          <label className="flex items-center gap-2 text-ui-sm text-slate-500">
            Sort
            <select
              value={sort}
              onChange={(event) =>
                router.push(buildHref(pathname, params, { sort: event.target.value === 'name' ? undefined : event.target.value }), {
                  scroll: false,
                })
              }
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
        <div role="group" aria-label="Filter the catalogue" className="flex flex-wrap gap-2">
          {LENSES.map((entry) => {
            const selected = lens === entry.key
            const count = counts[entry.key]

            return (
              <Link
                key={entry.key}
                href={buildHref(pathname, params, { lens: entry.key })}
                scroll={false}
                aria-current={selected ? 'true' : undefined}
                title={entry.hint}
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
              </Link>
            )
          })}
        </div>
      </div>


      {/* ── The list ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* relative: the header's sr-only label is absolutely positioned, and
            without a positioned ancestor inside the scroller it escaped it and
            widened the whole page by ~110px. */}
        <div className="relative overflow-x-auto">
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
                const range = electricDistance(car)
                const rangeMax = electricDistanceMax(car)

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
                          {car.category !== 'EV' ? (
                            <span className="ml-1 text-ui-xs text-slate-400">electric only</span>
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
              <Link
                href={pathname}
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-300 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                Show all cars
              </Link>
            )}
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-3 text-ui-sm text-slate-500">
        <span className="font-semibold text-slate-900">{total}</span> of {counts.all} cars match
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
