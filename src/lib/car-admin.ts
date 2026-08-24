// src/lib/car-admin.ts

import type { Car, CarCategory } from '@/data/cars'
import { carImageCredits, type ImageCredit } from '@/data/carImageCredits'

/**
 * What the admin catalogue needs to know about each car that the public pages
 * do not: which figures are missing, which are only indicative, and whether the
 * photograph is licensed.
 *
 * Kept apart from lib/cars.ts because the two ask opposite questions. The public
 * side asks "what can I show?" and hides a null. An operator asks "what is
 * missing?", and hiding a null is precisely the wrong answer — the gaps are the
 * work list.
 *
 * ── Completeness is category-aware, and that is the whole point ────────
 *
 * A naive count of populated fields makes every hybrid look badly documented.
 * A full hybrid has no plug, so `dcCharging`, `acCharging` and `connector` are
 * null by correctness rather than by omission; counting them as gaps would put
 * five fully-specified cars at the bottom of the list and send an operator
 * hunting for figures that do not exist. So each category declares which fields
 * it is expected to carry, and completeness is measured against that.
 *
 * `torque`, `topSpeed` and `seats` are excluded from every expectation. The data
 * module notes they were never supplied for any car; scoring 36 rows against
 * three fields nobody has would make the meter read 70% across the board and
 * mean nothing.
 */

/** Fields a car of each category is expected to have a figure for. */
const EXPECTED: Record<CarCategory, (keyof Car)[]> = {
  EV: [
    'batteryCapacity',
    'range',
    'power',
    'acceleration',
    'dcCharging',
    'acCharging',
    'connector',
    'image',
  ],
  // A plug-in is judged on its electric range and its engine, not on a
  // full-charge `range` it does not quote.
  PHEV: ['batteryCapacity', 'electricRange', 'power', 'engineCapacity', 'acCharging', 'image'],
  REEV: ['batteryCapacity', 'electricRange', 'power', 'engineCapacity', 'acCharging', 'image'],
  // No plug, so no charging fields are expected of it.
  Hybrid: ['power', 'engineCapacity', 'image'],
}

/** Every field on the interface, in the order an operator reads them. */
export const ALL_FIELDS: (keyof Car)[] = [
  'id',
  'slug',
  'brand',
  'model',
  'fullName',
  'category',
  'price',
  'batteryCapacity',
  'range',
  'rangeMax',
  'electricRange',
  'electricRangeMax',
  'power',
  'acceleration',
  'dcCharging',
  'acCharging',
  'connector',
  'engineCapacity',
  'torque',
  'topSpeed',
  'seats',
  'image',
  'notes',
]

export type IssueLevel = 'warn' | 'info'

export interface CarIssue {
  level: IssueLevel
  label: string
  /** What an operator would do about it. */
  detail: string
}

export interface CarAudit {
  car: Car
  /** Expected fields that carry a figure. */
  filled: number
  /** Expected fields in total, for this car's category. */
  expected: number
  /** 0–100, rounded. */
  completeness: number
  /** Expected fields that are null. */
  missing: (keyof Car)[]
  issues: CarIssue[]
  credit: ImageCredit | undefined
  /** True when the price came from a published list rather than an estimate. */
  priceConfirmed: boolean
}

/** A field counts as unset when it is null, undefined, or an empty array. */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Audits one car.
 *
 * Pure, and takes the car rather than an id, so the list page can audit all 36
 * in one pass without 36 lookups.
 */
export function auditCar(car: Car): CarAudit {
  const expectedFields = EXPECTED[car.category]
  const missing = expectedFields.filter((field) => isEmpty(car[field]))
  const filled = expectedFields.length - missing.length
  const credit = carImageCredits[car.id]

  const issues: CarIssue[] = []

  if (car.image === null) {
    issues.push({
      level: 'warn',
      label: 'No photograph',
      detail:
        'The card and detail page fall back to a placeholder. Add a licensed file to public/images/cars and run scripts/fetch-car-images.mjs, or set the path by hand.',
    })
  } else if (!credit) {
    // A photograph with no recorded licence is the one issue here that is a
    // legal problem rather than a cosmetic one.
    issues.push({
      level: 'warn',
      label: 'Photograph has no credit on record',
      detail:
        'Every image in this catalogue is CC or public domain, and CC BY-SA requires the photographer to be named wherever it appears. Re-run scripts/fetch-car-images.mjs to regenerate the credits.',
    })
  }

  const priceConfirmed = !car.price.display.includes('(indicative)')
  if (!priceConfirmed) {
    issues.push({
      level: 'info',
      label: 'Price is indicative',
      detail:
        'Not from a dealer price list. Confirm against the current list before this row is quoted anywhere.',
    })
  }

  /*
    The missing photograph is reported above, on its own terms, so it is left out
    here. Counting it twice made a hybrid with one gap read as two problems, and
    the sentence came out as "but image would each add a row to the public
    specification table" — which is both ungrammatical and untrue, since a
    photograph is not a specification row.
  */
  const missingFigures = missing.filter((field) => field !== 'image')
  if (missingFigures.length > 0) {
    const names = missingFigures.map((field) => FIELD_META[field]?.label ?? field)
    const one = missingFigures.length === 1

    issues.push({
      level: 'info',
      label: `${missingFigures.length} expected ${one ? 'figure' : 'figures'} not published`,
      detail: `Null rather than estimated, which is correct — but ${
        one ? names[0] : names.join(', ')
      } would ${one ? 'add a row' : 'each add a row'} to the public specification table.`,
    })
  }

  return {
    car,
    filled,
    expected: expectedFields.length,
    completeness: Math.round((filled / expectedFields.length) * 100),
    missing,
    issues,
    credit,
    priceConfirmed,
  }
}

/**
 * Audits a whole catalogue.
 *
 * Takes the list rather than loading it, so the caller decides where the rows
 * came from. The admin page passes the database; a script could pass the seed
 * module. This file used to import the module directly, which stopped being
 * right the moment the rows became editable — an audit of the seed would have
 * told an operator nothing about what the site is actually serving.
 */
export function auditCatalogue(list: Car[]): CarAudit[] {
  return list.map(auditCar)
}

export interface CatalogueSummary {
  total: number
  byCategory: { category: CarCategory; count: number }[]
  withPhoto: number
  withoutPhoto: number
  confirmedPrices: number
  indicativePrices: number
  /** Mean completeness across the catalogue, rounded. */
  averageCompleteness: number
  /** Cars carrying at least one warning. */
  needingAttention: number
  brands: number
}

export function summarise(audits: CarAudit[]): CatalogueSummary {
  const categories: CarCategory[] = ['EV', 'PHEV', 'REEV', 'Hybrid']

  return {
    total: audits.length,
    byCategory: categories
      .map((category) => ({
        category,
        count: audits.filter((audit) => audit.car.category === category).length,
      }))
      .filter((entry) => entry.count > 0),
    withPhoto: audits.filter((audit) => audit.car.image !== null).length,
    withoutPhoto: audits.filter((audit) => audit.car.image === null).length,
    confirmedPrices: audits.filter((audit) => audit.priceConfirmed).length,
    indicativePrices: audits.filter((audit) => !audit.priceConfirmed).length,
    averageCompleteness:
      audits.length === 0
        ? 0
        : Math.round(audits.reduce((total, audit) => total + audit.completeness, 0) / audits.length),
    needingAttention: audits.filter((audit) =>
      audit.issues.some((issue) => issue.level === 'warn'),
    ).length,
    brands: new Set(audits.map((audit) => audit.car.brand)).size,
  }
}

/**
 * Field labels and units for the detail page.
 *
 * The unit lives beside the label rather than being glued to the value, so a
 * missing figure reads "Battery (kWh) — not published" instead of the unitless
 * "Battery — not published" that leaves an operator guessing what was expected.
 */
export const FIELD_META: Partial<Record<keyof Car, { label: string; unit?: string }>> = {
  id: { label: 'ID' },
  slug: { label: 'Slug' },
  brand: { label: 'Brand' },
  model: { label: 'Model' },
  fullName: { label: 'Full name' },
  category: { label: 'Powertrain' },
  price: { label: 'Price' },
  batteryCapacity: { label: 'Battery capacity', unit: 'kWh' },
  range: { label: 'Range', unit: 'km' },
  rangeMax: { label: 'Range, upper figure', unit: 'km' },
  electricRange: { label: 'Electric-only range', unit: 'km' },
  electricRangeMax: { label: 'Electric range, upper figure', unit: 'km' },
  power: { label: 'Power', unit: 'hp' },
  acceleration: { label: '0–100 km/h', unit: 'sec' },
  dcCharging: { label: 'DC charging', unit: 'kW' },
  acCharging: { label: 'AC charging', unit: 'kW' },
  connector: { label: 'Connectors' },
  engineCapacity: { label: 'Engine capacity', unit: 'cc' },
  torque: { label: 'Torque', unit: 'Nm' },
  topSpeed: { label: 'Top speed', unit: 'km/h' },
  seats: { label: 'Seats' },
  image: { label: 'Photograph' },
  notes: { label: 'Notes' },
}

/** Which fields this category is expected to carry, for the detail page. */
export function expectedFor(category: CarCategory): (keyof Car)[] {
  return EXPECTED[category]
}
