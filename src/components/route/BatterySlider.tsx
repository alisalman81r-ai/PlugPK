// src/components/route/BatterySlider.tsx
'use client'

import { BatteryCharging } from 'lucide-react'
import * as React from 'react'

import type { EVModel } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface BatterySliderProps {
  value: number
  onChange: (value: number) => void
  className?: string
  /** Supplied by the form so the remaining-range estimate can be shown. */
  vehicle?: EVModel | null
}

const TICKS = [0, 25, 50, 75, 100]

function levelClasses(value: number) {
  if (value >= 60) return { text: 'text-green-600', fill: 'bg-green-500', border: 'border-green-500' }
  if (value >= 30) return { text: 'text-amber-600', fill: 'bg-amber-500', border: 'border-amber-500' }
  return { text: 'text-red-600', fill: 'bg-red-500', border: 'border-red-500' }
}

export function BatterySlider({ value, onChange, className, vehicle }: BatterySliderProps) {
  const level = levelClasses(value)
  const estimatedRange = vehicle ? Math.round((vehicle.rangeKm * value) / 100) : null

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Current Battery Level</span>
        <span className={cn('font-mono text-2xl font-bold', level.text)}>{value}%</span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span aria-hidden="true" className="relative flex h-6 w-12 shrink-0 items-center">
          <span className="relative h-full w-full rounded-lg border-2 border-slate-300 p-0.5">
            <span
              className={cn('block h-full rounded-md transition-all duration-300', level.fill)}
              style={{ width: `${value}%` }}
            />
          </span>
          <span className="ml-0.5 h-2.5 w-1 shrink-0 rounded-r bg-slate-300" />
        </span>

        <span className="text-sm text-slate-500">
          Your EV starts the journey at {value}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Current battery level"
        aria-valuetext={`${value} percent`}
        // --fill drives the coloured portion of the track; see globals.css.
        style={{ '--fill': `${value}%` } as React.CSSProperties}
        className={cn('plug-range w-full', value >= 60 && 'is-high', value >= 30 && value < 60 && 'is-mid', value < 30 && 'is-low')}
      />

      <div className="mt-2 flex justify-between">
        {TICKS.map((tick) => (
          <span
            key={tick}
            className={cn('text-xs', Math.abs(value - tick) < 13 ? level.text : 'text-slate-400')}
          >
            {tick}%
          </span>
        ))}
      </div>

      {estimatedRange !== null ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <BatteryCharging size={14} className="shrink-0" aria-hidden="true" />
          Estimated range: {estimatedRange}km remaining
        </p>
      ) : null}
    </div>
  )
}
