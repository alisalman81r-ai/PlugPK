// src/lib/cars.ts

import {
  cars,
  type Car,
  type CarCategory,
  type ConnectorStandard,
} from '@/data/cars'

/**
 * Everything that reads the car database.
 *
 * The only module that touches src/data/cars.ts, so moving the rows into the
 * database later is a change here and nowhere else. Pure functions over arrays
 * — no caching, no indexes: a few dozen cars filter in well under a frame, and
 * an index is one more thing to invalidate when a row is added.
 */

export type { Car, CarCategory, ConnectorStandard }

export const CATEGORY_ORDER: CarCategory[] = ['EV', 'PHEV', 'REEV', 'Hybrid']

export function getAllCars(): Car[] {
  return [...cars]
}

export function getCarBySlug(slug: string): Car | undefined {
  return cars.find((car) => car.slug === slug)
}

export function getCarsByIds(ids: string[]): Car[] {
  // Mapped over ids rather than filtered over cars, so the result follows the
  // order the user picked them in — which is the order the comparison shows.
  return ids.map((id) => cars.find((car) => car.id === id)).filter((car): car is Car => Boolean(car))
}

/** Brands present in the data, alphabetical. Never a hardcoded list. */
export function getBrands(): string[] {
  return Array.from(new Set(cars.map((car) => car.brand))).sort((a, b) => a.localeCompare(b))
}

/** Only the categories that actually have cars — no empty "Hybrid" chip. */
export function getCategories(): CarCategory[] {
  const present = new Set(cars.map((car) => car.category))
  return CATEGORY_ORDER.filter((category) => present.has(category))
}

export function getConnectors(): ConnectorStandard[] {
  const present = new Set<ConnectorStandard>()
  for (const car of cars) for (const connector of car.connector ?? []) present.add(connector)
  return Array.from(present).sort((a, b) => a.localeCompare(b))
}

/** The full price span in the data, for the range slider's bounds. */
export function getPriceBounds(): { min: number; max: number } {
  const values = cars.flatMap((car) => [car.price.min, car.price.max])
  return { min: Math.min(...values), max: Math.max(...values) }
}

// ─── Pakistani money ────────────────────────────────────────

/**
 * Rupees as Lakh and Crore.
 *
 * Not Intl.NumberFormat: 'en-PK' groups in the Western thousands pattern, so
 * 15,000,000 comes out "15,000,000" rather than the "1.5 Cr" a buyer here
 * reads. Trailing zeros are trimmed so 1.50 Cr prints as "1.5 Cr" but 1.0649
 * keeps its precision — the figure was published to four places and rounding it
 * would quietly change the price.
 */
export function formatPkr(rupees: number): string {
  const trim = (value: number, places: number) =>
    Number(value.toFixed(places))
      .toString()
      .replace(/\.0+$/, '')

  if (rupees >= 10_000_000) return `PKR ${trim(rupees / 10_000_000, 4)} Cr`
  if (rupees >= 100_000) return `PKR ${trim(rupees / 100_000, 2)} Lakh`
  return `PKR ${rupees.toLocaleString('en-PK')}`
}

/**
 * What a card shows.
 *
 * Prefers the published wording over anything derived, so "PKR 1.33–1.70 Cr"
 * appears exactly as quoted rather than being reassembled from two integers.
 */
export function formatCarPrice(car: Car): string {
  return car.price.display
}

// ─── Search ─────────────────────────────────────────────────

/**
 * Brand, model, full name and category.
 *
 * Every whitespace-separated term must match, so "byd seal" narrows to the Seal
 * instead of returning every BYD plus every car with "seal" in it. Searching
 * "BYD" returns all four BYDs; "PHEV" returns the plug-in hybrids, since the
 * category is part of the haystack.
 */
export function searchCars(list: Car[], query: string): Car[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return [...list]

  return list.filter((car) => {
    const haystack = [car.brand, car.model, car.fullName, car.category]
      .join(' ')
      .toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

// ─── Filters ────────────────────────────────────────────────

export interface CarFilterState {
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  /** Rupees. A car matches when its span overlaps this one. */
  priceMax: number | null
  /** Minimums — "at least this much". */
  minBattery: number | null
  minRange: number | null
  minPower: number | null
}

export const EMPTY_FILTERS: CarFilterState = {
  brands: [],
  categories: [],
  connectors: [],
  priceMax: null,
  minBattery: null,
  minRange: null,
  minPower: null,
}

export function hasActiveFilters(filters: CarFilterState): boolean {
  return (
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.connectors.length > 0 ||
    filters.priceMax !== null ||
    filters.minBattery !== null ||
    filters.minRange !== null ||
    filters.minPower !== null
  )
}

/**
 * The distance a car can go on electricity, whichever field holds it.
 *
 * An EV keeps it in `range` and a PHEV in `electricRange`, so a single "range"
 * filter has to read both or it would silently exclude every plug-in hybrid the
 * moment somebody dragged the slider.
 */
export function electricDistance(car: Car): number | null {
  return car.range ?? car.electricRange
}

/**
 * All filters, ANDed.
 *
 * Empty groups mean "no constraint" rather than "match nothing", which is what
 * makes the sidebar start unfiltered. A minimum against a null spec excludes
 * the car — asking for 60 kWh cannot be satisfied by a battery nobody
 * published, and quietly including it would put an unknown in a list the user
 * asked to be certain about.
 */
export function filterCars(list: Car[], filters: CarFilterState): Car[] {
  return list.filter((car) => {
    if (filters.brands.length > 0 && !filters.brands.includes(car.brand)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(car.category)) return false

    if (filters.connectors.length > 0) {
      const own = car.connector ?? []
      if (!filters.connectors.some((connector) => own.includes(connector))) return false
    }

    // Overlap, not "starts below": a 1.33–1.70 Cr car belongs in a search
    // capped at 1.5 Cr, because you can buy one for less than the cap.
    if (filters.priceMax !== null && car.price.min > filters.priceMax) return false

    if (filters.minBattery !== null) {
      if (car.batteryCapacity === null || car.batteryCapacity < filters.minBattery) return false
    }

    if (filters.minRange !== null) {
      const distance = electricDistance(car)
      if (distance === null || distance < filters.minRange) return false
    }

    if (filters.minPower !== null) {
      if (car.power === null || car.power < filters.minPower) return false
    }

    return true
  })
}

// ─── Sorting ────────────────────────────────────────────────

export type CarSort =
  | 'price-asc'
  | 'price-desc'
  | 'range-desc'
  | 'battery-desc'
  | 'power-desc'
  | 'newest'

export const SORT_LABELS: Record<CarSort, string> = {
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'range-desc': 'Range: highest',
  'battery-desc': 'Battery: largest',
  'power-desc': 'Power: highest',
  newest: 'Newest',
}

/**
 * Nulls sort last in every direction.
 *
 * A car with no published power is not the least powerful car — it is unknown,
 * and putting it at the top of "power: highest" would read as a claim. Sorting
 * it to the bottom regardless of direction keeps the ranked end of the list
 * meaningful.
 */
function compareDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return b - a
}

export function sortCars(list: Car[], sort: CarSort): Car[] {
  const out = [...list]

  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => a.price.min - b.price.min)
    case 'price-desc':
      return out.sort((a, b) => b.price.max - a.price.max)
    case 'range-desc':
      return out.sort((a, b) => compareDesc(electricDistance(a), electricDistance(b)))
    case 'battery-desc':
      return out.sort((a, b) => compareDesc(a.batteryCapacity, b.batteryCapacity))
    case 'power-desc':
      return out.sort((a, b) => compareDesc(a.power, b.power))
    case 'newest':
      /**
       * The data carries no launch or listing date, so "newest" cannot be
       * answered from it. Rather than invent an order and present it as
       * recency, this keeps the authored order of the module — which is how the
       * list was supplied. Give a car a `listedAt` and this becomes a real
       * sort; until then it is honest about being the default order.
       */
      return out
    default:
      return out
  }
}

// ─── Which specs a category should show ─────────────────────

/**
 * The headline figures per powertrain.
 *
 * An EV's story is battery → range → how fast it charges. A PHEV's is battery →
 * electric range → the engine that takes over. Showing a PHEV an empty "range"
 * row, or an EV an empty "engine" row, is how a spec sheet starts looking
 * unfinished — so each category names its own fields and the card renders only
 * those.
 */
export function headlineSpecs(car: Car): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = []

  const push = (label: string, value: string | null) => {
    if (value) out.push({ label, value })
  }

  const span = (low: number | null, high: number | null, unit: string) => {
    if (low === null) return null
    return high ? `${low}–${high} ${unit}` : `${low} ${unit}`
  }

  push('Battery', car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null)

  if (car.category === 'EV') {
    push('Range', span(car.range, car.rangeMax, car.rangeUnit))
    push('DC charging', car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null)
    push('AC charging', car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null)
  } else {
    push('Electric range', span(car.electricRange, car.electricRangeMax, car.rangeUnit))
    push('Engine', car.engineCapacity ? `${car.engineCapacity} cc` : null)
    push('Power', car.power ? `${car.power} ${car.powerUnit}` : null)
  }

  return out
}

/** Every published figure, for the detail page and the comparison. */
export function fullSpecs(car: Car): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = []
  const push = (label: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && value !== '') {
      out.push({ label, value: String(value) })
    }
  }

  const span = (low: number | null, high: number | null, unit: string) =>
    low === null ? null : high ? `${low}–${high} ${unit}` : `${low} ${unit}`

  push('Category', car.category)
  push('Price', car.price.display)
  push(
    'Battery capacity',
    car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null,
  )
  push('Driving range', span(car.range, car.rangeMax, car.rangeUnit))
  push('Electric range', span(car.electricRange, car.electricRangeMax, car.rangeUnit))
  push('Power', car.power ? `${car.power} ${car.powerUnit}` : null)
  push('Torque', car.torque ? `${car.torque} Nm` : null)
  push('0–100 km/h', car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null)
  push('Top speed', car.topSpeed ? `${car.topSpeed} km/h` : null)
  push('DC charging', car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null)
  push('AC charging', car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null)
  push('Charging connector', car.connector?.length ? car.connector.join(', ') : null)
  push('Engine capacity', car.engineCapacity ? `${car.engineCapacity} cc` : null)
  push('Seats', car.seats)

  return out
}

// ─── SEO ────────────────────────────────────────────────────

/**
 * Titles and descriptions built from the row.
 *
 * Written here rather than on the page so all of them stay in one shape, and so
 * a car with no battery figure does not end up with a description containing
 * "null kWh".
 */
export function carSeo(car: Car): {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  canonical: string
} {
  const kind =
    car.category === 'EV'
      ? 'EV'
      : car.category === 'REEV'
        ? 'range-extender'
        : car.category.toLowerCase()

  const facts = [
    car.batteryCapacity ? `${car.batteryCapacity} kWh battery` : null,
    car.range ? `${car.range} km range` : null,
    car.electricRange ? `${car.electricRange} km electric range` : null,
    car.power ? `${car.power} hp` : null,
  ].filter(Boolean)

  const description = `${car.fullName} price in Pakistan: ${car.price.display}. ${
    facts.length > 0 ? `${facts.join(', ')}. ` : ''
  }Full ${kind} specifications, charging and range on Plug.pk.`

  return {
    title: `${car.fullName} Price in Pakistan | ${
      car.category === 'EV' ? 'EV Specifications & Range' : 'Specifications & Electric Range'
    }`,
    description,
    ogTitle: `${car.fullName} — ${car.price.display}`,
    ogDescription: description,
    canonical: `/cars/${car.slug}`,
  }
}
