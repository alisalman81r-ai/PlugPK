// crawler/model.ts

/**
 * The vehicle shape every source is flattened into.
 *
 * Wider than `NormalisedCar` in normalise.ts, which was Phase 1's minimum — this
 * is the target shape for a detailed EV/PHEV database, and no source fills all
 * of it. That is expected and is the point: a field a source does not publish
 * stays null, and null is a fact about the source, not a gap to be filled by
 * guessing.
 *
 * ── Units are in the field names, deliberately ────────────────────────
 *
 * `batteryCapacityKwh`, `dcChargingKw`, `rangeKm`. A bare `range` invites one
 * source's miles to be stored beside another's kilometres and compared as if
 * they were the same number. Naming the unit makes that mistake visible at the
 * point it would be made rather than three screens later.
 *
 * ── Nothing here is the catalogue's shape ─────────────────────────────
 *
 * This never becomes a `Car` by assignment. Applying a record to the catalogue
 * is a reviewed, validated write through car-actions.ts, and the two shapes are
 * kept apart so that nobody can shortcut it.
 */

/** How a value was obtained, which bears on how much to trust it. */
export type ExtractionMethod =
  /** A published dataset or official API — the strongest. */
  | 'dataset'
  | 'api'
  /** schema.org / JSON-LD on a page. */
  | 'json-ld'
  /** og: or twitter: meta tags. */
  | 'meta'
  /** CSS selectors over rendered markup — the weakest. */
  | 'dom'
  /** Derived from other fields rather than read. */
  | 'computed'

export type RangeStandard = 'WLTP' | 'EPA' | 'NEDC' | 'CLTC' | 'real-world' | 'unspecified'

export interface Dimensions {
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
}

/**
 * One vehicle, as a source describes it.
 *
 * Every field is nullable. A source that publishes only a price and a name
 * produces a valid record — a sparse one, with a low confidence, which is
 * exactly how it should be treated.
 */
export interface NormalisedVehicle {
  // ── Identity ────────────────────────────────────────────────────────
  brand: string | null
  model: string | null
  variant: string | null
  trim: string | null
  modelYear: number | null
  generation: string | null
  bodyType: string | null

  // ── Powertrain ──────────────────────────────────────────────────────
  /** EV | PHEV | REEV | Hybrid — the catalogue's four. */
  powertrainType: string | null
  fuelType: string | null
  motorCount: number | null
  motorPowerKw: number | null
  totalPowerKw: number | null
  torqueNm: number | null
  /** FWD | RWD | AWD */
  drivetrain: string | null

  // ── Battery ─────────────────────────────────────────────────────────
  /** Gross, as marketed. */
  batteryCapacityKwh: number | null
  /** Usable, which is the figure that determines range. Sources conflate the
   *  two constantly, so both are kept and neither is derived from the other. */
  usableBatteryCapacityKwh: number | null
  batteryChemistry: string | null
  batteryVoltage: number | null
  /** 400V | 800V — decides which chargers can deliver peak power. */
  batteryArchitecture: string | null

  // ── Range ───────────────────────────────────────────────────────────
  rangeKm: number | null
  /** Which cycle produced `rangeKm`. Without it the number is not comparable:
   *  a CLTC figure runs roughly a third above the WLTP one for the same car. */
  rangeStandard: RangeStandard | null
  cityRangeKm: number | null
  highwayRangeKm: number | null
  realWorldRangeKm: number | null
  /** Electric-only range for a PHEV or REEV. */
  electricRangeKm: number | null

  // ── Charging ────────────────────────────────────────────────────────
  acChargingKw: number | null
  dcChargingKw: number | null
  onboardChargerKw: number | null
  chargeTime10To80Min: number | null
  chargeTime0To100Min: number | null
  acConnector: string | null
  dcConnector: string | null
  chargingStandards: string[]

  // ── Features ────────────────────────────────────────────────────────
  v2l: boolean | null
  v2h: boolean | null
  v2g: boolean | null
  heatPump: boolean | null
  regenerativeBraking: boolean | null

  // ── Performance and body ────────────────────────────────────────────
  acceleration0To100Sec: number | null
  topSpeedKph: number | null
  weightKg: number | null
  dimensions: Dimensions
  wheelbaseMm: number | null
  groundClearanceMm: number | null
  bootCapacityL: number | null
  seats: number | null

  // ── Pakistan ────────────────────────────────────────────────────────
  /** official | imported | grey-import | not-available */
  availability: string | null
  pakistanPrice: number | null
  priceCurrency: string | null
  officialDistributor: string | null
  warranty: string | null
  batteryWarranty: string | null

  // ── Provenance ──────────────────────────────────────────────────────
  source: string
  sourceUrl: string
  externalId: string | null
  fetchedAt: string
  /** 0–100. Comparable within a source, indicative across sources. */
  confidence: number
  extractionMethod: ExtractionMethod
}

/** Every field that carries data, for coverage and conflict work. */
export const VEHICLE_FIELDS = [
  'brand', 'model', 'variant', 'trim', 'modelYear', 'generation', 'bodyType',
  'powertrainType', 'fuelType', 'motorCount', 'motorPowerKw', 'totalPowerKw',
  'torqueNm', 'drivetrain',
  'batteryCapacityKwh', 'usableBatteryCapacityKwh', 'batteryChemistry',
  'batteryVoltage', 'batteryArchitecture',
  'rangeKm', 'rangeStandard', 'cityRangeKm', 'highwayRangeKm',
  'realWorldRangeKm', 'electricRangeKm',
  'acChargingKw', 'dcChargingKw', 'onboardChargerKw', 'chargeTime10To80Min',
  'chargeTime0To100Min', 'acConnector', 'dcConnector', 'chargingStandards',
  'v2l', 'v2h', 'v2g', 'heatPump', 'regenerativeBraking',
  'acceleration0To100Sec', 'topSpeedKph', 'weightKg', 'wheelbaseMm',
  'groundClearanceMm', 'bootCapacityL', 'seats',
  'availability', 'pakistanPrice', 'priceCurrency', 'officialDistributor',
  'warranty', 'batteryWarranty',
] as const satisfies readonly (keyof NormalisedVehicle)[]

export type VehicleField = (typeof VEHICLE_FIELDS)[number]

/** A vehicle with every field null, for an adapter to fill in what it has. */
export function emptyVehicle(provenance: {
  source: string
  sourceUrl: string
  externalId?: string | null
  extractionMethod: ExtractionMethod
}): NormalisedVehicle {
  return {
    brand: null, model: null, variant: null, trim: null, modelYear: null,
    generation: null, bodyType: null,

    powertrainType: null, fuelType: null, motorCount: null, motorPowerKw: null,
    totalPowerKw: null, torqueNm: null, drivetrain: null,

    batteryCapacityKwh: null, usableBatteryCapacityKwh: null,
    batteryChemistry: null, batteryVoltage: null, batteryArchitecture: null,

    rangeKm: null, rangeStandard: null, cityRangeKm: null, highwayRangeKm: null,
    realWorldRangeKm: null, electricRangeKm: null,

    acChargingKw: null, dcChargingKw: null, onboardChargerKw: null,
    chargeTime10To80Min: null, chargeTime0To100Min: null,
    acConnector: null, dcConnector: null, chargingStandards: [],

    v2l: null, v2h: null, v2g: null, heatPump: null, regenerativeBraking: null,

    acceleration0To100Sec: null, topSpeedKph: null, weightKg: null,
    dimensions: { lengthMm: null, widthMm: null, heightMm: null },
    wheelbaseMm: null, groundClearanceMm: null, bootCapacityL: null, seats: null,

    availability: null, pakistanPrice: null, priceCurrency: null,
    officialDistributor: null, warranty: null, batteryWarranty: null,

    source: provenance.source,
    sourceUrl: provenance.sourceUrl,
    externalId: provenance.externalId ?? null,
    fetchedAt: new Date().toISOString(),
    confidence: 0,
    extractionMethod: provenance.extractionMethod,
  }
}

/** How many fields carry a value. An empty array counts as absent. */
export function coverage(vehicle: NormalisedVehicle): { filled: number; total: number } {
  let filled = 0
  for (const field of VEHICLE_FIELDS) {
    const value = vehicle[field]
    if (value === null || value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    filled += 1
  }
  return { filled, total: VEHICLE_FIELDS.length }
}
