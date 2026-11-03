// src/components/calculator/SocBattery.tsx
'use client'

import * as React from 'react'

import { useIsoLayoutEffect } from '@/components/tools/motion'
import { chipClass } from '@/components/v2/ui'
import { Minus, Plus, Zap } from '@/components/ui/icons'
import { gsap, prefersReduced } from '@/lib/gsap'
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
 * ── How it works (landing-v2 page-charging-calculator.js, ported) ──────
 *
 * The two handles are ARIA sliders: arrows step one percent, Page Up / Down
 * ten, Home and End go to the ends. A press anywhere on the battery grabs the
 * handle you pressed, or the one nearest the press, and drags it — so a tap
 * moves the closer edge straight there. The handles cannot cross: the current
 * level stops one percent short of the target and the target one past the
 * current, so the calculator never receives a charge that runs backwards.
 *
 * The fills and handles read --now and --to off the battery, written here
 * rather than rendered, so on load the battery breathes in from empty (1.6s
 * expo.out after 0.7s) while the handles pop in, and a preset glides there
 * (0.7s expo.out) before the result updates.
 */

export interface SocBatteryProps {
  from: number
  to: number
  onChange: (from: number, to: number) => void
  /** Pack size, for the kWh figure on the added segment. Omitted if unknown. */
  batteryKwh: number | null
  /** The levels on screen while a preset glides there; null when it lands. */
  onPreview?: (view: { from: number; to: number } | null) => void
}

const PRESETS = [
  { label: 'Daily top-up', from: 20, to: 80 },
  { label: 'Before a long drive', from: 20, to: 100 },
  { label: 'Quick stop', from: 10, to: 80 },
] as const

/** The pointer maths' inset from the shell's edge (the design's pctAt pad). */
const PAD = 7

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

type Key = 'now' | 'to'

export function SocBattery({ from, to, onChange, batteryKwh, onPreview }: SocBatteryProps) {
  // Where a preset is on its way to; null when the battery shows the real levels.
  const [view, setView] = React.useState<{ from: number; to: number } | null>(null)
  const [drag, setDrag] = React.useState<Key | null>(null)
  const f = view?.from ?? from
  const t = view?.to ?? to

  const battRef = React.useRef<HTMLDivElement>(null)
  const shellRef = React.useRef<HTMLDivElement>(null)
  const nowRef = React.useRef<HTMLDivElement>(null)
  const toRef = React.useRef<HTMLDivElement>(null)

  const latest = React.useRef({ from, to })
  latest.current = { from, to }
  const shown = React.useRef({ f, t })
  shown.current = { f, t }

  const intro = React.useRef<gsap.core.Tween | null>(null)
  const introRunning = React.useRef(false)
  const preset = React.useRef<gsap.core.Tween | null>(null)
  const dragKey = React.useRef<Key | null>(null)

  /* paintBattery: the CSS the fills and handles read */
  const paint = React.useCallback(() => {
    const batt = battRef.current
    if (!batt || introRunning.current) return
    batt.style.setProperty('--now', String(shown.current.f))
    batt.style.setProperty('--to', String(shown.current.t))
  }, [])

  useIsoLayoutEffect(paint, [f, t, paint])

  /* the battery breathes in once on load */
  useIsoLayoutEffect(() => {
    const batt = battRef.current
    if (!batt || prefersReduced()) return
    const ctx = gsap.context(() => {
      const o = { p: 0 }
      const done = () => {
        introRunning.current = false
        paint()
      }
      introRunning.current = true
      // From empty to the levels on screen, which the address may set a moment after mount.
      intro.current = gsap.to(o, {
        p: 1,
        duration: 1.6,
        delay: 0.7,
        ease: 'expo.out',
        onUpdate: () => {
          const now = shown.current.f * o.p
          batt.style.setProperty('--now', String(now))
          batt.style.setProperty('--to', String(Math.max(now + 0.5, shown.current.t * o.p)))
        },
        onComplete: done,
        onInterrupt: done,
      })
      batt.style.setProperty('--now', '0')
      batt.style.setProperty('--to', '0.5')
      gsap.from('[data-batt-h]', { scale: 0, duration: 0.6, delay: 1.2, stagger: 0.08, ease: 'back.out(2)', clearProps: 'scale' })
    }, battRef)
    return () => {
      ctx.revert()
      introRunning.current = false
    }
  }, [paint])

  React.useEffect(() => () => void preset.current?.kill(), [])

  /** Any hand on the battery ends the intro and a preset's glide where they are. */
  const takeOver = () => {
    if (introRunning.current) {
      intro.current?.kill()
      introRunning.current = false
      paint()
    }
    if (preset.current) {
      preset.current.kill()
      preset.current = null
      setView(null)
      onPreview?.(null)
    }
  }

  const setSoc = (key: Key, v: number) => {
    takeOver()
    v = Math.round(v)
    const { from: a, to: z } = latest.current
    if (key === 'now') onChange(clamp(v, 0, z - 1), z)
    else onChange(a, clamp(v, a + 1, 100))
  }

  // pointer: grab the handle you pressed, or the nearest one to where you tapped
  const pctAt = (x: number) => {
    const r = shellRef.current!.getBoundingClientRect()
    return ((x - r.left - PAD) / (r.width - PAD * 2)) * 100
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pctAt(e.clientX)
    const target = e.target as HTMLElement
    const { from: a, to: z } = latest.current
    const key: Key = nowRef.current?.contains(target)
      ? 'now'
      : toRef.current?.contains(target)
        ? 'to'
        : Math.abs(p - a) < Math.abs(p - z) || p < a
          ? 'now'
          : 'to'
    dragKey.current = key
    setDrag(key)
    ;(key === 'now' ? nowRef : toRef).current?.focus({ preventScroll: true })
    e.currentTarget.setPointerCapture(e.pointerId)
    setSoc(key, p)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragKey.current) setSoc(dragKey.current, pctAt(e.clientX))
  }
  const endDrag = () => {
    if (!dragKey.current) return
    dragKey.current = null
    setDrag(null)
  }

  // keyboard (ARIA slider)
  const onKey = (key: Key) => (e: React.KeyboardEvent) => {
    const cur = key === 'now' ? latest.current.from : latest.current.to
    const step = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 } as Record<string, number>)[e.key]
    if (step) setSoc(key, cur + step)
    else if (e.key === 'Home') setSoc(key, 0)
    else if (e.key === 'End') setSoc(key, 100)
    else return
    e.preventDefault()
  }

  const runPreset = (a: number, z: number) => {
    takeOver()
    if (prefersReduced()) {
      onChange(a, z)
      return
    }
    const o = { now: from, to }
    preset.current = gsap.to(o, {
      now: a,
      to: z,
      duration: 0.7,
      ease: 'expo.out',
      onUpdate: () => {
        const n = Math.round(o.now)
        const next = { from: n, to: Math.max(n + 1, Math.round(o.to)) }
        setView(next)
        onPreview?.(next)
      },
      onComplete: () => {
        preset.current = null
        setView(null)
        onPreview?.(null)
        onChange(a, z)
      },
    })
  }

  const stepFrom = (value: number) => {
    takeOver()
    onChange(Math.min(value, to - 1), to)
  }
  const stepTo = (value: number) => {
    takeOver()
    onChange(from, Math.max(value, from + 1))
  }

  const added = t - f
  const addedKwh = batteryKwh ? (batteryKwh * added) / 100 : null

  return (
    <div className="mt-1.5 grid gap-3.5">
      {/* The two figures, over the handles they belong to. */}
      <div className="flex items-end justify-between gap-3">
        <Readout label="Now" value={f} />
        <span className="mb-[-6px] inline-flex h-8 items-center gap-1.5 self-center whitespace-nowrap rounded-full bg-ink px-3.5 font-mono text-sm font-semibold tabular-nums text-volt">
          +{added}%
          {addedKwh ? (
            <span className="font-medium text-white/60">
              · {addedKwh < 10 ? addedKwh.toFixed(1) : Math.round(addedKwh)} kWh
            </span>
          ) : null}
        </span>
        <Readout label="Target" value={t} align="right" />
      </div>

      <div
        ref={battRef}
        className={cn(
          styles.batt,
          '[--bh:96px] sm:[--bh:120px] lg:[--bh:132px]',
          f <= 15 && styles.low,
          f > 15 && f < 40 && styles.mid,
          t - f < 14 && styles.narrow,
        )}
      >
        <div
          ref={shellRef}
          className={styles.shell}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className={styles.inner} aria-hidden="true">
            {/* Already in the pack. */}
            <div className={styles.have} />
            {/* What this charge adds. */}
            <div className={styles.add}>
              <span className={styles.waves}>
                <svg className={cn(styles.wave, styles.waveA)} viewBox="0 0 240 120" preserveAspectRatio="none">
                  <path d="M0 52 Q30 40 60 52 T120 52 T180 52 T240 52 V120 H0Z" />
                </svg>
                <svg className={cn(styles.wave, styles.waveB)} viewBox="0 0 240 120" preserveAspectRatio="none">
                  <path d="M0 66 Q30 78 60 66 T120 66 T180 66 T240 66 V120 H0Z" />
                </svg>
              </span>
              {t < 100 ? (
                <span className={styles.edge}>
                  <svg viewBox="0 0 12 120" preserveAspectRatio="none">
                    <path d="M0 0H6Q12 7.5 6 15T6 30T6 45T6 60T6 75T6 90T6 105T6 120H0Z" />
                  </svg>
                </span>
              ) : null}
              <span className={styles.bolt}>
                <Zap size={18} fill="currentColor" aria-hidden="true" />
              </span>
            </div>
            {/* Tenths, so a level can be read without the ticks. */}
            <div className={styles.cells} />
          </div>

          <div
            ref={nowRef}
            data-batt-h=""
            role="slider"
            tabIndex={0}
            aria-label="Current charge"
            aria-valuemin={0}
            aria-valuemax={t - 1}
            aria-valuenow={f}
            aria-valuetext={`${f} percent`}
            onKeyDown={onKey('now')}
            className={cn(styles.h, styles.hNow, drag === 'now' && styles.drag)}
          >
            <i />
          </div>
          <div
            ref={toRef}
            data-batt-h=""
            role="slider"
            tabIndex={0}
            aria-label="Target charge"
            aria-valuemin={f + 1}
            aria-valuemax={100}
            aria-valuenow={t}
            aria-valuetext={`${t} percent`}
            onKeyDown={onKey('to')}
            className={cn(styles.h, styles.hTo, drag === 'to' && styles.drag)}
          >
            <i />
          </div>
        </div>

        {/* The terminal nub, so the shape reads as a battery at a glance. */}
        <span aria-hidden="true" className={styles.nub} />
      </div>

      <div aria-hidden="true" className="-mt-1 flex justify-between pl-[10px] pr-[26px] font-mono text-[11.5px] font-medium text-muted">
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <span key={tick} className="flex w-0 justify-center">
            {tick}
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
          onDown={() => stepFrom(Math.max(0, stepDown(from)))}
          onUp={() => stepFrom(stepUp(from))}
          canDown={from > 0}
          canUp={from < to - 1}
        />
        <span className="text-center text-xs text-muted sm:text-[13px]">Drag the handles, or tap − and +</span>
        <Stepper
          label="target charge"
          onDown={() => stepTo(stepDown(to))}
          onUp={() => stepTo(Math.min(100, stepUp(to)))}
          canDown={to > from + 1}
          canUp={to < 100}
        />
      </div>

      {/* Common charges, one tap each. */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const on = p.from === f && p.to === t
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => runPreset(p.from, p.to)}
              aria-pressed={on}
              className={chipClass(on, 'h-11 focus-visible:shadow-focus focus-visible:outline-none')}
            >
              {p.label}
              <span className={cn('font-mono text-[12.5px] tabular-nums', on ? 'text-volt' : 'text-muted')}>
                {p.from}→{p.to}
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
  // .pm: colours over .25s, the press springs over .3s
  const button =
    'grid size-11 place-items-center rounded-full border-[1.5px] border-ink/10 bg-white text-ink [transition:background-color_.25s,color_.25s,border-color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)] hover:border-ink hover:bg-ink hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-35 focus-visible:shadow-focus focus-visible:outline-none'
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
