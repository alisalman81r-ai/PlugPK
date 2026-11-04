// src/components/admin/CarInventory.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ThemedSelect } from '@/components/ui/ThemedSelect'
import type { CarAudit } from '@/lib/car-admin'
import { electricDistance, electricDistanceMax } from '@/lib/cars'

import { AdminSearch } from './AdminSearch'
import { LENSES, type Lens, type SortKey } from './car-inventory-filter'
import { buildHref, flattenParams } from './list-params'
import { Empty, Ico, k, rise, s } from './people/kit'

/**
 * The catalogue, as a working list — the landing-v2 admin "Cars" table.
 *
 * Search, lens and sort are in the URL and applied by the cars page on the
 * server, which hands this component one page of rows (see
 * car-inventory-filter.ts).
 *
 * ── Why a photograph column, and why it is first ───────────────────────
 *
 * A car is a shape: an operator scanning for the Sealion 6 recognises the car
 * before they finish reading "Sealion". The thumbnail is also the fastest
 * check that a row has the *right* photograph. A missing photo shows as a
 * marked empty frame rather than a blank cell, so the gap can be seen.
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

/** Green only at 100%: anything less is a row with work outstanding. */
function meterTone(value: number): string {
  if (value === 100) return 'c-ok'
  if (value >= 60) return 'c-mid'
  return 'c-low'
}

export function CarInventory({ audits, total, counts, lens, sort, query }: CarInventoryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = flattenParams(Object.fromEntries(searchParams.entries()))
  const tools = rise(1)
  const table = rise(2)

  return (
    <div>
      {/* ── Controls (.tools) ────────────────────────────────────── */}
      <div className={k('card', 'tools', tools.className)} style={tools.style}>
        <div className={s.tools__row}>
          <div className={s.grow}>
            <AdminSearch placeholder="Search by name, brand or slug" label="Search the catalogue" />
          </div>

          <div className="inline-flex items-center gap-2.5 text-[13px] text-muted max-[640px]:w-full">
            <span aria-hidden="true">Sort</span>
            <ThemedSelect
              aria-label="Sort"
              value={sort}
              onChange={(next) =>
                router.push(buildHref(pathname, params, { sort: next === 'name' ? undefined : next }), { scroll: false })
              }
              align="right"
              className="h-12 rounded-[14px] border border-ink/[.09] bg-paper pl-3.5"
              wrapperClassName="max-[640px]:w-full"
              options={[
                { value: 'name', label: 'Name' },
                { value: 'category', label: 'Powertrain' },
                { value: 'price', label: 'Price, low to high' },
                { value: 'completeness', label: 'Least complete first' },
              ]}
            />
          </div>
        </div>

        {/*
          Lenses rather than a filter panel. Each one is a question an operator
          arrives with — "what is missing a photo?" — and carries its count, so
          the answer is visible before the click. A lens with nothing behind it
          stays visible but faded: zero is the good news on these three.
        */}
        <div role="group" aria-label="Show" className={s.chips}>
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
                className={!selected && count === 0 ? s['is-zero'] : undefined}
              >
                {entry.label}
                <span className={s.c}>{count}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── The list (.tablewrap > table.t) ──────────────────────── */}
      <div className={k('card', 'tablewrap', table.className)} style={table.style}>
        <table className={s.t}>
          <caption className={s.sr}>Every car in the catalogue, with its data completeness and outstanding issues.</caption>
          <thead>
            <tr>
              <th scope="col">Car</th>
              <th scope="col">Powertrain</th>
              <th scope="col">Price</th>
              <th scope="col">Battery</th>
              <th scope="col">Range</th>
              <th scope="col">Power</th>
              <th scope="col">Data</th>
              <th scope="col">
                <span className={s.sr}>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {audits.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty
                    icon="search"
                    title={lens === 'all' ? 'No car matches.' : 'Nothing in this view.'}
                    text={
                      lens === 'all'
                        ? query.trim()
                          ? `No car matches “${query.trim()}”. Try another search.`
                          : 'Try another search, or clear the filter.'
                        : 'Which, for this filter, is the good outcome.'
                    }
                  >
                    {query || lens !== 'all' ? (
                      <Link href={pathname} className={k('btn', 'btn--line', 'btn--sm')}>
                        Show all cars
                      </Link>
                    ) : null}
                  </Empty>
                </td>
              </tr>
            ) : (
              audits.map((audit) => {
                const { car } = audit
                const warnings = audit.issues.filter((issue) => issue.level === 'warn')
                const range = electricDistance(car)
                const rangeMax = electricDistanceMax(car)

                return (
                  <tr key={car.id}>
                    <td data-label="Car">
                      <div className={s.carc}>
                        <span className={s.carc__img}>
                          {car.image ? (
                            <Image src={car.image} alt="" width={76} height={50} />
                          ) : (
                            <span title="No photograph">
                              <Ico n="img" />
                            </span>
                          )}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/cars/${car.slug}`} className={s.sname}>
                            {car.fullName}
                          </Link>
                          <div className={s.ssub}>{car.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td data-label="Powertrain">
                      <span className={k('pt', `pt--${car.category}`)}>{car.category}</span>
                    </td>

                    <td data-label="Price">
                      <div className={s.price}>{car.price.display.replace(' (indicative)', '')}</div>
                      {!audit.priceConfirmed ? <span className={s.ind}>Indicative</span> : null}
                    </td>

                    {/* A dash, not a zero: a car with no published battery
                        figure is not a car with a 0 kWh battery. */}
                    <td data-label="Battery">
                      <Figure value={car.batteryCapacity} unit="kWh" />
                    </td>
                    <td data-label="Range">
                      {range !== null ? (
                        <span className={s.kw}>
                          {range}
                          {rangeMax !== null && rangeMax !== range ? `–${rangeMax}` : ''} <small>km</small>
                          {car.category !== 'EV' ? <span className={s.elec}>electric only</span> : null}
                        </span>
                      ) : (
                        <Figure value={null} unit="km" />
                      )}
                    </td>
                    <td data-label="Power">
                      <Figure value={car.power} unit="hp" />
                    </td>

                    <td data-label="Data">
                      <div
                        className={s.comp}
                        role="img"
                        aria-label={`${audit.completeness}% of expected fields present`}
                        title={`${audit.filled} of ${audit.expected} expected fields`}
                      >
                        <i className={s[meterTone(audit.completeness)]} style={{ width: `${audit.completeness}%` }} />
                      </div>
                      <span className={s.comp__n}>
                        {audit.completeness}%
                        {warnings.length > 0 ? (
                          <span role="img" aria-label={warnings.map((issue) => issue.label).join('; ')} title={warnings.map((issue) => issue.label).join('; ')}>
                            <Ico n="alert" />
                          </span>
                        ) : null}
                      </span>
                    </td>

                    <td data-label="Actions">
                      <div className={s.acts}>
                        <Link
                          href={`/cars/${car.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${car.fullName} in the live catalogue`}
                        >
                          <Ico n="ext" />
                        </Link>
                        <Link href={`/admin/cars/${car.slug}`} aria-label={`Edit ${car.fullName}`}>
                          <Ico n="pen" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <span className={s.sr} aria-live="polite">
        {total} of {counts.all} cars match
      </span>
    </div>
  )
}

/** A figure and its unit, or a dash for one that was never published. */
function Figure({ value, unit }: { value: number | null; unit: string }) {
  if (value === null) {
    return (
      <span className={s.kw} title="Not published">
        <span className={s.none}>—</span>
      </span>
    )
  }
  return (
    <span className={s.kw}>
      {value} <small>{unit}</small>
    </span>
  )
}
