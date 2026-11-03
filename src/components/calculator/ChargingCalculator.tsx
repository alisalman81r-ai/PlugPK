// src/components/calculator/ChargingCalculator.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { CarPicker, type PickerCar } from '@/components/tools/CarPicker'
import { useIsoLayoutEffect } from '@/components/tools/motion'
import { useMyCar } from '@/hooks/useMyCar'
import { ArrowUpRight, Check, Link2 } from '@/components/ui/icons'
import { ToolField } from '@/components/tools/ToolField'
import { Lift, SEG, btnClass, segButtonClass } from '@/components/v2/ui'
import { MAX_CHARGER_KW, estimateCharge, rangeAddedKm, readyAt, type ChargeMode } from '@/lib/charging-time'
import { gsap, prefersReduced } from '@/lib/gsap'
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

  /* A car picked by hand flashes the battery field it just filled (pickCar). */
  const batteryRef = React.useRef<HTMLInputElement>(null)
  const pickByHand = (next: string) => {
    chooseCar(next)
    const input = batteryRef.current
    if (next && input && !prefersReduced()) {
      gsap.fromTo(input, { backgroundColor: '#F1FFD0' }, { backgroundColor: '#fff', duration: 1.2, ease: 'power2.out' })
    }
  }

  /* While a charge preset glides into place, the card shows the levels it passes. */
  const [preview, setPreview] = React.useState<{ from: number; to: number } | null>(null)

  /* AC ↔ DC deals the new chargers in (renderTiles(animate)); loading a link does not. */
  const tilesRef = React.useRef<HTMLDivElement>(null)
  const dealTiles = React.useRef(false)
  useIsoLayoutEffect(() => {
    if (!dealTiles.current) return
    dealTiles.current = false
    if (tilesRef.current && !prefersReduced()) {
      gsap.from(tilesRef.current.children, { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(1.6)' })
    }
  }, [mode])

  /*
    After mount only: the page is static, so the server never sees the query.
    A shared link's settings apply; otherwise no car is picked until you pick one.
  */
  const [hydrated, setHydrated] = React.useState(false)
  /** The link named a car or a battery size of its own, which the driver's car must not override. */
  const linkChose = React.useRef(false)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    linkChose.current = q.has('car') || q.has('battery')
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

  /*
    The driver's own car, from their garage: picked once, after the link has
    been read, and only when the link chose nothing and the driver has not
    picked anything yet. This is the car they told us they drive — not the
    last one tried on this device, which the note above rightly removed.
  */
  const myCar = useMyCar()
  const appliedMyCar = React.useRef(false)
  React.useEffect(() => {
    if (!hydrated || myCar === undefined || appliedMyCar.current) return
    appliedMyCar.current = true
    if (linkChose.current || slug || !myCar) return
    if (cars.some((c) => c.slug === myCar.slug)) chooseCar(myCar.slug)
    // chooseCar is recreated each render; this runs once by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, myCar, cars, slug])

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
    dealTiles.current = true
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
    if (nextMode !== mode) dealTiles.current = true
    setMode(nextMode)
    setPresetKw(kw)
    setCustomText('')
  }

  const presets = mode === 'ac' ? AC_PRESETS : DC_PRESETS
  const batteryProblem = !result.ok && result.field === 'battery' && batteryText !== ''
  const batteryKwh = parse(batteryText)

  const linkClass =
    'inline-flex min-h-8 items-center gap-1 font-semibold text-ink underline decoration-volt-ink/40 underline-offset-[3px] transition-colors hover:decoration-ink'

  return (
    <Lift className="overflow-visible">
      <div className="grid gap-x-[clamp(32px,4vw,64px)] px-4 pb-7 pt-[22px] sm:p-[clamp(28px,3.4vw,48px)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,410px)]">
        {/* ── The car, the charge, the charger ───────────────────────── */}
        <div className="min-w-0 lg:col-start-1">
          <Step first>
            <StepHeading step={1} title="Your car" />
            <div className="grid items-start gap-3.5 sm:grid-cols-[minmax(0,1fr)_150px] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_190px]">
              <CarPicker
                ownCar={myCar}
                id="calc-car"
                label="Model"
                cars={pickerCars}
                value={slug}
                onChange={pickByHand}
                placeholder="Select your EV"
                noneLabel="Not in the list — I’ll enter the battery"
              />

              <ToolField
                ref={batteryRef}
                label="Battery size"
                inputMode="decimal"
                type="number"
                min={1}
                max={250}
                step={0.1}
                placeholder="e.g. 60"
                value={batteryText}
                onChange={(e) => setBatteryText(e.target.value)}
                unit="kWh"
                error={batteryProblem ? 'Enter a size above 0' : undefined}
              />
            </div>

            {/* The picker shows the car's limits; this line is where to go next. */}
            {car ? (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
                <Link href={`/cars/${car.slug}`} className={linkClass}>
                  Full specs
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                {car.category === 'EV' && car.rangeKm ? (
                  <Link href={`/range-converter?car=${car.slug}`} className={linkClass}>
                    What its range means here
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                ) : null}
              </p>
            ) : (
              <p className="text-[13px] text-muted">Not in the list? Skip this and enter your battery size.</p>
            )}
          </Step>

          <Step>
            <StepHeading step={2} title="How much charge" hint="From where your battery is now to where you want it." />
            <SocBattery
              from={from}
              to={to}
              batteryKwh={batteryKwh && batteryKwh > 0 ? batteryKwh : null}
              onChange={(f, t) => {
                setFrom(f)
                setTo(t)
              }}
              onPreview={setPreview}
            />
          </Step>

          <Step>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <StepHeading step={3} title="Where you're charging" />
              <Segmented value={mode} onChange={chooseMode} />
            </div>

            {/* Said before the choice rather than after it, so it helps the
                driver pick AC or DC instead of explaining what they picked. */}
            <p className="-mt-1 max-w-[40rem] text-[14.5px] leading-[1.55] text-muted sm:ml-11">
              {mode === 'ac'
                ? 'AC is home, office, hotel and mall charging. Your car converts the power itself, so the speed holds steady.'
                : 'DC is the public fast charger. Much quicker, but the car slows the charge as the battery fills.'}
            </p>

            <div
              ref={tilesRef}
              role="radiogroup"
              aria-label="Charger power"
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
            >
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
                      // .tile: colours over .3s, the lift over .4s on the out-curve
                      'relative grid min-h-[84px] content-start justify-items-start gap-0.5 rounded-[18px] border-[1.5px] px-4 py-3.5 text-left [transition:background-color_.3s,border-color_.3s,color_.3s,translate_.4s_cubic-bezier(.16,1,.3,1),box-shadow_.4s] xl:min-h-[96px] hover:shadow-e1 hover:[translate:0_-3px]',
                      'focus-visible:shadow-focus focus-visible:outline-none',
                      on
                        ? 'border-ink bg-ink text-white'
                        : 'border-ink/10 bg-white text-ink hover:border-ink/25',
                    )}
                  >
                    {on ? (
                      <span
                        aria-hidden="true"
                        className="absolute right-3.5 top-3.5 size-2 rounded-full bg-volt shadow-[0_0_10px_rgba(212,255,58,.8)]"
                      />
                    ) : null}
                    <b className={cn('font-mono text-xl font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums', on && 'text-volt')}>
                      {p.kw}
                      <small className="ml-[3px] text-[13px] font-medium">kW</small>
                    </b>
                    <span className="text-[13.5px] font-medium">{p.label}</span>
                    {p.note ? (
                      <em className={cn('font-mono text-xs font-medium not-italic', on ? 'text-fog' : 'text-muted')}>{p.note}</em>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <ToolField
              className="mt-1.5 w-full sm:w-[260px]"
              plainLabel
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
              unit="kW"
            />

            <p className="text-[13px] leading-[1.5] text-muted">
              Not sure? The power is usually printed on the charger or on its cable&rsquo;s control box.
            </p>
          </Step>
        </div>

        {/* ── The answer ─────────────────────────────────────────────── */}
        <aside
          aria-label="Your result"
          className="mb-[26px] mt-1 min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:mt-0 lg:self-start"
        >
          <ChargeResult
            result={result}
            mode={mode}
            from={preview?.from ?? from}
            to={preview?.to ?? to}
            chargerKw={chargerKw}
            carName={car?.name ?? null}
            makerDcMinutes={car?.dcQuotedMin ?? null}
            makerDcFromPct={car?.dcQuotedFromPct ?? 10}
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
              className={btnClass('ghost', 'sm', 'mt-3 w-full sm:w-auto [&_svg]:h-4 [&_svg]:w-4')}
            >
              {copied === 'done' ? (
                <Check size={16} className="text-volt-ink" aria-hidden="true" />
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
        </aside>

        {/* ── What it costs ──────────────────────────────────────────── */}
        <div className="min-w-0 lg:col-start-1">
          <Step last>
            <StepHeading step={4} title="Your electricity rate" hint="Only changes the cost, not the time." />
            <ToolField
              className="mt-1.5 w-full sm:w-[260px]"
              plainLabel
              label="Rate per unit (kWh)"
              inputMode="decimal"
              type="number"
              min={0}
              step={1}
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              prefix="Rs"
              unit="/ kWh"
            />
            <p className="max-w-[40rem] text-[13px] leading-[1.5] text-muted">
              Use the per-unit rate on your bill. Public DC chargers usually bill more per unit than a home connection —
              use the rate shown at the charger.
            </p>
          </Step>
        </div>

        {/*
          ── The same charge, everywhere ─────────────────────────────────

          A row of its own under both columns. A sticky element is held inside
          its containing block — here the result's grid area, rows 1–2 — so the
          result card stops at the rate step rather than sliding over these.
        */}
        <div className="col-span-full mt-7 grid gap-[clamp(32px,3vw,40px)] border-t border-ink/10 pt-9 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
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
    </Lift>
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

/** One numbered step (.cstep): a hairline above every step but the first. */
function Step({ children, first, last }: { children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <div
      className={cn(
        'grid gap-3.5',
        first ? 'pb-[26px] sm:pb-[30px]' : 'border-t border-ink/10 py-[26px] sm:py-[30px]',
        last && 'pb-2 sm:pb-2',
      )}
    >
      {children}
    </div>
  )
}

/** A numbered question, so the flow reads as four steps and not a form. */
function StepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <h2 className="m-0 flex items-center gap-3 font-display text-[21px] leading-[1.1] text-ink sm:text-2xl">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-semibold text-volt [-webkit-text-stroke:0]"
        >
          {step}
        </span>
        <span>
          <span className="sr-only">Step {step}: </span>
          {title}
        </span>
      </h2>
      {hint ? <p className="max-w-[40rem] text-[14.5px] leading-[1.55] text-muted sm:ml-11">{hint}</p> : null}
    </div>
  )
}

/** AC / DC, as one control rather than two buttons that look unrelated. */
function Segmented({ value, onChange }: { value: ChargeMode; onChange: (m: ChargeMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Charging type" className={SEG}>
      {(['ac', 'dc'] as const).map((m) => {
        const on = value === m
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            className={segButtonClass(on, 'min-h-11 min-w-[76px] content-center focus-visible:shadow-focus focus-visible:outline-none')}
          >
            {m === 'ac' ? 'AC' : 'DC fast'}
          </button>
        )
      })}
    </div>
  )
}
