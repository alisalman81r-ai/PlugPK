// src/components/calculator/SocBattery.tsx
'use client'

import * as React from 'react'

import { Minus, Plus } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * The battery, as the control for its own charge levels.
 *
 * ── Why the handles sit on the battery ────────────────────────────────
 *
 * Two number fields for "current" and "target" are accurate and tell a driver
 * nothing at a glance. The question they are really answering is "how much of
 * my pack am I filling?", and that is a picture: what is already there, what
 * this charge adds, and what stays empty. So the battery is drawn at full width
 * and its two edges are dragged directly, the way the charge itself moves.
 *
 * ── How two thumbs share one track ────────────────────────────────────
 *
 * Two native range inputs, laid over each other and over the battery. The
 * inputs ignore the pointer; only their thumbs take it. Native inputs are the
 * point: keyboard arrows, screen-reader values and touch dragging all work
 * with nothing reimplemented. Each thumb is 32px, so it clears the 24px
 * minimum touch target with room to spare on a phone.
 *
 * The thumbs cannot cross. The current level stops one percent short of the
 * target and the target one percent past the current, so the calculator never
 * receives a charge that runs backwards. When the two meet at the right-hand
 * end the current thumb is raised on top, or it could never be dragged back.
 */

export interface SocBatteryProps {
  from: number
  to: number
  onChange: (from: number, to: number) => void
  /** Pack size, for the kWh figure on the added segment. Omitted if unknown. */
  batteryKwh: number | null
}

const PRESETS = [
  { label: 'Daily top-up', from: 20, to: 80 },
  { label: 'Before a long drive', from: 20, to: 100 },
  { label: 'Quick stop', from: 10, to: 80 },
] as const

export function SocBattery({ from, to, onChange, batteryKwh }: SocBatteryProps) {
  // Which thumb was touched last. It stays on top so a pair that has met can
  // always be pulled apart again.
  const [active, setActive] = React.useState<'from' | 'to'>('to')

  const setFrom = (value: number) => onChange(Math.min(value, to - 1), to)
  const setTo = (value: number) => onChange(from, Math.max(value, from + 1))

  const added = to - from
  const addedKwh = batteryKwh ? (batteryKwh * added) / 100 : null
  const fromOnTop = active === 'from' || from > 95

  return (
    <div>
      {/* The two figures, over the handles they belong to. */}
      <div className="mb-3 flex items-end justify-between gap-4">
        <Readout label="Now" value={from} />
        <div className="pb-1 text-center">
          <span className="text-ui-sm font-semibold text-plug-cyan-700">+{added}%</span>
          {addedKwh ? (
            <span className="ml-1.5 text-ui-sm text-slate-500">
              · {addedKwh < 10 ? addedKwh.toFixed(1) : Math.round(addedKwh)} kWh
            </span>
          ) : null}
        </div>
        <Readout label="Target" value={to} align="right" />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative h-16 flex-1 sm:h-[4.5rem]">
          {/* The pack. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-1"
          >
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-50">
              {/* Already in the pack. */}
              <span
                className="absolute inset-y-0 left-0 bg-slate-200"
                style={{ width: `${from}%` }}
              />
              {/* What this charge adds. A fine hatch rather than a glow: it
                  reads as "energy going in" without lighting up the page. */}
              <span
                className="absolute inset-y-0 bg-plug-cyan-500 transition-[left,width] duration-150 ease-out motion-reduce:transition-none"
                style={{
                  left: `${from}%`,
                  width: `${added}%`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)',
                }}
              />
              {/* Quarter marks, so 25/50/75 can be found without reading. */}
              {[25, 50, 75].map((mark) => (
                <span
                  key={mark}
                  className="absolute inset-y-2 w-px bg-slate-900/10"
                  style={{ left: `${mark}%` }}
                />
              ))}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={99}
            step={1}
            value={from}
            onChange={(e) => setFrom(Number(e.target.value))}
            onPointerDown={() => setActive('from')}
            onFocus={() => setActive('from')}
            aria-label="Current charge"
            aria-valuetext={`${from} percent`}
            className={cn('soc-range', fromOnTop ? 'z-20' : 'z-10')}
          />
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={to}
            onChange={(e) => setTo(Number(e.target.value))}
            onPointerDown={() => setActive('to')}
            onFocus={() => setActive('to')}
            aria-label="Target charge"
            aria-valuetext={`${to} percent`}
            className={cn('soc-range', fromOnTop ? 'z-10' : 'z-20')}
          />
        </div>

        {/* The terminal nub, so the shape reads as a battery at a glance. */}
        <span aria-hidden="true" className="h-7 w-2 shrink-0 rounded-r-md bg-slate-300" />
      </div>

      {/*
        Fine control under each handle. Dragging to exactly 35% on a phone is
        fiddly, so each end also steps in fives — snapping to the nearest five
        first, so 23% goes to 25% rather than 28%.
      */}
      <div className="mt-3 flex items-center justify-between gap-2 pr-3.5">
        <Stepper
          label="current charge"
          onDown={() => setFrom(Math.max(0, stepDown(from)))}
          onUp={() => setFrom(stepUp(from))}
          canDown={from > 0}
          canUp={from < to - 1}
        />
        <span className="text-center text-ui-xs text-slate-400">Drag the handles, or tap − and +</span>
        <Stepper
          label="target charge"
          onDown={() => setTo(stepDown(to))}
          onUp={() => setTo(Math.min(100, stepUp(to)))}
          canDown={to > from + 1}
          canUp={to < 100}
        />
      </div>

      {/* Common charges, one tap each. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const on = preset.from === from && preset.to === to
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.from, preset.to)}
              aria-pressed={on}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-ui-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                on
                  ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {preset.label}
              <span className={cn('tabular-nums', on ? 'text-white/70' : 'text-slate-400')}>
                {preset.from}→{preset.to}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const stepDown = (v: number) => (v % 5 ? v - (v % 5) : v - 5)
const stepUp = (v: number) => (v % 5 ? v + (5 - (v % 5)) : v + 5)

function Stepper({
  label,
  onDown,
  onUp,
  canDown,
  canUp,
}: {
  label: string
  onDown: () => void
  onUp: () => void
  canDown: boolean
  canUp: boolean
}) {
  const button =
    'grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2'
  return (
    <div className="flex shrink-0 gap-1.5">
      <button type="button" onClick={onDown} disabled={!canDown} aria-label={`Lower ${label} by 5%`} className={button}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onUp} disabled={!canUp} aria-label={`Raise ${label} by 5%`} className={button}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

function Readout({ label, value, align }: { label: string; value: number; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : undefined}>
      <span className="block text-ui-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="block text-3xl font-bold leading-none tabular-nums text-slate-900 sm:text-4xl">
        {value}
        <span className="text-xl text-slate-400 sm:text-2xl">%</span>
      </span>
    </div>
  )
}
