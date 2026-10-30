// src/lib/onroad.ts
//
// The on-road price: what a buyer pays to drive a new car away, by province
// and tax status. The rates and their sources live in
// src/data/onroad-rates.ts; this file only applies them to a car.

import type { Car } from '@/data/cars'
import { PROVINCE_RATES, RATES_CHECKED, RATES_FISCAL_YEAR } from '@/data/onroad-rates'

export type Province = 'punjab' | 'sindh' | 'ict' | 'kp' | 'balochistan'
export type TaxStatus = 'filer' | 'nonFiler'

export interface OnRoadLine {
  label: string
  amount: number
  /** True when the amount is zero because of an exemption, so it reads "Free". */
  free?: boolean
  note?: string
}

export interface OnRoadEstimate {
  sections: Array<{ title: string; total: number; lines: OnRoadLine[] }>
  total: number
  /** A qualifier over the total, e.g. "Excl. freight". */
  totalNote?: string
  caveat: string
  sources: Array<{ label: string; url: string }>
}

export const PROVINCE_NAMES: Record<Province, string> = {
  punjab: 'Punjab',
  sindh: 'Sindh',
  ict: 'Islamabad',
  kp: 'Khyber Pakhtunkhwa',
  balochistan: 'Balochistan',
}

/** Every province with sourced rates, in display order. */
export function onRoadProvinces(): Array<{ key: Province; name: string }> {
  return (Object.keys(PROVINCE_NAMES) as Province[])
    .filter((key) => PROVINCE_RATES[key])
    .map((key) => ({ key, name: PROVINCE_NAMES[key] }))
}

/**
 * Every estimate for one car: province × filer status.
 *
 * Null when the car has no single ex-factory price to start from, or no
 * province has rates — the section is then left out rather than guessed.
 */
export function onRoadEstimates(car: Car): Partial<Record<Province, Record<TaxStatus, OnRoadEstimate>>> | null {
  if (!car.price.min) return null
  const out: Partial<Record<Province, Record<TaxStatus, OnRoadEstimate>>> = {}
  for (const { key } of onRoadProvinces()) {
    const rates = PROVINCE_RATES[key]
    if (!rates) continue
    const filer = rates.estimate(car, 'filer')
    const nonFiler = rates.estimate(car, 'nonFiler')
    if (filer && nonFiler) out[key] = { filer, nonFiler }
  }
  return Object.keys(out).length > 0 ? out : null
}

export { RATES_CHECKED, RATES_FISCAL_YEAR }
