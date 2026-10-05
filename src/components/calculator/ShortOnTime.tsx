// src/components/calculator/ShortOnTime.tsx
'use client'

import * as React from 'react'

import { Timer } from '@/components/ui/icons'
import {
  chargeWithin,
  formatKw,
  formatKwh,
  formatPct,
  formatPctAdded,
  rangeAddedKm,
  type ChargeMode,
} from '@/lib/charging-time'
import { cn } from '@/lib/utils'

/**
 * The question asked at the charger rather than at home: "I have half an
 * hour — how much will I get?"
 *
 * Runs the calculator's own model backwards (lib/charging-time chargeWithin),
 * from the current level, on the charger chosen above and with the car's
 * limits, so it can never disagree with the main figure: the time the main
 * panel gives for 20→77% is the time this gives 77% for.
 */

const TIMES = [15, 30, 45, 60, 90] as const

export interface ShortOnTimeProps {
  batteryKwh: number | null
  fromPct: number
  mode: ChargeMode
  chargerKw: number | null
  carLimitKw: number | null
  rangeKm: number | null
}

export function ShortOnTime({ batteryKwh, fromPct, mode, chargerKw, carLimitKw, rangeKm }: ShortOnTimeProps) {
  const [minutes, setMinutes] = React.useState<number>(30)
  const got = chargeWithin({ batteryKwh, fromPct, mode, chargerKw, carLimitKw, minutes })
  const powerKw = chargerKw && carLimitKw ? Math.min(chargerKw, carLimitKw) : chargerKw
  const km = got && got.toPct > fromPct ? rangeAddedKm(rangeKm, fromPct, got.toPct) : null
  const dc = mode === 'dc'

  return (
    <section aria-labelledby="short-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h2 id="short-heading" className="flex items-center gap-2 text-ui font-semibold text-slate-900">
          <Timer size={18} className="text-plug-cyan-700" aria-hidden="true" />
          Short on time?
        </h2>
        <p className="text-ui-sm text-slate-500">How far a set time gets you, from {fromPct}% on the charger above.</p>
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
        <div role="radiogroup" aria-label="Time on the charger" className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={minutes === t}
              onClick={() => setMinutes(t)}
              className={cn(
                'min-h-11 min-w-[4.25rem] rounded-xl border-[1.5px] px-3 text-ui font-semibold tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                minutes === t
                  ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300',
              )}
            >
              {t < 60 ? `${t} min` : t === 60 ? '1 h' : '1½ h'}
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {got && powerKw ? (
            <>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {fromPct}% → {dc && !got.full ? '~' : ''}
                {formatPct(got.toPct)}
                {got.full ? <span className="ml-2 text-ui font-semibold text-plug-cyan-700">Full before time is up</span> : null}
              </p>
              <p className="mt-1 text-ui-sm text-slate-600">
                +{formatKwh(got.energyKwh)} ({formatPctAdded(got.toPct - fromPct)})
                {km != null ? ` · about +${km} km of rated range` : ''} · {dc ? 'DC' : 'AC'} at {formatKw(powerKw)}
                {dc ? ', slowing as it fills' : ''}
              </p>
            </>
          ) : (
            <p className="text-ui-sm text-slate-500">Add your battery size and a charger above to see this.</p>
          )}
        </div>
      </div>
    </section>
  )
}
