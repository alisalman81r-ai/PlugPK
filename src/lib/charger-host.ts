// src/lib/charger-host.ts

/**
 * The rules of running a listing as a host: what state a charger is in, what
 * a payout account needs, and which booking slots exist on a given day.
 *
 * Plain synchronous code, shared by the portal, the station page, the server
 * actions and the booking panel, so the slot a driver is offered is the slot
 * the server will accept.
 *
 * Times are Pakistan time throughout. A booking is a calendar date and a
 * wall-clock start (YYYY-MM-DD, HH:MM) because that is what a host and a
 * driver both mean by "Tuesday at 6"; Pakistan has no daylight saving, so the
 * pair is unambiguous.
 */

import { estimateCharge } from './charging-time'

// ─── Charger condition ──────────────────────────────────

export type ChargerCondition = 'working' | 'maintenance' | 'not-working'

export const CHARGER_CONDITIONS: ChargerCondition[] = ['working', 'maintenance', 'not-working']

export const CONDITION_LABEL: Record<ChargerCondition, string> = {
  working: 'Working',
  maintenance: 'Under maintenance',
  'not-working': 'Not working',
}

/** Short form for buttons. */
export const CONDITION_SHORT: Record<ChargerCondition, string> = {
  working: 'Working',
  maintenance: 'Maintenance',
  'not-working': 'Not working',
}

// ─── Payout accounts ────────────────────────────────────

export type PayoutMethod = 'bank' | 'jazzcash' | 'easypaisa'
export const PAYOUT_METHODS: PayoutMethod[] = ['bank', 'jazzcash', 'easypaisa']
export const PAYOUT_METHOD_LABEL: Record<PayoutMethod, string> = {
  bank: 'Bank account',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
}
export const MAX_PAYOUT_ACCOUNTS = 3

/** What a driver sees of a payout account. No bytes; the QR has its own URL. */
export interface PayoutAccountView {
  id: string
  method: PayoutMethod
  provider: string | null
  accountTitle: string
  accountNumber: string
  iban: string | null
  hasQr: boolean
}

// ─── Pricing and slots ──────────────────────────────────

/**
 * How often a booking may start. A booking's length is not chosen by the host
 * any more — it is however long the driver's car needs on that charger — so
 * the host only sets how finely start times are offered.
 * (`HostSettings.slotMinutes` holds this; the column kept its name.)
 */
export const START_STEPS = [15, 30, 60] as const
export const MAX_PRICE_PER_KWH = 500
export const MAX_BOOKING_FEE = 20000
/** How far ahead a driver can book. */
export const BOOKING_DAYS_AHEAD = 14

export interface HostSettingsView {
  pricePerKwh: number | null
  bookingEnabled: boolean
  bookingFee: number
  slotMinutes: number
  openTime: string
  closeTime: string
}

export const DEFAULT_HOST_SETTINGS: HostSettingsView = {
  pricePerKwh: null,
  bookingEnabled: false,
  bookingFee: 0,
  slotMinutes: 60,
  openTime: '09:00',
  closeTime: '21:00',
}

export function isClockTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
export const toClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** The start step in force, falling back for rows saved under the old slot lengths. */
export function startStep(settings: Pick<HostSettingsView, 'slotMinutes'>): number {
  return (START_STEPS as readonly number[]).includes(settings.slotMinutes) ? settings.slotMinutes : 30
}

/** Every time a booking may start, opening onwards. */
export function startTimes(settings: Pick<HostSettingsView, 'openTime' | 'closeTime' | 'slotMinutes'>): string[] {
  const open = toMinutes(settings.openTime)
  const close = toMinutes(settings.closeTime)
  const step = startStep(settings)
  const times: string[] = []
  for (let start = open; start < close; start += step) times.push(toClock(start))
  return times
}

// ─── How long a booking holds a charger ─────────────────

/** Plugging in, paying and moving the car off, on top of the charge itself. */
export const HANDOVER_MINUTES = 10
/** Bookings are held in whole quarter hours, so a timetable stays readable. */
export const BOOKING_GRANULARITY = 15
export const MIN_BOOKING_MINUTES = 15
/** Longer than any one sitting a host should be asked to hold a charger for. */
export const MAX_BOOKING_MINUTES = 8 * 60

/** The time a charge reserves: the charge, the handover, rounded up to 15 minutes. */
export function bookingMinutes(chargeMinutes: number): number {
  const raw = Math.ceil((chargeMinutes + HANDOVER_MINUTES) / BOOKING_GRANULARITY) * BOOKING_GRANULARITY
  return Math.max(MIN_BOOKING_MINUTES, raw)
}

/** AC or DC, from the plug: these three are DC fast-charging standards. */
export function chargeModeFor(connectorType: string): 'ac' | 'dc' {
  return ['CCS2', 'CHAdeMO', 'GBT'].includes(connectorType) ? 'dc' : 'ac'
}

/**
 * The most cars charging at once anywhere inside [start, end), given the
 * bookings already holding this charger. Intervals are minutes past
 * midnight, end-exclusive: a booking ending at 6:00 and one starting at 6:00
 * do not overlap.
 */
export function peakOverlap(held: { start: number; end: number }[], start: number, end: number): number {
  const events: [number, number][] = []
  for (const booking of held) {
    if (booking.end <= start || booking.start >= end) continue
    events.push([Math.max(booking.start, start), 1], [Math.min(booking.end, end), -1])
  }
  // Ends before starts at the same minute, so back-to-back is never a clash.
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  let current = 0
  let peak = 0
  for (const [, change] of events) {
    current += change
    peak = Math.max(peak, current)
  }
  return peak
}

/** Now in Pakistan, as a date key and minutes past midnight. */
export function karachiNow(now = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

/** The dates a driver can book, today first. */
export function bookableDates(now = new Date()): string[] {
  const today = karachiNow(now).date
  const base = Date.parse(`${today}T00:00:00Z`)
  return Array.from({ length: BOOKING_DAYS_AHEAD }, (_, day) =>
    new Date(base + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  )
}

/** A slot that has already started can no longer be booked. */
export function slotHasStarted(date: string, start: string, now = new Date()): boolean {
  const current = karachiNow(now)
  if (date < current.date) return true
  if (date > current.date) return false
  return toMinutes(start) <= current.minutes
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}

/** "6:00 pm" from "18:00". */
export function formatClock(time: string): string {
  const minutes = toMinutes(time)
  const hour = Math.floor(minutes / 60)
  const suffix = hour >= 12 ? 'pm' : 'am'
  return `${((hour + 11) % 12) + 1}:${String(minutes % 60).padStart(2, '0')} ${suffix}`
}

// ─── Bookings ───────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'

/** Statuses that hold a slot. */
export const HOLDING_STATUSES: BookingStatus[] = ['pending', 'confirmed']

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Awaiting host',
  confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

/** "45 min", "1 h 30 min". */
export function formatSpan(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** What the booking panel needs to know about a car to time a charge. */
export interface BookingCar {
  slug: string
  name: string
  batteryKwh: number
  acKw: number | null
  dcKw: number | null
}

export type ChargePlan =
  | { ok: true; chargeMinutes: number; minutes: number; energyKwh: number; gridKwh: number; powerKw: number; mode: 'ac' | 'dc' }
  | { ok: false; message: string }

/**
 * How long this car needs on this charger to go from one level to another,
 * and therefore how long the booking holds it. The booking panel shows this
 * and the server recomputes it from the same inputs — the duration a driver
 * books is never a number the browser chose.
 */
export function planCharge(input: {
  batteryKwh: number | null
  acKw: number | null
  dcKw: number | null
  connectorType: string
  chargerKw: number
  fromPct: number
  toPct: number
}): ChargePlan {
  if (!Number.isInteger(input.fromPct) || !Number.isInteger(input.toPct)) {
    return { ok: false, message: 'Choose your current and target charge.' }
  }
  if (input.fromPct < 0 || input.toPct > 100 || input.toPct <= input.fromPct) {
    return { ok: false, message: 'Your target charge must be above your current charge.' }
  }
  const mode = chargeModeFor(input.connectorType)
  const estimate = estimateCharge({
    batteryKwh: input.batteryKwh,
    fromPct: input.fromPct,
    toPct: input.toPct,
    mode,
    chargerKw: input.chargerKw,
    carLimitKw: mode === 'ac' ? input.acKw : input.dcKw,
    ratePerKwh: null,
  })
  if (!estimate.ok) return { ok: false, message: estimate.message }
  const minutes = bookingMinutes(estimate.minutes)
  if (minutes > MAX_BOOKING_MINUTES) {
    return {
      ok: false,
      message: `That charge would take over ${MAX_BOOKING_MINUTES / 60} hours on this charger. Choose a lower target or a faster charger.`,
    }
  }
  return {
    ok: true,
    chargeMinutes: Math.round(estimate.minutes),
    minutes,
    energyKwh: Math.round(estimate.energyKwh * 10) / 10,
    gridKwh: Math.round(estimate.gridKwh * 10) / 10,
    powerKw: estimate.powerKw,
    mode,
  }
}

export function chargerLabel(charger: { connectorType: string; maxPowerKw: number }, index: number): string {
  return `Charger ${index + 1} · ${charger.connectorType} · ${charger.maxPowerKw} kW`
}
