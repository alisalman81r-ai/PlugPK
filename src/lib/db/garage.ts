// src/lib/db/garage.ts
import 'server-only'

import { randomUUID } from 'node:crypto'

import { prisma } from './client'

/**
 * The cars on one account — its garage.
 *
 * Stored in UserVehicle, one row per car, `isDefault` marking the primary. The
 * table points at Vehicle rather than at the catalogue's Car, so Vehicle holds
 * a mirror of each catalogue car under the same id (mirrorCar).
 *
 * `User.vehicle` — the single string the account started with — still holds
 * the primary car's name, so everything that already reads it (the overview,
 * the admin member list) keeps working without knowing about the garage.
 *
 * An account that set its car before the garage existed has that string and
 * no rows. If the string names a catalogue car, it becomes a real row on the
 * first visit. If it does not (a typed-in car), it is shown as one car with id
 * LEGACY_ID, which can be swapped or removed like any other.
 */

export const LEGACY_ID = 'legacy'

export interface GarageCar {
  /** The UserVehicle id, or LEGACY_ID for an account-string-only car. */
  id: string
  /** The catalogue car's id, or null when the name matches no catalogue car. */
  carId: string | null
  name: string
  isPrimary: boolean
}

/** What the vehicles page shows of each catalogue car — and nothing more. */
export interface GarageCatalogueCar {
  id: string
  brand: string
  model: string
  fullName: string
  category: string
  range: number | null
  connector: string[] | null
}

/**
 * The catalogue for the car dropdowns: six columns rather than listCars'
 * forty-odd, which is most of the difference on a database a region away.
 */
export async function getGarageCatalogue(): Promise<GarageCatalogueCar[]> {
  const rows = await prisma.car.findMany({
    select: { id: true, brand: true, model: true, fullName: true, category: true, range: true, connectors: true },
  })
  return rows.map(({ connectors, ...car }) => ({
    ...car,
    connector: connectors ? connectors.split(',').map((c) => c.trim()).filter(Boolean) : null,
  }))
}

/**
 * `catalogue` is a promise so the page can start every read at once: the
 * garage rows, the catalogue and the dashboard counts travel in parallel, and
 * the catalogue is only awaited for an account still on the old single car.
 */
export async function getGarage(
  userId: string,
  legacyVehicle: string | null,
  catalogue: Promise<GarageCatalogueCar[]>,
): Promise<GarageCar[]> {
  const rows = await prisma.userVehicle.findMany({
    where: { userId },
    include: { vehicle: { select: { id: true, brand: true, model: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      carId: row.vehicle.id,
      name: `${row.vehicle.brand} ${row.vehicle.model}`,
      isPrimary: row.isDefault,
    }))
  }

  const legacy = legacyVehicle?.trim()
  if (!legacy) return []

  const match = (await catalogue).find((car) => `${car.brand} ${car.model}`.toLowerCase() === legacy.toLowerCase())
  if (match) {
    // Every catalogue car is mirrored already; mirror first only if this one is not.
    const id = randomUUID()
    const create = () => prisma.userVehicle.create({ data: { id, userId, vehicleId: match.id, isDefault: true } })
    try {
      await create()
    } catch {
      if (!(await mirrorCar(match.id))) return [{ id: LEGACY_ID, carId: null, name: legacy, isPrimary: true }]
      await create()
    }
    return [{ id, carId: match.id, name: `${match.brand} ${match.model}`, isPrimary: true }]
  }
  return [{ id: LEGACY_ID, carId: null, name: legacy, isPrimary: true }]
}

/** The catalogue's powertrain names, in the Vehicle table's. */
const POWERTRAIN: Record<string, string> = { EV: 'BEV', PHEV: 'PHEV', REEV: 'EREV', Hybrid: 'HEV' }
/** The catalogue's connector names, in the Vehicle table's. */
const CONNECTOR: Record<string, string> = { CCS2: 'CCS2', 'Type 2': 'Type2', 'GB/T': 'GBT', CHAdeMO: 'CHAdeMO' }

/** Copies one catalogue car into Vehicle (insert or refresh). False if no such car. */
export async function mirrorCar(carId: string): Promise<boolean> {
  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car) return false

  const data = {
    brand: car.brand,
    model: car.model,
    powertrain: POWERTRAIN[car.category] ?? car.category,
    availability: 'official',
    bodyType: car.bodyType ?? 'Unknown',
    modelYear: car.modelYear,
    rangeKm: car.range,
    batteryCapacityKwh: car.batteryCapacity,
    connectors:
      car.connectors
        .split(',')
        .map((c) => CONNECTOR[c.trim()])
        .filter(Boolean)
        .join(',') || null,
    dcChargingKw: car.dcCharging === null ? null : Math.round(car.dcCharging),
    acChargingKw: car.acCharging === null ? null : Math.round(car.acCharging),
    pricePkr: car.priceMin,
    imageUrl: car.image,
  }
  await prisma.vehicle.upsert({ where: { id: car.id }, create: { id: car.id, ...data }, update: data })
  return true
}
