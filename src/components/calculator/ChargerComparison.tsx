// src/components/calculator/ChargerComparison.tsx
'use client'

import { estimateCharge, formatDuration, formatKw, formatRupees, type ChargeMode } from '@/lib/charging-time'
import { cn } from '@/lib/utils'

import type { CalculatorCar } from './types'

/**
 * The same charge on every common charger, side by side.
 *
 * The question behind most visits is not "how long on this charger" but
 * "which charger should I use" — is a wall box worth it, is it worth driving
 * to a fast charger. One answer at a time cannot show that; six rows can.
 *
 * Each row runs the same estimate as the main panel, with the car's own limits
 * applied, so a car that caps at 6.6 kW shows the 7.4, 11 and 22 kW boxes
 * taking the same time — which is itself the most useful thing on the page for
 * someone about to buy the bigger one. Tapping a row selects that charger
 * above.
 *
 * Bars are proportional to time against the slowest row, so a two-hour gap
 * looks like one. The fastest DC rows get a sliver rather than nothing.
 */

const OPTIONS: { mode: ChargeMode; kw: number; label: string }[] = [
  { mode: 'ac', kw: 3.7, label: 'Home socket' },
  { mode: 'ac', kw: 7.4, label: 'Wall box' },
  { mode: 'ac', kw: 11, label: 'Three-phase box' },
  { mode: 'ac', kw: 22, label: 'Three-phase box' },
  { mode: 'dc', kw: 60, label: 'DC fast charger' },
  { mode: 'dc', kw: 120, label: 'DC rapid charger' },
]

export interface ChargerComparisonProps {
  batteryKwh: number | null
  from: number
  to: number
  car: CalculatorCar | null
  ratePerKwh: number | null
  /** The charger chosen above, if it is one of the presets. */
  selectedMode: ChargeMode | null
  selectedKw: number | null
  onChoose: (mode: ChargeMode, kw: number) => void
}

export function ChargerComparison({
  batteryKwh,
  from,
  to,
  car,
  ratePerKwh,
  selectedMode,
  selectedKw,
  onChoose,
}: ChargerComparisonProps) {
  const rows = OPTIONS.map((o) => ({
    ...o,
    result: estimateCharge({
      batteryKwh,
      fromPct: from,
      toPct: to,
      mode: o.mode,
      chargerKw: o.kw,
      carLimitKw: car ? (o.mode === 'ac' ? car.acKw : car.dcKw) : null,
      ratePerKwh,
    }),
  }))

  const slowest = Math.max(...rows.map((r) => (r.result.ok ? r.result.minutes : 0)))
  const ready = slowest > 0

  return (
    <section aria-labelledby="compare-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h2 id="compare-heading" className="text-ui font-semibold text-slate-900">
          Same charge, every charger
        </h2>
        <p className="text-ui-sm text-slate-500">
          {ready ? `${from}% → ${to}%${car ? ` on ${car.name}` : ''}. Tap one to use it above.` : 'Appears once you add your battery.'}
        </p>
      </div>

      {ready ? (
        <ul className="mt-4 grid gap-2 lg:grid-cols-2 lg:gap-x-6">
          {rows.map((row) => {
            if (!row.result.ok) return null
            const r = row.result
            const on = selectedMode === row.mode && selectedKw === row.kw
            const capped = r.limitedBy === 'car'
            const share = Math.max(3, (r.minutes / slowest) * 100)

            return (
              <li key={`${row.mode}-${row.kw}`}>
                <button
                  type="button"
                  onClick={() => onChoose(row.mode, row.kw)}
                  aria-pressed={on}
                  className={cn(
                    'group w-full rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                    on ? 'border-plug-blue-600 bg-plug-blue-600/[0.04]' : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0">
                      <span className="text-ui-sm font-semibold text-slate-900">
                        {row.label} · {formatKw(row.kw)}
                      </span>
                      <span className="mt-0.5 block text-ui-xs text-slate-500">
                        {capped
                          ? `Your car takes ${formatKw(r.powerKw)} max`
                          : row.mode === 'dc'
                            ? 'Estimate — slows as it fills'
                            : `Runs at ${formatKw(r.powerKw)}`}
                        {/* No DC cost: at the home rate it would read as the
                            cheaper option, and public DC usually bills more. */}
                        {r.cost != null && row.mode === 'ac' ? ` · ${formatRupees(r.cost)}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                      {row.mode === 'dc' ? '~' : ''}
                      {formatDuration(r.minutes)}
                    </span>
                  </span>

                  <span aria-hidden="true" className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className={cn(
                        'block h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
                        row.mode === 'dc' ? 'bg-plug-cyan-500' : 'bg-plug-blue-600',
                      )}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
