// src/components/route/BatterySlider.tsx
'use client'

import * as React from 'react'

import { RANGE_DERATE } from '@/lib/route-plan'
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

type Level = 'ok' | 'mid' | 'low'

/** The battery's colour: volt when healthy, amber when middling, ember when low. */
const LEVEL: Record<Level, { fill: string; pct: string }> = {
  ok: { fill: '#D4FF3A', pct: 'text-ink' },
  mid: { fill: '#FFB020', pct: 'text-[#8A5300]' },
  low: { fill: '#FF5A1F', pct: 'text-[#B42E05]' },
}

function levelOf(value: number): Level {
  if (value < 20) return 'low'
  if (value < 40) return 'mid'
  return 'ok'
}

/**
 * The starting charge, drawn as a battery (landing-v2 .batt): a stone cell with
 * a hatched fill, a grabbable ink thumb, a nub at the end, and tap targets for
 * the quarter marks.
 */
export function BatterySlider({ value, onChange, className, vehicle }: BatterySliderProps) {
  const level = levelOf(value)
  const tone = LEVEL[level]
  const p = Math.max(0, Math.min(100, value)) / 100
  // The same derate the planner uses (RANGE_DERATE in lib/route-plan), so the
  // figure here and the plan that follows agree.
  const estimatedRange = vehicle ? Math.round((vehicle.rangeKm * RANGE_DERATE * value) / 100) : null

  return (
    <div className={cn('w-full', className)}>
      <div className="mt-0.5 flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-ink">Current battery level</span>
        <output
          aria-hidden="true"
          className={cn(
            'font-mono text-[40px] font-semibold leading-[0.9] tracking-[-0.04em] tabular-nums transition-colors duration-300 sm:text-[46px]',
            tone.pct,
          )}
        >
          {value}%
        </output>
      </div>

      <p className="mt-1 flex items-center gap-2.5 text-[13px] text-muted">
        <span aria-hidden="true" className="relative h-3.5 w-[26px] flex-none rounded-[4px] border-[1.5px] border-ink p-[1.5px]">
          <i
            className="block h-full rounded-[1.5px] transition-[background-color,width] duration-300"
            style={{ width: `${p * 100}%`, background: tone.fill }}
          />
          <span className="absolute -right-1 top-[3px] h-1 w-0.5 rounded-r-sm bg-ink" />
        </span>
        <span>
          Your EV starts the journey at <b className="font-mono font-semibold text-ink">{value}%</b>
          {level === 'low' ? <span className={cn('ml-1.5 font-semibold', tone.pct)}>· Low battery</span> : null}
        </span>
      </p>

      <div
        className={cn(
          'relative mr-2.5 mt-2 h-14 rounded-2xl border-2 border-ink',
          'bg-stone bg-[radial-gradient(rgba(11,12,14,.08)_1px,transparent_1.5px)] bg-[length:10px_10px]',
          'has-[:focus-visible]:shadow-[0_0_0_7px_rgba(212,255,58,.6)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 overflow-hidden rounded-[11px] shadow-[inset_0_-6px_12px_-6px_rgba(11,12,14,.25)] transition-[background-color] duration-300"
          style={{
            width: `calc(9px + (100% - 18px) * ${p})`,
            backgroundColor: tone.fill,
            backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 14px, rgba(255,255,255,.28) 14px 16px)',
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Current battery level"
          aria-valuetext={`${value} percent${level === 'low' ? ', low battery' : ''}`}
          className={cn(
            'absolute inset-1 m-0 h-[calc(100%-8px)] w-[calc(100%-8px)] cursor-grab touch-pan-y appearance-none bg-transparent outline-none active:cursor-grabbing',
            '[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent',
            '[&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[9px] [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_4px_14px_-2px_rgba(11,12,14,.45)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200 active:[&::-webkit-slider-thumb]:scale-x-125',
            '[&::-webkit-slider-thumb]:[background-image:linear-gradient(90deg,transparent_6px,#D4FF3A_6px_8px,transparent_8px_10px,#D4FF3A_10px_12px,transparent_12px)] [&::-webkit-slider-thumb]:[background-position:center] [&::-webkit-slider-thumb]:[background-repeat:no-repeat] [&::-webkit-slider-thumb]:[background-size:100%_18px]',
            '[&::-moz-range-track]:h-full [&::-moz-range-track]:bg-transparent',
            '[&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:rounded-[9px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:shadow-[0_4px_14px_-2px_rgba(11,12,14,.45)]',
          )}
        />
        <span aria-hidden="true" className="absolute -right-[9px] top-1/2 -mt-2.5 h-5 w-1.5 rounded-r-[5px] bg-ink" />
      </div>

      <div className="mr-2.5 mt-1 flex justify-between">
        {TICKS.map((tick, i) => (
          <button
            key={tick}
            type="button"
            onClick={() => onChange(tick)}
            aria-label={`Set battery to ${tick}%`}
            className={cn(
              'h-11 min-w-11 rounded-[10px] px-1 font-mono text-xs transition-colors duration-200 hover:bg-chalk hover:text-ink',
              i === 0 && '-ml-2.5',
              i === TICKS.length - 1 && '-mr-3.5',
              value === tick ? 'font-bold text-volt-ink' : 'font-medium text-fog',
            )}
          >
            {tick}%
          </button>
        ))}
      </div>

      {estimatedRange !== null ? (
        <p className="mt-1 font-mono text-[12.5px] text-muted">
          About <b className="font-semibold text-ink">{estimatedRange} km</b> at motorway speeds (rated{' '}
          {Math.round(((vehicle?.rangeKm ?? 0) * value) / 100)} km)
        </p>
      ) : null}
    </div>
  )
}
