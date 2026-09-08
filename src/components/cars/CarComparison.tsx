// src/components/cars/CarComparison.tsx
'use client'

import { Check, Link2, Plus, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Badge, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { carDisplayName, formatPkr } from '@/lib/cars'
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
 *
 * Set on glass over a dark ground, which is why the page around it went dark
 * too. Glassmorphism is a translucent surface blurring what sits behind it —
 * on the white page this used to sit on there was nothing behind it to blur,
 * and the effect rendered as a flat grey box. The ground is the same one the
 * heroes use (slate-950, two blurred colour pools, a dot grid), so this reads
 * as the site's existing dark treatment rather than a new one.
 *
 * Two adjustments the effect forces, both deliberate:
 *
 *   - The blur lives on the two containers, never on a cell. backdrop-filter is
 *     expensive and compositing one per row of a scrolling table is how a
 *     comparison starts dropping frames on a phone.
 *   - The pinned label column is more opaque than the rest. A fully translucent
 *     sticky cell lets the columns scrolling underneath show through it, which
 *     turns the labels into mud exactly when they matter most.
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

/*
  Every row the detail page can show, in the order it shows them.

  ── Why this list grew from 13 rows to 34 ─────────────────────────────

  The table was built when the catalogue held fourteen columns per car and most
  of them were null, so thirteen rows was most of what there was to say. The
  rows now carry the full sheet — dimensions, real-world range, consumption,
  battery chemistry, warranty, distributor — and the comparison was still
  offering battery, range, charging, power and seats. Two cars could differ by
  400mm of wheelbase and 200 litres of boot and the page whose entire job is
  showing differences had no line for either.

  The labels, the units and the span formatting are deliberately identical to
  specGroups() in lib/cars.ts, which is what the detail page renders. A figure
  that reads "430–520 km (est.)" on one page and "430 km" on the other is a
  reader wondering which page is wrong.

  ── Where a bar and a BEST appear, and where they do not ──────────────

  Only on rows where more of something is unambiguously better than less of it.
  Power, range, torque and boot space qualify; a shorter 0-100 and a lower
  consumption qualify inverted. Dimensions do not — a longer car is not a better
  car, it is a longer car, and somebody comparing a hatchback against an SUV is
  choosing between them, not ranking them. Kerb weight is the same argument:
  lighter helps a 0-100 figure that already has its own row and hurts nothing
  the table measures.

  Price, powertrain, connector and engine size keep the exemption they already
  had, for the same reason.
*/
const GROUPS: Array<{ title: string; rows: Row[] }> = [
  {
    title: 'Basic information',
    rows: [
      { label: 'Pakistan price', value: (car) => car.price.display },
      { label: 'Powertrain', value: (car) => car.category },
      { label: 'Variant', value: (car) => car.variant?.trim() || null },
      { label: 'Model year', value: (car) => (car.modelYear ? String(car.modelYear) : null) },
      { label: 'Body type', value: (car) => car.bodyType?.trim() || null },
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
      { label: 'Battery technology', value: (car) => car.batteryTech?.trim() || null },
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
      { label: 'Range standard', value: (car) => car.rangeStandard?.trim() || null },
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
      {
        label: 'Real-world range',
        value: (car) =>
          car.realWorldRange === null || car.realWorldRange === undefined
            ? null
            : car.realWorldRangeMax
              ? `${car.realWorldRange}–${car.realWorldRangeMax} km (est.)`
              : `${car.realWorldRange} km (est.)`,
        number: (car) => car.realWorldRange ?? null,
        better: 'higher',
        unit: 'km',
      },
      {
        label: 'Energy consumption',
        value: (car) =>
          car.consumption === null || car.consumption === undefined
            ? null
            : car.consumptionMax
              ? `${car.consumption}–${car.consumptionMax} kWh/100 km (est.)`
              : `${car.consumption} kWh/100 km (est.)`,
        number: (car) => car.consumption ?? null,
        better: 'lower',
        unit: 'kWh per 100 km',
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
        label: 'DC charging time',
        value: (car) =>
          car.dcChargingMinutes === null || car.dcChargingMinutes === undefined
            ? null
            : `${car.dcChargingMinutes} min (10–80%)`,
        number: (car) => car.dcChargingMinutes ?? null,
        better: 'lower',
        unit: 'minutes',
      },
      {
        label: 'AC charging',
        value: (car) => (car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null),
        number: (car) => car.acCharging,
        better: 'higher',
        unit: 'kW',
      },
      {
        label: 'AC charging time',
        value: (car) =>
          car.acChargingHours === null || car.acChargingHours === undefined
            ? null
            : `${car.acChargingHours} h (0–100%)`,
        number: (car) => car.acChargingHours ?? null,
        better: 'lower',
        unit: 'hours',
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
        label: 'Motor power',
        value: (car) =>
          car.motorPowerKw === null || car.motorPowerKw === undefined
            ? null
            : `${car.motorPowerKw} kW`,
        number: (car) => car.motorPowerKw ?? null,
        better: 'higher',
        unit: 'kW',
      },
      {
        label: 'Power',
        value: (car) => (car.power ? `${car.power} ${car.powerUnit}` : null),
        number: (car) => car.power,
        better: 'higher',
        unit: 'hp',
      },
      {
        label: 'Torque',
        value: (car) => (car.torque ? `${car.torque} Nm` : null),
        number: (car) => car.torque,
        better: 'higher',
        unit: 'Nm',
      },
      {
        label: '0–100 km/h',
        value: (car) => (car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null),
        number: (car) => car.acceleration,
        better: 'lower',
        unit: 'seconds',
      },
      {
        label: 'Top speed',
        value: (car) => (car.topSpeed ? `${car.topSpeed} km/h` : null),
        number: (car) => car.topSpeed,
        better: 'higher',
        unit: 'km/h',
      },
      { label: 'Drive type', value: (car) => car.driveType?.trim() || null },
      { label: 'Engine', value: (car) => (car.engineCapacity ? `${car.engineCapacity} cc` : null) },
    ],
  },
  {
    title: 'Dimensions & practicality',
    rows: [
      { label: 'Length', value: (car) => (car.lengthMm ? `${car.lengthMm} mm` : null) },
      { label: 'Width', value: (car) => (car.widthMm ? `${car.widthMm} mm` : null) },
      { label: 'Height', value: (car) => (car.heightMm ? `${car.heightMm} mm` : null) },
      { label: 'Wheelbase', value: (car) => (car.wheelbaseMm ? `${car.wheelbaseMm} mm` : null) },
      {
        label: 'Ground clearance',
        value: (car) =>
          car.groundClearanceMm === null || car.groundClearanceMm === undefined
            ? null
            : car.groundClearanceMaxMm
              ? `${car.groundClearanceMm}–${car.groundClearanceMaxMm} mm`
              : `${car.groundClearanceMm} mm`,
      },
      {
        label: 'Boot space',
        value: (car) =>
          car.bootCapacityL === null || car.bootCapacityL === undefined
            ? null
            : `${car.bootCapacityL} L`,
        number: (car) => car.bootCapacityL ?? null,
        better: 'higher',
        unit: 'litres',
      },
      {
        label: 'Kerb weight',
        value: (car) =>
          car.kerbWeightKg === null || car.kerbWeightKg === undefined
            ? null
            : `${car.kerbWeightKg} kg`,
      },
      { label: 'Seats', value: (car) => (car.seats ? String(car.seats) : null) },
    ],
  },
  {
    title: 'Pakistan market',
    rows: [
      { label: 'Availability', value: (car) => car.availability?.trim() || null },
      { label: 'Official distributor', value: (car) => car.distributor?.trim() || null },
      { label: 'Warranty', value: (car) => car.warranty?.trim() || null },
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
              className="relative flex flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/65 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/80 hover:shadow-[0_26px_60px_-26px_rgba(15,23,42,0.35)]"
            >
              <button
                type="button"
                onClick={() => go(cars.filter((entry) => entry.id !== car.id).map((entry) => entry.id))}
                aria-label={`Remove ${carDisplayName(car)} from comparison`}
                className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 ring-1 ring-slate-900/10 backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                <X size={14} aria-hidden="true" />
              </button>

              <Link
                href={`/cars/${car.slug}`}
                className="group/car block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-cyan-400"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-white/70">
                  <PhotoFrame
                    src={car.image ?? undefined}
                    alt={carDisplayName(car)}
                    sizes="(max-width: 640px) 100vw, 320px"
                    zoomOnHover
                  />
                </span>

                <span className="block p-4">
                  {/* Same treatment as the catalogue card, so a car looks like
                      itself in both places. */}
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-lg leading-snug tracking-tight transition-colors group-hover/car:text-plug-blue-700">
                      <span className="font-display font-bold text-slate-900">{car.brand}</span>{' '}
                      <span className="font-sans text-ui font-semibold text-slate-500">
                        {car.model}
                      </span>
                      {/* The trim beneath, not appended: a comparison column is
                          narrow, and this is the one screen where two rows of the
                          same model may sit side by side — so the trim is the only
                          thing telling them apart and it must not be truncated
                          into the model name. */}
                      {car.variant ? (
                        <span className="mt-1 block font-mono text-ui-xs font-medium leading-snug text-plug-blue-700/85">
                          {car.variant}
                        </span>
                      ) : null}
                    </span>
                    <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
                      {car.category}
                    </Badge>
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
                <p className="mt-auto flex items-center gap-2 border-t border-slate-900/[0.07] bg-white/45 px-4 py-2.5 text-ui-xs">
                  <Trophy
                    size={12}
                    aria-hidden="true"
                    className={won > 0 ? 'text-amber-500' : 'text-slate-300'}
                  />
                  <span className={won > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                    Leads {won} of {analysis.measured} measured {analysis.measured === 1 ? 'row' : 'rows'}
                  </span>
                </p>
              ) : null}
            </div>
          )
        })}

      </div>

      {/* ── Table controls ──────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-ui-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(event) => setOnlyDifferences(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 bg-white accent-plug-blue-600"
          />
          Only show differences
        </label>

        {/*
          Adding a car sits here rather than as a fifth tile in the grid above.
          The dashed placeholder took a full column's width to hold one action
          and made a two-car comparison look like it was missing something — a
          control among the other controls reads as optional, which it is.

          The select replaces the button in place instead of opening a panel:
          one step, and the row keeps its height so nothing below it shifts.
        */}
        {canAdd ? (
          adding ? (
            <div className="flex items-center gap-2">
              <select
                autoFocus
                defaultValue=""
                aria-label="Add a car to the comparison"
                onChange={(event) =>
                  event.target.value && go([...cars.map((car) => car.id), event.target.value])
                }
                className="h-10 max-w-[16rem] cursor-pointer rounded-full border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-800 outline-none focus:border-plug-blue-500"
              >
                <option value="" disabled>
                  Choose a car…
                </option>
                {available.map((car) => (
                  <option key={car.id} value={car.id}>
                    {carDisplayName(car)} — {car.price.display}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAdding(false)}
                aria-label="Cancel adding a car"
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-900"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 text-ui-sm font-semibold text-slate-700 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)] backdrop-blur-md transition-colors hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F7FC]"
            >
              <Plus size={14} aria-hidden="true" />
              Add a car
              <span className="font-mono text-[10px] text-slate-400">
                {cars.length}/{max}
              </span>
            </button>
          )
        ) : null}

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 text-ui-sm font-semibold text-slate-700 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)] backdrop-blur-md transition-colors hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F7FC]"
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
      {/* One pane, one blur. The scroll container carries the glass so the
          table inside it composites once rather than per cell. */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/80 bg-white/65 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">
            Specification comparison of {cars.map((car) => carDisplayName(car)).join(', ')}
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
                  {/*
                    A real heading, not a caption. These were 11px grey
                    uppercase, which on a table of bold black figures read as
                    incidental — the reader lost track of which block they were
                    in halfway down. In the display face at full ink they divide
                    the table the way a section title should.
                  */}
                  <th
                    scope="colgroup"
                    colSpan={cars.length + 1}
                    className="border-y border-slate-900/[0.08] bg-white/55 px-4 py-3.5 font-display text-[1.0625rem] font-extrabold uppercase tracking-[0.08em] text-plug-navy-800"
                  >
                    {group.title}
                  </th>
                </tr>

                {group.rows.map((row) => {
                  const scale = analysis.scales.get(row.label)

                  return (
                    <tr key={row.label} className="border-b border-slate-900/[0.06] last:border-b-0">
                      {/* More opaque than the pane, and blurred in its own
                          right: a fully translucent pinned cell lets the
                          columns scrolling beneath it show through, which is
                          unreadable exactly when the label matters. */}
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-white/75 px-4 py-3.5 align-middle text-ui-sm font-medium text-slate-500 backdrop-blur-md"
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
                            className="border-l border-slate-900/[0.06] px-4 py-3.5 align-middle"
                          >
                            {value ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-ui-sm font-semibold text-slate-900">
                                    {value}
                                  </span>
                                  {isBest ? (
                                    <span className="shrink-0 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/25">
                                      Best
                                    </span>
                                  ) : null}
                                </div>

                                {width > 0 ? (
                                  <div
                                    aria-hidden="true"
                                    className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-900/10"
                                  >
                                    <div
                                      style={{ width: `${width}%` }}
                                      className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        isBest ? 'bg-emerald-500' : 'bg-slate-400/70',
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

      <div className="mt-5 flex flex-col gap-2 text-ui-xs leading-relaxed text-slate-500">
        <p>
          A dash means the figure was not published for that car, not that it is zero.
          Bars are scaled to the largest value in their own row, so they compare these
          cars against each other and nothing else.
        </p>
        <p>
          <span className="font-semibold text-slate-700">Best</span> marks the strongest
          published figure in a row where more than one car has one and nothing ties. It
          is never shown on price, powertrain, connector or engine size — there, higher or
          lower is a matter of what you want rather than better.
        </p>
      </div>
    </div>
  )
}
