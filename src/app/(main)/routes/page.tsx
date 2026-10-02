// src/app/(main)/routes/page.tsx
import { RoutesPlanner } from '@/components/route/RoutesPlanner'
import { readOrFallback } from '@/lib/db/availability'
import { listCars } from '@/lib/db/car-queries'
import type { ConnectorStandard } from '@/data/cars'
import { MOCK_EV_MODELS } from '@/lib/mock-data'
import type { ConnectorType, EVModel } from '@/lib/types'

/** The catalogue changes a few times a month at most, as on the calculator. */
export const revalidate = 3600

/** The catalogue's connector names, in the planner's spelling. */
const CONNECTOR: Record<ConnectorStandard, ConnectorType> = {
  CCS2: 'CCS2',
  'Type 2': 'Type2',
  'GB/T': 'GBT',
  CHAdeMO: 'CHAdeMO',
}

/**
 * The planner's EV list is the catalogue's.
 *
 * It used to be a fixed list of ten cars in mock-data, so every car added to
 * the catalogue was missing here. Now it is every battery-electric car with a
 * published range and battery — the two figures a charging-stop plan cannot
 * be made without. Plug-in hybrids and range extenders are left out: they can
 * refuel, so a plan built on charging stops alone would be wrong for them.
 *
 * Read through the same guard as the calculator. If the database cannot be
 * reached the planner still works, on the original ten.
 */
export default async function RoutesPage() {
  const cars = await readOrFallback('/routes cars', [], listCars)

  const vehicles: EVModel[] = cars
    .filter((c) => c.category === 'EV' && c.range && c.range > 0 && c.batteryCapacity && c.batteryCapacity > 0)
    .map((c) => ({
      id: c.slug,
      make: c.brand,
      model: c.model,
      year: c.modelYear ?? 0,
      rangeKm: c.range as number,
      batteryCapacityKwh: c.batteryCapacity as number,
      connectorTypes: (c.connector ?? []).map((k) => CONNECTOR[k]).filter(Boolean),
      // Peak DC where the car has it, AC otherwise; the stop-time estimate
      // already derates whatever it is given.
      chargingSpeedKw: c.dcCharging ?? c.acCharging ?? 7,
    }))
    .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model))

  return <RoutesPlanner vehicles={vehicles.length > 0 ? vehicles : MOCK_EV_MODELS} />
}
