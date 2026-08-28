// crawler/match-input.ts

import type { MatchInput } from './match'
import type { NormalisedVehicle } from './model'

/**
 * Recasts a normalised vehicle as matcher input.
 *
 * Shared by the manual runner, the scheduled pipeline and the tests so all three
 * identify cars identically. When the manual and scheduled versions of this
 * drifted, the same record could match a car on demand and miss it overnight —
 * and the overnight result is the one that reaches the queue.
 *
 * ── Why this is not in adapters.ts ────────────────────────────────────
 *
 * It was, and adapters.ts imports all four source modules. That made every test
 * of the pipeline pull in four adapters — modules that hold URLs, licence text
 * and fetch code — to use one pure function that touches none of it. A mapping
 * between two internal shapes has no business depending on the registry of
 * places data might come from.
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
