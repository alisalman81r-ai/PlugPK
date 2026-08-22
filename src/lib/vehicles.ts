// src/lib/vehicles.ts

import { pakistanEVVehicles, type Availability, type Powertrain, type Vehicle } from '@/data/pakistanVehicles'
import { MOCK_EV_MODELS } from '@/lib/mock-data'
import type { EVModel } from '@/lib/types'

/**
 * Read access to the Pakistan vehicle catalogue.
 *
 * Every function is pure and returns a new array, so a caller can sort or
 * filter a result without mutating the module-level data — a `.sort()` on the
 * source array would reorder it for every other consumer in the process, which
 * on the server means for every request that instance handles.
 */

export type { Availability, Powertrain, Vehicle }

export function getAllVehicles(): Vehicle[] {
  return [...pakistanEVVehicles]
}

export function getVehicleById(id: string): Vehicle | undefined {
  return pakistanEVVehicles.find((vehicle) => vehicle.id === id)
}

/** Case-insensitive: callers pass a brand from a URL or a select as often as from this data. */
export function getVehiclesByBrand(brand: string): Vehicle[] {
  const needle = brand.trim().toLowerCase()
  return pakistanEVVehicles.filter((vehicle) => vehicle.brand.toLowerCase() === needle)
}

export function getVehiclesByPowertrain(powertrain: Powertrain): Vehicle[] {
  return pakistanEVVehicles.filter((vehicle) => vehicle.powertrain === powertrain)
}

export function getOfficialVehicles(): Vehicle[] {
  return pakistanEVVehicles.filter((vehicle) => vehicle.availability === 'official')
}

/**
 * Commercial imports only — `rare-import` is excluded rather than folded in.
 * The two answer different questions: "can I buy one this month" against "does
 * one exist in the country". getRareImportVehicles() covers the latter.
 */
export function getImportedVehicles(): Vehicle[] {
  return pakistanEVVehicles.filter((vehicle) => vehicle.availability === 'imported')
}

export function getRareImportVehicles(): Vehicle[] {
  return pakistanEVVehicles.filter((vehicle) => vehicle.availability === 'rare-import')
}

/**
 * Search brand, model, powertrain and availability.
 *
 * Matching the powertrain and availability is what makes "PHEV" and "imported"
 * work as queries, which a brand-and-model search would return nothing for.
 * The haystack is built per row rather than pre-computed: 145 rows is nothing,
 * and a cached index is one more thing to invalidate when a row is added.
 *
 * Every whitespace-separated term must match somewhere, so "bmw suv" narrows
 * rather than widening — with a single `includes` over the joined string,
 * "tesla model y" would only match if the words happened to sit in that order.
 *
 * An empty query returns everything, so a search box that has been cleared
 * shows the catalogue instead of an empty state.
 */
export function searchVehicles(query: string): Vehicle[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return getAllVehicles()

  return pakistanEVVehicles.filter((vehicle) => {
    const haystack = [
      vehicle.brand,
      vehicle.model,
      vehicle.powertrain,
      vehicle.availability,
      vehicle.bodyType,
      // So "BMW iX" matches as one phrase as well as two terms.
      `${vehicle.brand} ${vehicle.model}`,
    ]
      .join(' ')
      .toLowerCase()

    return terms.every((term) => haystack.includes(term))
  })
}

/** Distinct brands, alphabetical — the first step of the selector. */
export function getBrands(): string[] {
  return Array.from(new Set(pakistanEVVehicles.map((vehicle) => vehicle.brand))).sort((a, b) =>
    a.localeCompare(b),
  )
}

/** Every vehicle grouped under its brand, for a two-level picker. */
export function getVehiclesGroupedByBrand(vehicles: Vehicle[] = pakistanEVVehicles): Array<[string, Vehicle[]]> {
  const byBrand = new Map<string, Vehicle[]>()

  for (const vehicle of vehicles) {
    const existing = byBrand.get(vehicle.brand)
    if (existing) existing.push(vehicle)
    else byBrand.set(vehicle.brand, [vehicle])
  }

  return Array.from(byBrand.entries()).sort(([a], [b]) => a.localeCompare(b))
}

/** "BYD Atto 3" — the label a driver recognises. */
export function getVehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.brand} ${vehicle.model}`
}

/* ─── The spec overlay ──────────────────────────────────────────────
 *
 * The catalogue holds no figures on purpose. MOCK_EV_MODELS does, for the ten
 * cars the route planner needs a real range from, and each of those names the
 * catalogue id it describes. These two functions are the join.
 *
 * This is the seam to replace when specs move to the database: point them at a
 * query and every caller keeps working. Nothing else reaches across.
 */

export function getVehicleSpecs(vehicleId: string): EVModel | undefined {
  return MOCK_EV_MODELS.find((model) => model.vehicleId === vehicleId)
}

/** Catalogue entries that have verified figures behind them. */
export function getSpeccedVehicles(): Vehicle[] {
  const specced = new Set(
    MOCK_EV_MODELS.map((model) => model.vehicleId).filter((id): id is string => Boolean(id)),
  )
  return pakistanEVVehicles.filter((vehicle) => specced.has(vehicle.id))
}

export function hasSpecs(vehicleId: string): boolean {
  return MOCK_EV_MODELS.some((model) => model.vehicleId === vehicleId)
}
