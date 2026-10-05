// src/components/calculator/ChargingCalculator.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { CarPicker, type PickerCar } from '@/components/tools/CarPicker'
import { ArrowUpRight, Check, Link2 } from '@/components/ui/icons'
import { Input } from '@/components/ui'
import { MAX_CHARGER_KW, estimateCharge, rangeAddedKm, readyAt, type ChargeMode } from '@/lib/charging-time'
import { cn } from '@/lib/utils'

import { ChargeResult } from './ChargeResult'
import { ChargerComparison } from './ChargerComparison'
import { ShortOnTime } from './ShortOnTime'
import { SocBattery } from './SocBattery'
import type { CalculatorCar } from './types'

/**
 * The calculator: state, and the order things are asked in.
 *
 * All arithmetic lives in lib/charging-time; this file only holds what the
 * driver has set and hands it over. The result is recomputed on every change,
 * so there is no Calculate button and no moment where the figure on screen
 * disagrees with the controls beside it.
 *
 * ── Layout ────────────────────────────────────────────────────────────
 *
 * Four numbered steps — car, charge, charger, rate — so a first-time visitor
 * can see how many questions there are and where they are in them. On a wide
 * screen the result is a column of its own and stays in view while anything
 * on the left moves. On a phone it sits directly under step 3, the last
 * control that changes the time; the rate only changes the cost, so it can
 * wait below. Under everything, the same charge on every common charger, and
 * the reverse question — what a set time on the charger gets you.
 *
 * ── Memory ────────────────────────────────────────────────────────────
 *
 * The settings live in the address (?car=&from=&to=&mode=&kw=&rate=), so a
 * result can be sent as a link and opens as it was. The car is also
 * remembered on this device and shared with the range converter; a link's
 * own ?car= always wins over the remembered one.
 */

const AC_PRESETS = [
  { kw: 3.7, label: 'Home socket', note: '16A' },
  { kw: 7.4, label: 'Wall box', note: '32A' },
  { kw: 11, label: 'Three-phase', note: '16A' },
  { kw: 22, label: 'Three-phase', note: '32A' },
] as const

const DC_PRESETS = [
  { kw: 30, label: 'Compact DC', note: '' },
  { kw: 60, label: 'Fast', note: '' },
  { kw: 120, label: 'Rapid', note: '' },
  { kw: 180, label: 'Ultra-rapid', note: '' },
] as const

const DEFAULT_KW: Record<ChargeMode, number> = { ac: 7.4, dc: 60 }

/** Reads a 0–100 level from the address, or null if it is not one. */
function parsePct(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= 100 ? n : null
}

/** The numbers a driver tells trims apart by, for the car picker's rows. */
function pickerMeta(c: CalculatorCar): string {
  const parts = [`${c.batteryKwh} kWh`]
  parts.push(c.acKw ? `AC ${c.acKw} kW` : 'AC not listed')
  parts.push(c.dcKw ? `DC ${c.dcKw} kW` : 'no DC listed')
  return (c.category !== 'EV' ? `${c.category} · ` : '') + parts.join(' · ')
}

/** Parses a text field without letting "", "-", "." or "abc" become a number. */
function parse(text: string): number | null {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export interface ChargingCalculatorProps {
  cars: CalculatorCar[]
}

export function ChargingCalculator({ cars }: ChargingCalculatorProps) {
  const [slug, setSlug] = React.useState('')
  const [batteryText, setBatteryText] = React.useState('')
  const [from, setFrom] = React.useState(20)
  const [to, setTo] = React.useState(80)
  const [mode, setMode] = React.useState<ChargeMode>('ac')
  const [presetKw, setPresetKw] = React.useState<number | null>(DEFAULT_KW.ac)
  const [customText, setCustomText] = React.useState('')
  const [rateText, setRateText] = React.useState('50')
  const now = useNow()

  const car = cars.find((c) => c.slug === slug) ?? null

  const pickerCars: PickerCar[] = React.useMemo(
    () =>
      cars.map((c) => ({
        slug: c.slug,
        name: c.name,
        brand: c.brand,
        meta: pickerMeta(c),
      })),
    [cars],
  )

  const chooseCar = (next: string) => {
    setSlug(next)
    const picked = cars.find((c) => c.slug === next)
    // Fills the pack size from the catalogue, and leaves it editable: a driver
    // with a different trim should not have to un-pick the car to fix it.
    if (picked) setBatteryText(String(picked.batteryKwh))
  }

  /*
    After mount only: the page is static, so the server never sees the query.
    A shared link's settings apply; otherwise no car is picked until you pick one.
  */
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    // Only a shared link picks the car. The tool used to reopen on the car
    // last chosen on this device, which read as the site deciding for you.
    const linked = cars.find((c) => c.slug === q.get('car'))
    if (linked) {
      setSlug(linked.slug)
      setBatteryText(String(linked.batteryKwh))
    } else {
      // A car we don't list, shared by its battery size.
      const qBattery = Number(q.get('battery'))
      if (q.get('battery') && Number.isFinite(qBattery) && qBattery > 0 && qBattery <= 250) setBatteryText(String(qBattery))
    }
    const qFrom = parsePct(q.get('from'))
    const qTo = parsePct(q.get('to'))
    if (qFrom != null && qTo != null && qTo > qFrom) {
      setFrom(qFrom)
      setTo(qTo)
    }
    const qMode = q.get('mode') === 'dc' ? 'dc' : q.get('mode') === 'ac' ? 'ac' : null
    if (qMode) setMode(qMode)
    const qKw = Number(q.get('kw'))
    if (q.get('kw') && Number.isFinite(qKw) && qKw > 0 && qKw <= MAX_CHARGER_KW) {
      const presetsFor = (qMode ?? 'ac') === 'ac' ? AC_PRESETS : DC_PRESETS
      if (presetsFor.some((pr) => pr.kw === qKw)) setPresetKw(qKw)
      else {
        setPresetKw(null)
        setCustomText(String(qKw))
      }
    } else if (qMode) {
      setPresetKw(DEFAULT_KW[qMode])
    }
    const qRate = q.get('rate')
    if (qRate != null && qRate.trim() !== '' && Number.isFinite(Number(qRate)) && Number(qRate) >= 0) setRateText(qRate)
    setHydrated(true)
  }, [cars])

  const [copied, setCopied] = React.useState<'idle' | 'done' | 'failed'>('idle')
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
    window.setTimeout(() => setCopied('idle'), 2500)
  }

  const chooseMode = (next: ChargeMode) => {
    if (next === mode) return
    setMode(next)
    setPresetKw(DEFAULT_KW[next])
    setCustomText('')
  }

  // Keep the address in step, without adding a history entry per change.
  React.useEffect(() => {
    if (!hydrated) return
    const q = new URLSearchParams()
    if (slug) q.set('car', slug)
    else if (batteryText.trim()) q.set('battery', batteryText.trim())
    q.set('from', String(from))
    q.set('to', String(to))
    q.set('mode', mode)
    const kw = presetKw ?? (customText.trim() ? customText.trim() : null)
    if (kw != null) q.set('kw', String(kw))
    if (rateText.trim()) q.set('rate', rateText.trim())
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${q.toString()}`)
  }, [hydrated, slug, batteryText, from, to, mode, presetKw, customText, rateText])

  const chargerKw = presetKw ?? parse(customText)
  const carLimitKw = car ? (mode === 'ac' ? car.acKw : car.dcKw) : null

  const result = estimateCharge({
    batteryKwh: parse(batteryText),
    fromPct: from,
    toPct: to,
    mode,
    chargerKw,
    carLimitKw,
    ratePerKwh: parse(rateText),
  })

  const choosePreset = (nextMode: ChargeMode, kw: number) => {
    setMode(nextMode)
    setPresetKw(kw)
    setCustomText('')
  }

  const presets = mode === 'ac' ? AC_PRESETS : DC_PRESETS
  const batteryProblem = !result.ok && result.field === 'battery' && batteryText !== ''
  const batteryKwh = parse(batteryText)

  return (
    <div className="calc-card rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(5,36,30,0.05),0_24px_60px_-32px_rgba(5,36,30,0.35)] sm:p-7 lg:p-9">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8">
        {/* ── The car, the charge, the charger ───────────────────────── */}
        <div className="min-w-0 space-y-8">
          <div>
            <StepHeading step={1} title="Your car" />
            <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
              <CarPicker
                id="calc-car"
                label="Model"
                cars={pickerCars}
                value={slug}
                onChange={chooseCar}
                placeholder="Select your EV"
                noneLabel="Not in the list — I’ll enter the battery"
              />

              <Input
                label="Battery size"
                inputMode="decimal"
                type="number"
                min={1}
                max={250}
                step={0.1}
                placeholder="e.g. 60"
                value={batteryText}
                onChange={(e) => setBatteryText(e.target.value)}
                rightIcon={<span className="text-ui-sm font-medium text-slate-400">kWh</span>}
                error={batteryProblem ? 'Enter a size above 0' : undefined}
              />
            </div>

            {/* The picker shows the car's limits; this line is where to go next. */}
            {car ? (
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ui-sm text-slate-500">
                <Link
                  href={`/cars/${car.slug}`}
                  className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
                >
                  Full specs
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                {car.category === 'EV' && car.rangeKm ? (
                  <Link
                    href={`/range-converter?car=${car.slug}`}
                    className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
                  >
                    What its range means here
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                ) : null}
              </p>
            ) : (
              <p className="mt-3 text-ui-sm text-slate-500">
                Not in the list? Skip this and enter your battery size.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-8">
            <StepHeading step={2} title="How much charge" hint="From where your battery is now to where you want it." />
            <SocBattery
              from={from}
              to={to}
              batteryKwh={batteryKwh && batteryKwh > 0 ? batteryKwh : null}
              onChange={(f, t) => {
                setFrom(f)
                setTo(t)
              }}
            />
          </div>

          <div className="border-t border-slate-100 pt-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StepHeading step={3} title="Where you're charging" />
              <Segmented value={mode} onChange={chooseMode} />
            </div>

            {/* Said before the choice rather than after it, so it helps the
                driver pick AC or DC instead of explaining what they picked. */}
            <p className="-mt-1 mb-4 text-ui-sm leading-relaxed text-slate-500">
              {mode === 'ac'
                ? 'AC is home, office, hotel and mall charging. Your car converts the power itself, so the speed holds steady.'
                : 'DC is the public fast charger. Much quicker, but the car slows the charge as the battery fills.'}
            </p>

            <div role="radiogroup" aria-label="Charger power" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((p) => {
                const on = presetKw === p.kw
                return (
                  <button
                    key={p.kw}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setPresetKw(p.kw)
                      setCustomText('')
                    }}
                    className={cn(
                      'flex min-h-[4.25rem] flex-col items-start justify-center rounded-xl border-[1.5px] px-3.5 py-2.5 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                      on
                        ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300',
                    )}
                  >
                    <span className="text-lg font-semibold leading-tight tabular-nums">{p.kw} kW</span>
                    <span className={cn('text-ui-xs', on ? 'text-white/70' : 'text-slate-500')}>
                      {p.label}
                    </span>
                    {p.note ? (
                      <span className={cn('text-ui-xs tabular-nums', on ? 'text-white/50' : 'text-slate-400')}>
                        {p.note}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 sm:max-w-[16rem]">
              <Input
                label="Or enter the charger's power"
                inputMode="decimal"
                type="number"
                min={0.1}
                max={MAX_CHARGER_KW}
                step={0.1}
                placeholder={mode === 'ac' ? 'e.g. 6.6' : 'e.g. 150'}
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value)
                  setPresetKw(null)
                }}
                rightIcon={<span className="text-ui-sm font-medium text-slate-400">kW</span>}
              />
            </div>

            <p className="mt-2 text-ui-xs leading-relaxed text-slate-500">
              Not sure? The power is usually printed on the charger or on its cable&rsquo;s control box.
            </p>
          </div>
        </div>

        {/* ── The answer ─────────────────────────────────────────────── */}
        <div className="min-w-0 lg:row-span-2 lg:self-start lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
          <ChargeResult
            result={result}
            mode={mode}
            from={from}
            to={to}
            chargerKw={chargerKw}
            carName={car?.name ?? null}
            makerDcMinutes={car?.dcQuotedMin ?? null}
            rangeAddedKm={rangeAddedKm(car?.rangeKm ?? null, from, to)}
            rangeCycle={car?.rangeCycle ?? null}
            readyText={result.ok && now ? readyAt(now, result.minutes) : null}
            waiting={batteryText.trim() === ''}
            dcUnknown={mode === 'dc' && car != null && car.dcKw == null}
          />
          {result.ok ? (
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2"
            >
              {copied === 'done' ? (
                <Check size={16} className="text-plug-cyan-700" aria-hidden="true" />
              ) : (
                <Link2 size={16} aria-hidden="true" />
              )}
              {copied === 'done'
                ? 'Link copied'
                : copied === 'failed'
                  ? 'Copy the address bar instead'
                  : 'Copy link to this result'}
            </button>
          ) : null}
        </div>

        {/* ── What it costs ──────────────────────────────────────────── */}
        <div className="min-w-0 border-t border-slate-100 pt-8 lg:border-t-0 lg:pt-0">
          <StepHeading step={4} title="Your electricity rate" hint="Only changes the cost, not the time." />
          <div className="sm:max-w-[16rem]">
            <Input
              label="Rate per unit (kWh)"
              inputMode="decimal"
              type="number"
              min={0}
              step={1}
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              leftIcon={<span className="text-ui-sm font-medium text-slate-400">Rs</span>}
              rightIcon={<span className="text-ui-sm font-medium text-slate-400">/ kWh</span>}
            />
          </div>
          <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">
            Use the per-unit rate on your bill. Public DC chargers usually bill more per unit than a home
            connection — use the rate shown at the charger.
          </p>
        </div>
      </div>

      {/*
        ── The same charge, everywhere ─────────────────────────────────

        Outside the grid on purpose. A sticky element is held inside its
        containing block, and for the result panel that is the grid: had this
        section been a grid row, the panel would have kept sliding down over
        it. Ending the grid here makes the panel stop at the rate step.
      */}
      <div className="mt-8 min-w-0 border-t border-slate-100 pt-8 lg:mt-10">
        <ChargerComparison
          batteryKwh={parse(batteryText)}
          from={from}
          to={to}
          car={car}
          ratePerKwh={parse(rateText)}
          selectedMode={presetKw != null ? mode : null}
          selectedKw={presetKw}
          onChoose={choosePreset}
        />
      </div>

      <div className="mt-8 min-w-0 border-t border-slate-100 pt-8">
        <ShortOnTime
          batteryKwh={batteryKwh && batteryKwh > 0 ? batteryKwh : null}
          fromPct={from}
          mode={mode}
          chargerKw={chargerKw}
          carLimitKw={carLimitKw}
          rangeKm={car?.rangeKm ?? null}
        />
      </div>
    </div>
  )
}

/**
 * The current time, on the client only, refreshed each minute.
 *
 * Null during the server render and the first client render, so the page
 * never hydrates with a server's clock (in a different timezone) and then
 * jumps. The "ready around" line simply appears a moment after load.
 */
function useNow(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

/** A numbered question, so the flow reads as four steps and not a form. */
function StepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2.5 text-ui font-semibold text-slate-900">
        <span
          aria-hidden="true"
          className="grid size-6 shrink-0 place-items-center rounded-full bg-plug-blue-600 text-[12px] font-bold tabular-nums text-white"
        >
          {step}
        </span>
        <span>
          <span className="sr-only">Step {step}: </span>
          {title}
        </span>
      </h2>
      {hint ? <p className="mt-1 pl-[2.125rem] text-ui-sm text-slate-500">{hint}</p> : null}
    </div>
  )
}

/** AC / DC, as one control rather than two buttons that look unrelated. */
function Segmented({ value, onChange }: { value: ChargeMode; onChange: (m: ChargeMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Charging type" className="inline-flex rounded-full bg-slate-100 p-1">
      {(['ac', 'dc'] as const).map((m) => {
        const on = value === m
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            className={cn(
              'min-h-9 rounded-full px-5 text-ui-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500',
              on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {m === 'ac' ? 'AC' : 'DC fast'}
          </button>
        )
      })}
    </div>
  )
}
