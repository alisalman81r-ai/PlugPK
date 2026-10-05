// src/app/(main)/routes/page.tsx
import type { Metadata } from 'next'

import { RoutesPlanner } from '@/components/route/RoutesPlanner'
import type { ConnectorStandard } from '@/data/cars'
import { readOrFallback } from '@/lib/db/availability'
import { listCars } from '@/lib/db/car-queries'
import { getMapStations } from '@/lib/db/queries'
import { MOCK_EV_MODELS } from '@/lib/mock-data'
import type { RouteVehicle } from '@/lib/route-plan'
import type { ConnectorType } from '@/lib/types'

/**
 * The catalogue changes a few times a month at most; stations a little more
 * often. Five minutes keeps a newly listed charger from waiting an hour to be
 * planned through, and matches the map.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'EV Route Planner for Pakistan',
  description:
    'Plan an electric car journey across Pakistan: charging stops from the listed chargers, the charge left on arrival, and how long each stop takes for your car.',
  alternates: { canonical: '/routes' },
}

/** The catalogue's connector names, in the planner's spelling. */
const CONNECTOR: Record<ConnectorStandard, ConnectorType> = {
  CCS2: 'CCS2',
  'Type 2': 'Type2',
  'GB/T': 'GBT',
  CHAdeMO: 'CHAdeMO',
}

const DC_TYPES: ConnectorType[] = ['CCS2', 'CHAdeMO', 'GBT']

/**
 * The planner's EV list is the catalogue's, and its chargers are the map's.
 *
 * Cars: every battery-electric car with a published range and battery — the
 * two figures a charging-stop plan cannot be made without. Plug-in hybrids and
 * range extenders are left out: they can refuel, so a plan built on charging
 * stops alone would be wrong for them. The DC and AC figures are passed
 * separately, so an AC-only car is planned as one.
 *
 * Stations: getMapStations, the same listings the map shows. The planner used
 * to route through MOCK_STATIONS compiled into the client bundle.
 *
 * Both are read through the same guard as the calculator. If the database
 * cannot be reached the planner still renders, on the original ten cars and no
 * chargers — and says so on any journey that would need one.
 */
export default async function RoutesPage() {
  const [cars, stations] = await Promise.all([
    readOrFallback('/routes cars', [], listCars),
    readOrFallback('/routes stations', [], getMapStations),
  ])

  const vehicles: RouteVehicle[] = cars
    .filter((c) => c.category === 'EV' && c.range && c.range > 0 && c.batteryCapacity && c.batteryCapacity > 0)
    .map((c) => ({
      id: c.slug,
      make: c.brand,
      model: c.model,
      year: c.modelYear ?? 0,
      rangeKm: c.range as number,
      batteryCapacityKwh: c.batteryCapacity as number,
      connectorTypes: (c.connector ?? []).map((k) => CONNECTOR[k]).filter(Boolean),
      // Kept for the EVModel shape; the planner reads dcKw and acKw.
      chargingSpeedKw: c.dcCharging ?? c.acCharging ?? 0,
      dcKw: c.dcCharging && c.dcCharging > 0 ? c.dcCharging : null,
      acKw: c.acCharging && c.acCharging > 0 ? c.acCharging : null,
    }))
    .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model))

  /*
    The fixture cars carry one charging figure. It is read as DC only when the
    car lists a DC socket, and as its AC limit otherwise — never as both.
  */
  const fallback: RouteVehicle[] = MOCK_EV_MODELS.map((model) => {
    const hasDc = model.connectorTypes.some((type) => DC_TYPES.includes(type))
    return {
      ...model,
      dcKw: hasDc ? model.chargingSpeedKw : null,
      acKw: hasDc ? null : model.chargingSpeedKw,
    }
  })

  return <RoutesPlanner vehicles={vehicles.length > 0 ? vehicles : fallback} stations={stations} />
}
