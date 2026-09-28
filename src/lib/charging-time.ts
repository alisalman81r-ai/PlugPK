// src/lib/charging-time.ts

/**
 * How long a charge takes, and what it costs.
 *
 * Pure functions, no React and no database. The calculator page renders what
 * these return and nothing else decides a number, so the arithmetic can be read
 * — and checked — in one place.
 *
 * ── AC ────────────────────────────────────────────────────────────────
 *
 * On AC the car does the converting. Its onboard charger has a ceiling, and a
 * wall box faster than that ceiling does not make the car charge faster: a
 * 7.4 kW box on a car with a 6.6 kW onboard charger runs at 6.6. So the power
 * used is the lower of the two.
 *
 * Not every kWh drawn from the wall reaches the pack. The onboard charger,
 * the cabling and the battery's own heat take roughly a tenth, which is why
 * the energy drawn is the energy stored divided by 0.90. The time is set by
 * how fast the wall can supply that larger figure.
 *
 * AC stays close to flat across the whole charge on a modern car, so the
 * result is a straight division and can be stated with some confidence.
 *
 * ── DC ────────────────────────────────────────────────────────────────
 *
 * DC is not flat, and pretending it is would be the calculator's biggest lie.
 * A car accepts close to its peak only while the pack is fairly empty, eases
 * off through the middle, and slows sharply past about 80% to protect the
 * cells. So the charge is walked in half-percent steps, each at the power the
 * pack would plausibly accept at that level.
 *
 * The shape of that curve — 90% of peak up to half full, easing to 60% by
 * 80%, falling to 15% at 100% — was not guessed. It was fitted against every
 * car in the catalogue whose maker publishes a 10–80% DC time: six cars from
 * 34 to 100 kWh and 65 to 210 kW. Across those six it lands within 6% on
 * average, with no lean either way. It is still a generic curve standing in
 * for each car's real one, which is why DC results are always labelled as
 * estimates.
 */

export type ChargeMode = 'ac' | 'dc'

/** Fraction of wall energy that reaches the battery. */
export const EFFICIENCY: Record<ChargeMode, number> = {
  ac: 0.9,
  // DC conversion happens inside the station, before the meter the driver is
  // billed on, so only the car-side losses remain.
  dc: 0.95,
}

/** The fitted DC curve: fraction of the car's peak accepted at a given SOC. */
function dcTaper(soc: number): number {
  if (soc <= 50) return 0.9
  if (soc <= 80) return 0.9 + (0.6 - 0.9) * ((soc - 50) / 30)
  return 0.6 + (0.15 - 0.6) * ((soc - 80) / 20)
}

export interface ChargeInput {
  batteryKwh: number | null
  fromPct: number
  toPct: number
  mode: ChargeMode
  /** What the charger can deliver. */
  chargerKw: number | null
  /** What the car can accept in this mode. Null when the catalogue has no figure. */
  carLimitKw: number | null
  /** Rs per kWh. Null or zero leaves cost out rather than showing Rs 0. */
  ratePerKwh: number | null
}

export type PowerLimit =
  /** The car's own limit is lower than the charger. */
  | 'car'
  /** The charger is the slower of the two. */
  | 'charger'
  /** We have no figure for the car, so the charger's power is assumed. */
  | 'car-unknown'

export interface ChargeEstimate {
  ok: true
  minutes: number
  /** Energy added to the pack. */
  energyKwh: number
  /** Energy drawn from the supply, losses included. What the meter sees. */
  gridKwh: number
  /** The power the charge actually runs at (peak, for DC). */
  powerKw: number
  limitedBy: PowerLimit
  cost: number | null
  /**
   * DC only, and only when the target is above 80%: how the time splits
   * either side of 80. Past there the curve does most of the talking, and a
   * driver in a hurry should know the last fifth can take as long as the rest.
   */
  split: { toEightyMin: number; pastEightyMin: number } | null
}

export interface ChargeProblem {
  ok: false
  field: 'battery' | 'range' | 'power'
  message: string
}

const valid = (n: number | null): n is number => n != null && Number.isFinite(n) && n > 0

/** Minutes to charge from `from` to `to` on the fitted DC curve. */
function dcMinutes(batteryKwh: number, powerKw: number, from: number, to: number): number {
  const STEP = 0.5
  let hours = 0
  for (let soc = from; soc < to; soc += STEP) {
    const width = Math.min(STEP, to - soc)
    const stored = (batteryKwh * width) / 100
    hours += stored / EFFICIENCY.dc / (powerKw * dcTaper(soc + width / 2))
  }
  return hours * 60
}

export function estimateCharge(input: ChargeInput): ChargeEstimate | ChargeProblem {
  const { batteryKwh, fromPct, toPct, mode, chargerKw, carLimitKw, ratePerKwh } = input

  if (!valid(batteryKwh)) {
    return { ok: false, field: 'battery', message: 'Enter your battery size to see a time.' }
  }
  if (!Number.isFinite(fromPct) || !Number.isFinite(toPct) || fromPct < 0 || toPct > 100) {
    return { ok: false, field: 'range', message: 'Charge levels run from 0% to 100%.' }
  }
  if (toPct <= fromPct) {
    return { ok: false, field: 'range', message: 'Set a target above your current charge.' }
  }
  if (!valid(chargerKw)) {
    return { ok: false, field: 'power', message: 'Choose a charger power above 0 kW.' }
  }

  const carKnown = valid(carLimitKw)
  const powerKw = carKnown ? Math.min(chargerKw, carLimitKw) : chargerKw
  const limitedBy: PowerLimit = !carKnown ? 'car-unknown' : carLimitKw < chargerKw ? 'car' : 'charger'

  const energyKwh = (batteryKwh * (toPct - fromPct)) / 100
  const gridKwh = energyKwh / EFFICIENCY[mode]

  let minutes: number
  let split: ChargeEstimate['split'] = null
  if (mode === 'ac') {
    minutes = (gridKwh / powerKw) * 60
  } else {
    minutes = dcMinutes(batteryKwh, powerKw, fromPct, toPct)
    if (toPct > 80 && fromPct < 80) {
      const toEightyMin = dcMinutes(batteryKwh, powerKw, fromPct, 80)
      // Rounded here, against the rounded total, so the two halves a driver
      // reads always add up to the headline figure above them.
      const total = roundMinutes(minutes)
      const first = Math.min(roundMinutes(toEightyMin), total)
      split = { toEightyMin: first, pastEightyMin: Math.max(0, total - first) }
    }
  }

  return {
    ok: true,
    minutes,
    energyKwh,
    gridKwh,
    powerKw,
    limitedBy,
    cost: valid(ratePerKwh) ? gridKwh * ratePerKwh : null,
    split,
  }
}

/**
 * A duration people can read, rounded to what the estimate can support.
 *
 * A calculator that says 5h 17m is claiming a precision no charge delivers.
 * Short charges keep the minute, a couple of hours round to five, anything
 * longer to ten.
 */
export function roundMinutes(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0
  const step = minutes < 15 ? 1 : minutes < 120 ? 5 : 10
  return Math.max(step, Math.round(minutes / step) * step)
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—'
  if (minutes < 1) return 'Under a minute'
  const rounded = roundMinutes(minutes)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatKwh(kwh: number): string {
  return `${kwh < 10 ? kwh.toFixed(1) : Math.round(kwh).toLocaleString('en-PK')} kWh`
}

export function formatKw(kw: number): string {
  return `${Number.isInteger(kw) ? kw : kw.toFixed(1)} kW`
}

export function formatRupees(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString('en-PK')}`
}

/**
 * The share of the car's rated range this charge adds, in km.
 *
 * Rated range scales with the battery, so 60% of the pack is 60% of the rated
 * figure. It is still the rated figure — a test cycle, not a motorway — and is
 * rounded to match: to 5 km under 100, to 10 above, so "+287 km" never claims
 * a precision the test itself does not have.
 */
export function rangeAddedKm(rangeKm: number | null, fromPct: number, toPct: number): number | null {
  if (!valid(rangeKm) || !Number.isFinite(fromPct) || !Number.isFinite(toPct) || toPct <= fromPct) return null
  const km = (rangeKm * (toPct - fromPct)) / 100
  const step = km < 100 ? 5 : 10
  return Math.max(step, Math.round(km / step) * step)
}

/**
 * When a charge started at `start` finishes, as a wall-clock time.
 *
 * Uses the rounded duration, so it agrees with the headline figure. Adds
 * "tomorrow" when the charge runs past midnight — an overnight charge ending
 * at 6:10 am should not read as this morning.
 */
export function readyAt(start: Date, minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const end = new Date(start.getTime() + roundMinutes(minutes) * 60_000)
  const time = end.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })
  const days = Math.round(
    (new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
      new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
      86_400_000,
  )
  if (days <= 0) return time
  if (days === 1) return `${time} tomorrow`
  return `${time}, in ${days} days`
}
