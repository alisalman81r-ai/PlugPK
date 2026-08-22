// src/components/cars/CarComparison.tsx
'use client'

import { Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Badge, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { cn } from '@/lib/utils'

/**
 * Two to four cars, side by side.
 *
 * Rows come from the cars being compared, not a fixed list: a row appears only
 * if at least one of them has a figure for it. Comparing two PHEVs therefore
 * shows an engine row and no DC-charging row, and two EVs the opposite —
 * without either table carrying a band of empty cells.
 *
 * Within a row, a car that lacks the figure shows an em dash. That is the one
 * place a dash is right: the column has to stay aligned with its neighbours,
 * and the row's own label says what is missing.
 *
 * Responsive by scrolling horizontally rather than collapsing into stacked
 * cards. A comparison read as four separate lists is not a comparison, so the
 * first column stays pinned and the rest scroll under it.
 *
 * Editable in place. The selection lives in the URL, so removing a car and
 * adding another are both just navigations — which keeps the comparison
 * shareable and survivable across a refresh, and means the browser's back
 * button undoes a change the way a reader expects.
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

/**
 * A row, plus how to read it.
 *
 * `better` says which direction is preferable, so the strongest figure in a row
 * can be marked. It is deliberately absent on price, type, connector and
 * engine: cheapest is not "best" without knowing the buyer's budget, and a
 * bigger engine in a plug-in hybrid is not an improvement. Marking those would
 * be the table expressing an opinion it has no basis for.
 */
interface Row {
  label: string
  value: (car: Car) => string | null
  /** The comparable number behind the label, when there is one. */
  number?: (car: Car) => number | null
  better?: 'higher' | 'lower'
}

const ROWS: Row[] = [
  { label: 'Price', value: (car) => car.price.display },
  { label: 'Type', value: (car) => car.category },
  {
    label: 'Battery',
    value: (car) => (car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null),
    number: (car) => car.batteryCapacity,
    better: 'higher',
  },
  {
    label: 'Range',
    value: (car) =>
      car.range === null
        ? null
        : car.rangeMax
          ? `${car.range}–${car.rangeMax} km`
          : `${car.range} km`,
    number: (car) => car.range,
    better: 'higher',
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
  },
  {
    label: 'Power',
    value: (car) => (car.power ? `${car.power} ${car.powerUnit}` : null),
    number: (car) => car.power,
    better: 'higher',
  },
  { label: 'Torque', value: (car) => (car.torque ? `${car.torque} Nm` : null) },
  {
    label: '0–100 km/h',
    value: (car) => (car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null),
    number: (car) => car.acceleration,
    better: 'lower',
  },
  { label: 'Top speed', value: (car) => (car.topSpeed ? `${car.topSpeed} km/h` : null) },
  {
    label: 'DC charging',
    value: (car) => (car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null),
    number: (car) => car.dcCharging,
    better: 'higher',
  },
  {
    label: 'AC charging',
    value: (car) => (car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null),
    number: (car) => car.acCharging,
    better: 'higher',
  },
  { label: 'Connector', value: (car) => (car.connector?.length ? car.connector.join(', ') : null) },
  { label: 'Engine', value: (car) => (car.engineCapacity ? `${car.engineCapacity} cc` : null) },
  { label: 'Seats', value: (car) => (car.seats ? String(car.seats) : null) },
]

export function CarComparison({ cars, available, max }: CarComparisonProps) {
  const router = useRouter()
  const [adding, setAdding] = React.useState(false)

  const go = (ids: string[]) => {
    setAdding(false)
    if (ids.length === 0) router.push('/cars')
    else router.push(`/cars/compare?ids=${ids.join(',')}`)
  }

  const rows = ROWS.filter((row) => cars.some((car) => row.value(car) !== null))

  /**
   * Which car wins each row.
   *
   * Only when a row declares a direction, at least two cars have the figure,
   * and the winner is not tied — a "best" badge on a value another car matches
   * exactly would be misleading, and one on a row where only a single car has
   * a figure says nothing.
   */
  const winners = React.useMemo(() => {
    const out = new Map<string, string>()

    for (const row of rows) {
      if (!row.better || !row.number) continue

      const scored = cars
        .map((car) => ({ id: car.id, value: row.number!(car) }))
        .filter((entry): entry is { id: string; value: number } => entry.value !== null)

      if (scored.length < 2) continue

      const best =
        row.better === 'higher'
          ? Math.max(...scored.map((entry) => entry.value))
          : Math.min(...scored.map((entry) => entry.value))

      const holders = scored.filter((entry) => entry.value === best)
      if (holders.length === 1 && holders[0]) out.set(row.label, holders[0].id)
    }

    return out
  }, [cars, rows])

  const canAdd = cars.length < max && available.length > 0

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_36px_-28px_rgba(15,23,42,0.3)]">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">
            Specification comparison of {cars.map((car) => car.fullName).join(', ')}
          </caption>

          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 w-32 border-b border-slate-200 bg-white p-4 align-bottom text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400 sm:w-40"
              >
                Specification
              </th>

              {cars.map((car) => (
                <th
                  key={car.id}
                  scope="col"
                  className="relative min-w-[11.5rem] border-b border-l border-slate-200 p-4 align-bottom"
                >
                  {/* Remove is on the column it removes, which is where a
                      reader looks for it — not in a legend somewhere else. */}
                  <button
                    type="button"
                    onClick={() => go(cars.filter((entry) => entry.id !== car.id).map((entry) => entry.id))}
                    aria-label={`Remove ${car.fullName} from comparison`}
                    title={`Remove ${car.fullName}`}
                    className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-900"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>

                  <Link href={`/cars/${car.slug}`} className="group/car block">
                    <span className="relative mb-3 block aspect-[16/10] overflow-hidden rounded-xl bg-slate-50">
                      <PhotoFrame src={car.image ?? undefined} alt={car.fullName} sizes="220px" />
                    </span>

                    <span className="block text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {car.brand}
                    </span>
                    <span className="mt-1 block text-ui font-bold leading-snug tracking-tight text-slate-900 group-hover/car:text-plug-blue-700">
                      {car.model}
                    </span>
                    <span className="mt-2 block">
                      <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
                        {car.category}
                      </Badge>
                    </span>
                  </Link>
                </th>
              ))}

              {canAdd ? (
                <th
                  scope="col"
                  className="min-w-[11.5rem] border-b border-l border-slate-200 p-4 align-middle"
                >
                  {adding ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-ui-xs font-semibold text-slate-500">
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
                            Choose…
                          </option>
                          {available.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.fullName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => setAdding(false)}
                        className="text-ui-xs font-semibold text-slate-400 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-slate-300 px-4 py-8 text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
                    >
                      <Plus size={20} aria-hidden="true" />
                      <span className="text-ui-sm font-semibold">Add a car</span>
                      <span className="text-ui-xs text-slate-400">
                        up to {max}
                      </span>
                    </button>
                  )}
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} className={index % 2 === 1 ? 'bg-slate-50/60' : undefined}>
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 p-4 text-ui-sm font-medium text-slate-500',
                    // The sticky cell needs its own background or the scrolled
                    // columns show through it.
                    index % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white',
                  )}
                >
                  {row.label}
                </th>

                {cars.map((car) => {
                  const value = row.value(car)
                  const isBest = winners.get(row.label) === car.id

                  return (
                    <td
                      key={car.id}
                      className={cn(
                        'border-l border-slate-100 p-4 text-ui-sm font-semibold',
                        isBest ? 'text-slate-900' : 'text-slate-900',
                      )}
                    >
                      {value ? (
                        <span className="flex items-center gap-2">
                          {value}
                          {isBest ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              Best
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )
                })}

                {canAdd ? <td className="border-l border-slate-100" /> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-ui-xs leading-relaxed text-slate-400">
        A dash means the figure was not published for that car, not that it is zero. Rows
        no car has a figure for are hidden. &ldquo;Best&rdquo; marks the strongest
        published figure in a row where more than one car has one — it is not shown on
        price, type, connector or engine size, where higher or lower is a matter of what
        you want rather than better.
      </p>
    </div>
  )
}
