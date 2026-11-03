// src/components/calculator/SocBattery.tsx
'use client'

import * as React from 'react'

import { chipClass } from '@/components/v2/ui'
import { Minus, Plus, Zap } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import styles from './battery.module.css'

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
 * with nothing reimplemented. Each handle is 30px wide and taller than the
 * battery, so it clears the minimum touch target with room to spare.
 *
 * The thumbs cannot cross. The current level stops one percent short of the
 * target and the target one percent past the current, so the calculator never
 * receives a charge that runs backwards. When the two meet at the right-hand
 * end the current thumb is raised on top, or it could never be dragged back.
 *
 * Styled as landing-v2's .batt: the charge already in the pack (ember when
 * low, amber when middling), the volt charge being added with its waves, and
 * the handles in battery.module.css.
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

/** The inner fill sits 7px inside the shell's border (.batt --pad). */
const PAD = 7

export function SocBattery({ from, to, onChange, batteryKwh }: SocBatteryProps) {
  // Which thumb was touched last. It stays on top so a pair that has met can
  // always be pulled apart again.
  const [active, setActive] = React.useState<'from' | 'to'>('to')

  const setFrom = (value: number) => onChange(Math.min(value, to - 1), to)
  const setTo = (value: number) => onChange(from, Math.max(value, from + 1))

  const added = to - from
  const addedKwh = batteryKwh ? (batteryKwh * added) / 100 : null
  const fromOnTop = active === 'from' || from > 95

  const have =
    from <= 15
      ? 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,.08) 10px 11px),linear-gradient(180deg,#FF7A45,#FF5A1F)'
      : from < 40
        ? 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,.12) 10px 11px),linear-gradient(180deg,#FFC24D,#FFB020)'
        : 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,.05) 10px 11px),linear-gradient(180deg,#2C3037,#1C1F24)'

  return (
    <div className="mt-1.5 grid gap-3.5">
      {/* The two figures, over the handles they belong to. */}
      <div className="flex items-end justify-between gap-3">
        <Readout label="Now" value={from} />
        <span className="mb-[-6px] inline-flex h-8 items-center gap-1.5 self-center whitespace-nowrap rounded-full bg-ink px-3.5 font-mono text-sm font-semibold tabular-nums text-volt">
          +{added}%
          {addedKwh ? (
            <span className="font-medium text-white/60">
              · {addedKwh < 10 ? addedKwh.toFixed(1) : Math.round(addedKwh)} kWh
            </span>
          ) : null}
        </span>
        <Readout label="Target" value={to} align="right" />
      </div>

      <div
        className="relative mt-2 flex select-none items-center pr-0 [--bh:96px] sm:[--bh:120px] lg:[--bh:132px]"
        style={{ ['--pad' as string]: `${PAD}px` }}
      >
        <div className="relative h-[var(--bh)] flex-1 rounded-[22px] border-[3px] border-ink bg-stone shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_18px_40px_-24px_rgba(11,12,14,.5)] sm:rounded-[28px]">
          {/* The pack. */}
          <div
            aria-hidden="true"
            className="absolute inset-[7px] overflow-hidden rounded-[15px] bg-[radial-gradient(rgba(11,12,14,.08)_1px,transparent_1.5px)] bg-[length:14px_14px] sm:rounded-[20px]"
          >
            {/* Already in the pack. */}
            <span className="absolute inset-y-0 left-0" style={{ width: `${from}%`, background: have }} />
            {/* What this charge adds. */}
            <span
              className="absolute inset-y-0 bg-[radial-gradient(120%_90%_at_20%_10%,#F3FFC2,#D4FF3A_55%,#B9E61F)]"
              style={{ left: `${from}%`, width: `${added}%` }}
            >
              <span className="absolute inset-0 overflow-hidden">
                <svg className={styles.wave} viewBox="0 0 240 120" preserveAspectRatio="none">
                  <path d="M0 52 Q30 40 60 52 T120 52 T180 52 T240 52 V120 H0Z" fill="rgba(255,255,255,.28)" />
                </svg>
                <svg className={cn(styles.wave, styles.waveB)} viewBox="0 0 240 120" preserveAspectRatio="none">
                  <path d="M0 66 Q30 78 60 66 T120 66 T180 66 T240 66 V120 H0Z" fill="rgba(169,216,26,.45)" />
                </svg>
              </span>
              {to < 100 ? (
                <span className="absolute -right-[11px] bottom-0 top-0 w-3 overflow-hidden">
                  <svg className={styles.edge} viewBox="0 0 12 120" preserveAspectRatio="none">
                    <path d="M0 0H6Q12 7.5 6 15T6 30T6 45T6 60T6 75T6 90T6 105T6 120H0Z" fill="#C6F02A" />
                  </svg>
                </span>
              ) : null}
              <span
                className={cn(
                  'absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-volt shadow-[0_6px_18px_-6px_rgba(11,12,14,.6)] transition-[opacity,scale] duration-300 ease-spring sm:size-10',
                  added < 14 ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
                )}
              >
                <Zap size={18} fill="currentColor" aria-hidden="true" />
              </span>
            </span>
            {/* Tenths, so a level can be read without the ticks. */}
            <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_calc(10%-1px),rgba(11,12,14,.07)_calc(10%-1px)_10%)]" />
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
            className={cn(styles.range, fromOnTop ? 'z-20' : 'z-10')}
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
            className={cn(styles.range, fromOnTop ? 'z-10' : 'z-20')}
          />
        </div>

        {/* The terminal nub, so the shape reads as a battery at a glance. */}
        <span aria-hidden="true" className="ml-1 h-[42px] w-3 shrink-0 rounded-r-lg bg-ink" />
      </div>

      <div aria-hidden="true" className="-mt-1 flex justify-between pl-[10px] pr-[26px] font-mono text-[11.5px] font-medium text-muted">
        {[0, 20, 40, 60, 80, 100].map((t) => (
          <span key={t} className="flex w-0 justify-center">
            {t}
          </span>
        ))}
      </div>

      {/*
        Fine control under each handle. Dragging to exactly 35% on a phone is
        fiddly, so each end also steps in fives — snapping to the nearest five
        first, so 23% goes to 25% rather than 28%.
      */}
      <div className="mt-1 flex items-center justify-between gap-3">
        <Stepper
          label="current charge"
          onDown={() => setFrom(Math.max(0, stepDown(from)))}
          onUp={() => setFrom(stepUp(from))}
          canDown={from > 0}
          canUp={from < to - 1}
        />
        <span className="text-center text-xs text-muted sm:text-[13px]">Drag the handles, or tap − and +</span>
        <Stepper
          label="target charge"
          onDown={() => setTo(stepDown(to))}
          onUp={() => setTo(Math.min(100, stepUp(to)))}
          canDown={to > from + 1}
          canUp={to < 100}
        />
      </div>

      {/* Common charges, one tap each. */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const on = preset.from === from && preset.to === to
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.from, preset.to)}
              aria-pressed={on}
              className={chipClass(on, 'h-11 focus-visible:shadow-focus focus-visible:outline-none')}
            >
              {preset.label}
              <span className={cn('font-mono text-[12.5px] tabular-nums', on ? 'text-volt' : 'text-muted')}>
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
    'grid size-11 place-items-center rounded-full border-[1.5px] border-ink/10 bg-white text-ink transition-[background-color,color,border-color,transform] duration-300 ease-spring hover:border-ink hover:bg-ink hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-35 focus-visible:shadow-focus focus-visible:outline-none'
  return (
    <div className="flex shrink-0 gap-1.5">
      <button type="button" onClick={onDown} disabled={!canDown} aria-label={`Lower ${label} by 5%`} className={button}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <button type="button" onClick={onUp} disabled={!canUp} aria-label={`Raise ${label} by 5%`} className={button}>
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  )
}

function Readout({ label, value, align }: { label: string; value: number; align?: 'right' }) {
  return (
    <div className={cn('grid gap-1.5', align === 'right' && 'justify-items-end')}>
      <span className="font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.16em] text-muted">{label}</span>
      <span className="font-mono text-[clamp(40px,4.4vw,58px)] font-semibold leading-[0.9] tracking-[-0.03em] tabular-nums text-ink">
        {value}
        <span className="ml-0.5 text-[0.45em] font-medium tracking-normal text-muted">%</span>
      </span>
    </div>
  )
}
