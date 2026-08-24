// src/lib/db/car-queries.ts
import 'server-only'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'

import { prisma } from './client'

/**
 * The car catalogue, read from the database.
 *
 * Returns the exact `Car` shape src/data/cars.ts declares, so every pure helper
 * in lib/cars.ts — searchCars, filterCars, sortCars, specGroups, carSeo — keeps
 * working untouched, and no component knew the rows moved. That is why the
 * interface stayed the source of truth for the shape even after the data left
 * the module: one shape, two sources, and only this file bridges them.
 *
 * ── The two conversions ────────────────────────────────────────────────
 *
 * price is three columns in the table and one object in the shape. `display` is
 * stored and returned verbatim, never recomputed from the integers — "PKR 1.0649
 * Cr" is what a source published, and an indicative price carries its own
 * marker inside that string.
 *
 * connectors is a comma-separated column and an array in the shape. An empty
 * column becomes null rather than [], because the interface distinguishes them:
 * null means the source never stated a standard, and [] would claim it stated
 * none.
 */

/** One place where a row becomes a Car, so the mapping cannot drift. */
type CarRow = {
  id: string
  slug: string
  brand: string
  model: string
  fullName: string
  category: string
  priceMin: number
  priceMax: number
  priceDisplay: string
  batteryCapacity: number | null
  range: number | null
  rangeMax: number | null
  electricRange: number | null
  electricRangeMax: number | null
  power: number | null
  acceleration: number | null
  topSpeed: number | null
  torque: number | null
  seats: number | null
  dcCharging: number | null
  acCharging: number | null
  connectors: string
  engineCapacity: number | null
  image: string | null
  notes: string | null
}

export function rowToCar(row: CarRow): Car {
  const connectors = row.connectors
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) as ConnectorStandard[]

  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    fullName: row.fullName,
    category: row.category as CarCategory,
    price: { min: row.priceMin, max: row.priceMax, display: row.priceDisplay },
    batteryCapacity: row.batteryCapacity,
    batteryUnit: 'kWh',
    range: row.range,
    rangeMax: row.rangeMax,
    rangeUnit: 'km',
    electricRange: row.electricRange,
    electricRangeMax: row.electricRangeMax,
    power: row.power,
    powerUnit: 'hp',
    acceleration: row.acceleration,
    accelerationUnit: 'sec',
    dcCharging: row.dcCharging,
    dcChargingUnit: 'kW',
    acCharging: row.acCharging,
    acChargingUnit: 'kW',
    connector: connectors.length > 0 ? connectors : null,
    engineCapacity: row.engineCapacity,
    torque: row.torque,
    topSpeed: row.topSpeed,
    seats: row.seats,
    image: row.image,
    notes: row.notes,
  }
}

/**
 * Every car, cheapest first.
 *
 * One query and no pagination, deliberately: the catalogue is a few dozen rows,
 * every page that reads it needs the whole set to compute brands, filters and
 * insights, and paging it would mean each of those became several queries to
 * produce the same answer.
 */
export async function listCars(): Promise<Car[]> {
  const rows = await prisma.car.findMany({ orderBy: { priceMin: 'asc' } })
  return rows.map(rowToCar)
}

export async function getCarBySlugFromDb(slug: string): Promise<Car | null> {
  const row = await prisma.car.findUnique({ where: { slug } })
  return row ? rowToCar(row) : null
}

export async function getCarByIdFromDb(id: string): Promise<Car | null> {
  const row = await prisma.car.findUnique({ where: { id } })
  return row ? rowToCar(row) : null
}

/**
 * Cars for a list of ids, in the order the ids were given.
 *
 * The comparison tray's order is the order the user picked them in, so it
 * cannot be left to the database.
 */
export async function getCarsByIdsFromDb(ids: string[]): Promise<Car[]> {
  if (ids.length === 0) return []
  const rows = await prisma.car.findMany({ where: { id: { in: ids } } })
  const byId = new Map(rows.map((row) => [row.id, rowToCar(row)]))
  return ids.map((id) => byId.get(id)).filter((car): car is Car => Boolean(car))
}

/** Slugs only, for generateStaticParams. */
export async function getCarSlugs(): Promise<string[]> {
  const rows = await prisma.car.findMany({ select: { slug: true } })
  return rows.map((row) => row.slug)
}
