// src/lib/service-hours.ts
import type { DayHours, OperatingHours } from '@/lib/types'

/**
 * Opening hours as a form sends them, for the service application and the
 * admin's service editor (both render HoursFields).
 *
 * Three answers: not stated (stored as "{}", which every page already shows
 * as "Not listed"), open 24 hours, or a time per day. Field names:
 * `hoursMode` = unknown | 24h | set, then `<day>Open`, `<day>Close` and
 * `<day>Closed` ("on") for each day.
 */

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type WeekDay = (typeof WEEK_DAYS)[number]

export const WEEK_DAY_LABEL: Record<WeekDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export type HoursMode = 'unknown' | '24h' | 'set'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Which mode stored hours are in, for a form's starting state. */
export function hoursMode(hours: Partial<OperatingHours> | undefined): HoursMode {
  if (!hours || typeof hours !== 'object') return 'unknown'
  if (hours.is24Hours) return '24h'
  return WEEK_DAYS.some((day) => hours[day]) ? 'set' : 'unknown'
}

export type HoursResult = { ok: true; value: string } | { ok: false; message: string }

/** The form's answer as the JSON the operatingHours column stores. */
export function parseHoursForm(form: FormData): HoursResult {
  const mode = String(form.get('hoursMode') ?? 'unknown')
  if (mode === '24h') {
    const all: DayHours = { open: '00:00', close: '23:59', isClosed: false }
    return { ok: true, value: JSON.stringify({ is24Hours: true, ...Object.fromEntries(WEEK_DAYS.map((day) => [day, all])) }) }
  }
  if (mode !== 'set') return { ok: true, value: '{}' }

  const hours: Record<string, unknown> = { is24Hours: false }
  for (const day of WEEK_DAYS) {
    const isClosed = form.get(`${day}Closed`) === 'on'
    const open = String(form.get(`${day}Open`) ?? '').trim()
    const close = String(form.get(`${day}Close`) ?? '').trim()
    if (!isClosed && (!TIME.test(open) || !TIME.test(close))) {
      return { ok: false, message: `Set an opening and closing time for ${WEEK_DAY_LABEL[day]}, or mark it closed.` }
    }
    hours[day] = { open: isClosed ? '' : open, close: isClosed ? '' : close, isClosed }
  }
  if (WEEK_DAYS.every((day) => (hours[day] as DayHours).isClosed)) {
    return { ok: false, message: 'Every day is marked closed. Set the days you are open.' }
  }
  return { ok: true, value: JSON.stringify(hours) }
}
