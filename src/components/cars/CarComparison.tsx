// src/components/cars/CarComparison.tsx
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Badge, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { cn } from '@/lib/utils'

/**
 * Two to four cars, side by side.
 *
 * Rows are chosen from the cars being compared, not from a fixed list: a row
 * appears only if at least one of them has a figure for it. Comparing two PHEVs
 * therefore shows an engine row and no DC-charging row, and comparing two EVs
 * does the opposite — without either table carrying a band of empty cells.
 *
 * Within a row, a car that lacks the figure shows an em dash. That is the one
 * place a dash is right: the column has to stay aligned with its neighbours, and
 * the row's own label tells the reader what is missing.
 *
 * Responsive by scrolling the table horizontally rather than collapsing it into
 * stacked cards. A comparison read as four separate lists is not a comparison;
 * the first column stays pinned so the labels never scroll away.
 */

export interface CarComparisonProps {
  cars: Car[]
}

const CATEGORY_VARIANT: Record<CarCategory, BadgeVariant> = {
  EV: 'blue',
  PHEV: 'amber',
  REEV: 'purple',
  Hybrid: 'green',
}

/** One row per comparable figure, each pulling its own value from a car. */
const ROWS: Array<{ label: string; value: (car: Car) => string | null }> = [
  { label: 'Price', value: (car) => car.price.display },
  { label: 'Type', value: (car) => car.category },
  {
    label: 'Battery',
    value: (car) => (car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null),
  },
  {
    label: 'Range',
    value: (car) =>
      car.range === null ? null : car.rangeMax ? `${car.range}–${car.rangeMax} km` : `${car.range} km`,
  },
  {
    label: 'Electric range',
    value: (car) =>
      car.electricRange === null
        ? null
        : car.electricRangeMax
          ? `${car.electricRange}–${car.electricRangeMax} km`
          : `${car.electricRange} km`,
  },
  { label: 'Power', value: (car) => (car.power ? `${car.power} ${car.powerUnit}` : null) },
  { label: 'Torque', value: (car) => (car.torque ? `${car.torque} Nm` : null) },
  {
    label: '0–100 km/h',
    value: (car) => (car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null),
  },
  { label: 'Top speed', value: (car) => (car.topSpeed ? `${car.topSpeed} km/h` : null) },
  {
    label: 'DC charging',
    value: (car) => (car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null),
  },
  {
    label: 'AC charging',
    value: (car) => (car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null),
  },
  {
    label: 'Connector',
    value: (car) => (car.connector?.length ? car.connector.join(', ') : null),
  },
  { label: 'Engine', value: (car) => (car.engineCapacity ? `${car.engineCapacity} cc` : null) },
  { label: 'Seats', value: (car) => (car.seats ? String(car.seats) : null) },
]

export function CarComparison({ cars }: CarComparisonProps) {
  // A row nobody has a figure for is dropped entirely.
  const rows = ROWS.filter((row) => cars.some((car) => row.value(car) !== null))

  return (
    <div>
      <Link
        href="/cars"
        className="group/back inline-flex items-center gap-1.5 text-ui-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft
          size={15}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover/back:-translate-x-0.5"
        />
        All cars
      </Link>

      {/* The scroll container, not the page, is what moves sideways. */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[38rem] border-collapse text-left">
          <caption className="sr-only">
            Specification comparison of {cars.map((car) => car.fullName).join(', ')}
          </caption>

          <thead>
            <tr>
              {/* Pinned so the labels stay visible while the columns scroll. */}
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
                  className="min-w-[11rem] border-b border-l border-slate-200 p-4 align-bottom"
                >
                  <Link href={`/cars/${car.slug}`} className="group/car block">
                    <span className="relative mb-3 block aspect-[16/10] overflow-hidden rounded-xl bg-slate-50">
                      <PhotoFrame
                        src={car.image ?? undefined}
                        alt={car.fullName}
                        sizes="200px"
                      />
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

                  return (
                    <td
                      key={car.id}
                      className="border-l border-slate-100 p-4 text-ui-sm font-semibold text-slate-900"
                    >
                      {value ?? <span className="text-slate-300">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-ui-xs leading-relaxed text-slate-400">
        A dash means the figure was not published for that car, not that it is zero. Rows
        no car has a figure for are hidden entirely.
      </p>
    </div>
  )
}
