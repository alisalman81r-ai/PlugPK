// crawler/adapters.ts

import type { MatchInput } from './match'
import type { NormalisedVehicle } from './model'
import { openEvAdapter } from './sources/openev'
import { evdbAdapter } from './sources/evdb'
import { evspecsxAdapter } from './sources/evspecsx'
import { vehdbAdapter } from './sources/vehdb'
import type { SourceAdapter } from './sources/types'

/**
 * The adapter registry, in a module that does nothing when imported.
 *
 * It used to live in run.ts, which calls main() at module scope — so importing
 * the registry from the daily orchestrator would have run the single-source
 * command as a side effect of starting the scheduled one. A registry has to be
 * importable without consequences.
 */
export const ADAPTERS: Record<string, SourceAdapter> = {
  openev: openEvAdapter,
  evdb: evdbAdapter,
  vehdb: vehdbAdapter,
  evspecsx: evspecsxAdapter,
}

export function adapterFor(id: string): SourceAdapter | undefined {
  return ADAPTERS[id]
}

/**
 * Recasts a normalised vehicle as matcher input.
 *
 * Shared by the manual and scheduled runners so both identify cars identically.
 * When these drifted, the same record could match a car on demand and miss it
 * overnight — and the overnight result is the one that reaches the queue.
 */
export function toMatchInput(vehicle: NormalisedVehicle): MatchInput {
  return {
    normalised: {
      brand: vehicle.brand,
      model: vehicle.model,
      variant: vehicle.variant,
      modelYear: vehicle.modelYear,
      fullName: [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || null,
      category: vehicle.powertrainType,
      priceMin: vehicle.pakistanPrice,
      priceMax: vehicle.pakistanPrice,
      priceRaw: null,
      batteryKwh: vehicle.batteryCapacityKwh,
      rangeKm: vehicle.rangeKm,
      electricRangeKm: vehicle.electricRangeKm,
      powerHp: null,
      accelerationSec: vehicle.acceleration0To100Sec,
      topSpeedKph: vehicle.topSpeedKph,
      torqueNm: vehicle.torqueNm,
      seats: vehicle.seats,
      dcKw: vehicle.dcChargingKw,
      acKw: vehicle.acChargingKw,
      engineCc: null,
      connectors: vehicle.chargingStandards,
      imageUrl: null,
    },
    externalId: vehicle.externalId,
  }
}
