// src/components/cars/CarComparison.tsx
'use client'

import { Check, Link2, Plus, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Badge, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { formatPkr } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * Two to four cars, analysed rather than merely listed.
 *
 * A comparison table on its own leaves the reading to the reader: fourteen rows
 * of numbers, and it is their job to work out which is bigger and whether the
 * gap matters. This does three things a plain table does not.
 *
 *   - A summary above the table, so the answer is visible before any scrolling:
 *     what each car costs, how far above the cheapest it sits, and how many of
 *     the measured rows it wins.
 *   - Bars behind the comparable figures, scaled to the largest value in that
 *     row. A 650 km range next to a 380 km one is a number; drawn, it is
 *     obviously most of a third further.
 *   - Rows grouped under headings, and an option to hide the ones where every
 *     car is identical — on a long table the differences are the whole point.
 *
 * Every judgement is bounded. "Best" and the win count only cover rows with a
 * direction that more than one car has a figure for, and never price, type,
 * connector or engine size: cheapest is not better without a budget, and a
 * larger engine in a plug-in hybrid is not an improvement. The footnote says so.
 *
 * Editable in place, through the URL. Removing a car and adding one are both
 * navigations, which keeps a comparison shareable and makes the back button
 * undo a change the way a reader expects.
 */

export interface CarComparisonProps {
  cars: Car[]
  /** Everything not already in the comparison, for the add control. */
  available: Car[]
  max: number
}

const CATEGORY_VARIANT: Record<CarCategory, BadgeVariant> = {
  EV: 'blue',
  PHEV: 'amber',
  REEV: 'purple',
  Hybrid: 'green',
}

interface Row {
  label: string
  value: (car: Car) => string | null
  /** The comparable number behind the label, when there is one. */
  number?: (car: Car) => number | null
  better?: 'higher' | 'lower'
  /** Suffix for the bar's screen-reader description. */
  unit?: string
}

const GROUPS: Array<{ title: string; rows: Row[] }> = [
  {
    title: 'Price',
    rows: [
      { label: 'Pakistan price', value: (car) => car.price.display },
      { label: 'Powertrain', value: (car) => car.category },
    ],
  },
  {
    title: 'Battery & range',
    rows: [
      {
        label: 'Battery',
        value: (car) => (car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null),
        number: (car) => car.batteryCapacity,
        better: 'higher',
        unit: 'kWh',
      },
      {
        label: 'Driving range',
        value: (car) =>
          car.range === null
            ? null
            : car.rangeMax
              ? `${car.range}–${car.rangeMax} km`
              : `${car.range} km`,
        number: (car) => car.range,
        better: 'higher',
        unit: 'km',
      },
      {
        label: 'Electric range',
        value: (car) =>
          car.electricRange === null
            ? null
            : car.electricRangeMax
              ? `${car.electricRange}–${car.electricRangeMax} km`
              : `${car.electricRange} km`,
        number: (car) => car.electricRange,
        better: 'higher',
        unit: 'km',
      },
    ],
  },
  {
    title: 'Charging',
    rows: [
      {
        label: 'DC fast charging',
        value: (car) => (car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null),
        number: (car) => car.dcCharging,
        better: 'higher',
        unit: 'kW',
      },
      {
        label: 'AC charging',
        value: (car) => (car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null),
        number: (car) => car.acCharging,
        better: 'higher',
        unit: 'kW',
      },
      {
        label: 'Connector',
        value: (car) => (car.connector?.length ? car.connector.join(', ') : null),
      },
    ],
  },
  {
    title: 'Performance',
    rows: [
      {
        label: 'Power',
        value: (car) => (car.power ? `${car.power} ${car.powerUnit}` : null),
        number: (car) => car.power,
        better: 'higher',
        unit: 'hp',
      },
      {
        label: '0–100 km/h',
        value: (car) => (car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null),
        number: (car) => car.acceleration,
        better: 'lower',
        unit: 'seconds',
      },
      { label: 'Torque', value: (car) => (car.torque ? `${car.torque} Nm` : null) },
      { label: 'Top speed', value: (car) => (car.topSpeed ? `${car.topSpeed} km/h` : null) },
    ],
  },
  {
    title: 'Engine & practical',
    rows: [
      { label: 'Engine', value: (car) => (car.engineCapacity ? `${car.engineCapacity} cc` : null) },
      { label: 'Seats', value: (car) => (car.seats ? String(car.seats) : null) },
    ],
  },
]

export function CarComparison({ cars, available, max }: CarComparisonProps) {
  const router = useRouter()
  const [adding, setAdding] = React.useState(false)
  const [onlyDifferences, setOnlyDifferences] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const go = (ids: string[]) => {
    setAdding(false)
    router.push(ids.length === 0 ? '/cars' : `/cars/compare?ids=${ids.join(',')}`)
  }

  /**
   * Which rows to show.
   *
   * A row with no figures at all is always dropped. With the toggle on, so is
   * one where every car reads the same — including rows where they are all
   * blank, since "neither has it" is not a difference.
   */
  const groups = React.useMemo(
    () =>
      GROUPS.map((group) => ({
        title: group.title,
        rows: group.rows.filter((row) => {
          const values = cars.map((car) => row.value(car))
          if (values.every((value) => value === null)) return false
          if (!onlyDifferences) return true
          return new Set(values.map((value) => value ?? '—')).size > 1
        }),
      })).filter((group) => group.rows.length > 0),
    [cars, onlyDifferences],
  )

  const allRows = React.useMemo(() => groups.flatMap((group) => group.rows), [groups])

  /**
   * Row winners, and the maximum in each row for the bars.
   *
   * A winner needs a direction, at least two cars with the figure, and no tie —
   * a "Best" badge on a value another car matches exactly would mislead, and one
   * on a row only a single car has a figure for says nothing at all.
   */
  const analysis = React.useMemo(() => {
    const winners = new Map<string, string>()
    const scales = new Map<string, number>()

    for (const row of allRows) {
      if (!row.number) continue

      const scored = cars
        .map((car) => ({ id: car.id, value: row.number!(car) }))
        .filter((entry): entry is { id: string; value: number } => entry.value !== null)

      if (scored.length === 0) continue
      scales.set(row.label, Math.max(...scored.map((entry) => entry.value)))

      if (!row.better || scored.length < 2) continue

      const best =
        row.better === 'higher'
          ? Math.max(...scored.map((entry) => entry.value))
          : Math.min(...scored.map((entry) => entry.value))

      const holders = scored.filter((entry) => entry.value === best)
      if (holders.length === 1 && holders[0]) winners.set(row.label, holders[0].id)
    }

    return { winners, scales, measured: winners.size }
  }, [cars, allRows])

  const cheapest = Math.min(...cars.map((car) => car.price.min))

  const wins = (id: string) =>
    Array.from(analysis.winners.values()).filter((winner) => winner === id).length

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is denied outside a secure context and in some
      // browsers' settings. The URL is in the address bar either way, so
      // there is nothing worth interrupting the reader about.
    }
  }

  const canAdd = cars.length < max && available.length > 0

  return (
    <div>
      {/* ── The answer, before the table ─────────────────────────── */}
      <div
        className={cn(
          'grid gap-4',
          cars.length === 2 && 'sm:grid-cols-2',
          cars.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
          cars.length >= 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {cars.map((car) => {
          const won = wins(car.id)
          const premium = car.price.min - cheapest

          return (
            <div
              key={car.id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1"
            >
              <button
                type="button"
                onClick={() => go(cars.filter((entry) => entry.id !== car.id).map((entry) => entry.id))}
                aria-label={`Remove ${car.fullName} from comparison`}
                className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 shadow-e1 ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                <X size={14} aria-hidden="true" />
              </button>

              <Link
                href={`/cars/${car.slug}`}
                className="group/car block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-blue-500"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-slate-50">
                  <PhotoFrame
                    src={car.image ?? undefined}
                    alt={car.fullName}
                    sizes="(max-width: 640px) 100vw, 320px"
                    zoomOnHover
                  />
                </span>

                <span className="block p-4">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {car.brand}
                    </span>
                    <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
                      {car.category}
                    </Badge>
                  </span>

                  <span className="mt-1 block truncate text-lg font-bold tracking-tight text-slate-900 group-hover/car:text-plug-blue-700">
                    {car.model}
                  </span>

                  <span className="mt-3 block text-xl font-black tracking-tight text-slate-900">
                    {car.price.display}
                  </span>

                  {/* The gap from the cheapest car in the comparison, which is
                      the number a buyer is actually weighing. Absent on the
                      cheapest one rather than printed as zero. */}
                  <span className="mt-1 block text-ui-xs text-slate-500">
                    {premium === 0 ? (
                      <span className="font-semibold text-emerald-700">Lowest price here</span>
                    ) : (
                      <>+{formatPkr(premium).replace('PKR ', '')} vs cheapest</>
                    )}
                  </span>
                </span>
              </Link>

              {/* Wins are stated with their denominator. "4" alone is a boast;
                  "4 of 7 measured" is a fact the reader can check. */}
              {analysis.measured > 0 ? (
                <p className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-ui-xs">
                  <Trophy
                    size={12}
                    aria-hidden="true"
                    className={won > 0 ? 'text-amber-500' : 'text-slate-300'}
                  />
                  <span className={won > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                    Leads {won} of {analysis.measured} measured {analysis.measured === 1 ? 'row' : 'rows'}
                  </span>
                </p>
              ) : null}
            </div>
          )
        })}

        {canAdd ? (
          <div className="flex items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-300 p-5">
            {adding ? (
              <div className="w-full">
                <label className="block text-ui-xs font-semibold text-slate-600">
                  Add a car
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(event) =>
                      event.target.value && go([...cars.map((car) => car.id), event.target.value])
                    }
                    className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border-[1.5px] border-slate-300 bg-white px-2 text-ui-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Choose a car…
                    </option>
                    {available.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.fullName} — {car.price.display}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="mt-2 text-ui-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex flex-col items-center gap-2 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                <Plus size={22} aria-hidden="true" />
                <span className="text-ui-sm font-semibold">Add a car</span>
                <span className="text-ui-xs text-slate-400">up to {max}</span>
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Table controls ──────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-ui-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(event) => setOnlyDifferences(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-plug-blue-600"
          />
          Only show differences
        </label>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-slate-300 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          {copied ? (
            <Check size={14} aria-hidden="true" className="text-emerald-600" />
          ) : (
            <Link2 size={14} aria-hidden="true" />
          )}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>

      {/* ── The table ───────────────────────────────────────────── */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-e1">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">
            Specification comparison of {cars.map((car) => car.fullName).join(', ')}
          </caption>

          <colgroup>
            <col className="w-40" />
            {cars.map((car) => (
              <col key={car.id} />
            ))}
          </colgroup>

          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group.title}>
                {/* A heading row rather than a separate table per group: one
                    table keeps the columns aligned across every section, which
                    is the only reason to use a table here at all. */}
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={cars.length + 1}
                    className="border-y border-slate-200 bg-slate-50 px-4 py-2.5 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    {group.title}
                  </th>
                </tr>

                {group.rows.map((row) => {
                  const scale = analysis.scales.get(row.label)

                  return (
                    <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-white px-4 py-3.5 align-middle text-ui-sm font-medium text-slate-500"
                      >
                        {row.label}
                      </th>

                      {cars.map((car) => {
                        const value = row.value(car)
                        const isBest = analysis.winners.get(row.label) === car.id
                        const number = row.number?.(car) ?? null

                        /**
                         * The bar's width.
                         *
                         * Relative to the largest value in this row, not to some
                         * absolute maximum — the comparison is between these
                         * cars, and a 240 kW charger drawn against a
                         * hypothetical 350 kW one would understate it. A floor
                         * of 6% keeps the smallest value visible as a bar
                         * rather than a hairline.
                         */
                        const width =
                          number !== null && scale ? Math.max(6, (number / scale) * 100) : 0

                        return (
                          <td
                            key={car.id}
                            className="border-l border-slate-100 px-4 py-3.5 align-middle"
                          >
                            {value ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-ui-sm font-semibold text-slate-900">
                                    {value}
                                  </span>
                                  {isBest ? (
                                    <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                      Best
                                    </span>
                                  ) : null}
                                </div>

                                {width > 0 ? (
                                  <div
                                    aria-hidden="true"
                                    className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100"
                                  >
                                    <div
                                      style={{ width: `${width}%` }}
                                      className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        isBest ? 'bg-emerald-500' : 'bg-slate-300',
                                      )}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-ui-sm text-slate-300">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-ui-xs leading-relaxed text-slate-400">
        <p>
          A dash means the figure was not published for that car, not that it is zero.
          Bars are scaled to the largest value in their own row, so they compare these
          cars against each other and nothing else.
        </p>
        <p>
          <span className="font-semibold text-slate-500">Best</span> marks the strongest
          published figure in a row where more than one car has one and nothing ties. It
          is never shown on price, powertrain, connector or engine size — there, higher or
          lower is a matter of what you want rather than better.
        </p>
      </div>
    </div>
  )
}
