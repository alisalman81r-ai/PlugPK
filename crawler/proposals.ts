// crawler/proposals.ts

import { compareField, needsReview, render, type SourceClaim } from './compare'
import { scoreComparison, explain } from './confidence'
import { assess } from './policy'
import type { SourceRole } from './priority-config'
import type { NormalisedVehicle } from './model'
import type { CrawlLogger } from './logger'

/**
 * Turning stored source records into reviewable proposals.
 *
 * Extracted from the propose command so the daily orchestrator and the manual
 * command run exactly the same code. Two implementations of "what counts as a
 * change worth showing a person" would diverge, and the one that diverged would
 * be the automated one nobody watches.
 *
 * Writes CarFieldChange, CarPriceHistory and CarImageCandidate. Writes nothing to
 * Car — that path runs through applyChange() and a human, and only there.
 */

/**
 * Which role each configured source plays.
 *
 * Deliberately explicit rather than inferred from the adapter: a source's role
 * decides what it is trusted about, and that is a judgement about the
 * organisation behind it, not a property of its file format. A new source that
 * is not listed here gets `aggregator` — the least authority — so forgetting to
 * classify one cannot accidentally grant it a manufacturer's weight.
 */
export const SOURCE_ROLES: Record<string, SourceRole> = {
  openev: 'open-dataset',
  evdb: 'ev-database',
  vehdb: 'aggregator',
  evspecsx: 'pk-market',
}

export function roleFor(sourceId: string): SourceRole {
  return SOURCE_ROLES[sourceId] ?? 'aggregator'
}

/**
 * How a normalised vehicle's fields map onto Car's columns.
 *
 * Only fields the catalogue actually stores appear here. A source may publish a
 * heat pump or a boot capacity; until Car has somewhere to put it, proposing a
 * change to a column that does not exist would be noise in the queue.
 *
 * `power` is the notable conversion: the crawler carries kW, Car stores hp.
 */
export const FIELD_MAP: { car: string; from: (vehicle: NormalisedVehicle) => unknown }[] = [
  { car: 'batteryCapacity', from: (v) => v.usableBatteryCapacityKwh ?? v.batteryCapacityKwh },
  { car: 'range', from: (v) => v.rangeKm },
  { car: 'electricRange', from: (v) => v.electricRangeKm },
  { car: 'dcCharging', from: (v) => v.dcChargingKw },
  { car: 'acCharging', from: (v) => v.acChargingKw },
  { car: 'topSpeed', from: (v) => v.topSpeedKph },
  { car: 'torque', from: (v) => v.torqueNm },
  { car: 'acceleration', from: (v) => v.acceleration0To100Sec },
  { car: 'seats', from: (v) => v.seats },
  {
    car: 'power',
    /*
      `== null` rather than `=== null`, deliberately.

      A source that omits a field entirely gives `undefined`, not `null`, and
      `undefined === null` is false — so this computed Math.round(undefined /
      0.7457) and produced NaN. Every record without a power figure then arrived
      as a claim of NaN, was flagged "not a finite number", and filled the queue
      with suspicious power rows for cars no source had said anything about.
    */
    from: (v) => (v.totalPowerKw == null ? null : Math.round(v.totalPowerKw / 0.7457)),
  },
  { car: 'connectors', from: (v) => (v.chargingStandards.length > 0 ? v.chargingStandards : null) },
]

/** The staging row shape this needs — narrower than Prisma's, so tests can build one. */
export interface RecordLike {
  id: string
  sourceId: string
  runId: string
  sourceUrl: string
  fetchedAt: Date
  confidence: number
  raw: string
  normalised: string | null
  matchedCarId: string | null
}

export interface CarLike {
  id: string
  slug: string
  fullName: string
  category: string
  [column: string]: unknown
}

export interface ProposeOptions {
  /** Report without writing. */
  dry?: boolean
  /** Print a line per field. The daily run keeps this off and logs instead. */
  verbose?: boolean
  logger?: CrawlLogger | undefined
  runId?: string | undefined
}

export interface ProposeTotals {
  proposed: number
  unchanged: number
  prices: number
  images: number
  highRisk: number
}

const EMPTY: ProposeTotals = { proposed: 0, unchanged: 0, prices: 0, images: 0, highRisk: 0 }

/**
 * Compares every source's opinion about one car and records the differences.
 *
 * Grouped by car rather than by record, so agreement between sources is visible.
 * Record-by-record would produce one proposal per source per field and hide the
 * agreement — a reviewer would see three separate "battery is 82.5" rows instead
 * of one row saying three sources agree, and would have no way to tell the
 * difference between consensus and repetition.
 */
export async function proposeForCar(
  car: CarLike,
  records: RecordLike[],
  options: ProposeOptions = {},
): Promise<ProposeTotals> {
  const totals: ProposeTotals = { ...EMPTY }
  if (records.length === 0) return totals

  const { storeProposal, recordPrice, recordImageCandidate } = await import(
    '../src/lib/db/car-review-store'
  )

  const parsed = records.map((record) => ({
    record,
    vehicle: JSON.parse(record.normalised ?? record.raw) as NormalisedVehicle,
  }))

  for (const mapping of FIELD_MAP) {
    const claims: SourceClaim[] = parsed
      .map(({ record, vehicle }) => {
        const value = mapping.from(vehicle)
        return {
          sourceId: record.sourceId,
          role: roleFor(record.sourceId),
          value,
          raw: render(value),
          sourceUrl: record.sourceUrl,
          fetchedAt: record.fetchedAt.toISOString(),
          recordConfidence: record.confidence,
        }
      })
      .filter((claim) => claim.value !== null && claim.value !== undefined)

    if (claims.length === 0) continue

    const comparison = compareField({
      field: mapping.car,
      currentValue: car[mapping.car] ?? null,
      claims,
      category: car.category,
    })

    if (!needsReview(comparison)) {
      totals.unchanged += 1
      continue
    }

    const confidence = scoreComparison(comparison)
    /*
      No `match` is passed here, and that is correct rather than an omission.

      Only records whose matchedCarId is set reach this function, and the runner
      sets that field exclusively on a `confident` decision — so by construction
      every record here already passed the check `assess` would apply. A record
      that matched probably or ambiguously never gets this far; it stays in
      staging for the unmatched lane.
    */
    const risk = assess({ comparison, confidence })
    if (risk.level === 'high-risk') totals.highRisk += 1

    if (options.verbose) {
      console.log(
        `    ${mapping.car.padEnd(18)} ${String(render(comparison.currentValue) ?? '—').padEnd(10)} -> ` +
          `${String(render(comparison.proposedValue) ?? '—').padEnd(10)} ` +
          `${comparison.changeType.padEnd(20)} ${risk.level.padEnd(10)} conf ${confidence.score}`,
      )
    }

    if (options.dry) {
      totals.proposed += 1
      continue
    }

    const winner = records.find((record) => record.sourceId === comparison.winner) ?? records[0]!

    await storeProposal({
      carId: car.id,
      recordId: winner.id,
      sourceId: comparison.winner ?? winner.sourceId,
      runId: options.runId ?? winner.runId,
      field: mapping.car,
      currentValue: render(comparison.currentValue),
      proposedValue: render(comparison.proposedValue),
      rawValue: comparison.proposedRaw,
      unit: comparison.unit,
      changeType: comparison.changeType,
      riskLevel: risk.level,
      confidence: confidence.score,
      confidenceReasons: `${risk.reason} | ${explain(confidence)}`,
      opinions: comparison.claims.map((claim) => ({
        source: claim.sourceId,
        role: claim.role,
        value: render(claim.value),
        raw: claim.raw,
        url: claim.sourceUrl,
        fetchedAt: claim.fetchedAt,
      })),
      validationFlags: comparison.validationFlags,
      sourceUrl: winner.sourceUrl,
      fetchedAt: winner.fetchedAt,
    })

    options.logger?.log({
      runId: options.runId ?? winner.runId,
      sourceId: comparison.winner ?? winner.sourceId,
      carId: car.id,
      operation: 'propose',
      status: 'changed',
      message: `${mapping.car}: ${render(comparison.currentValue) ?? '—'} -> ${render(comparison.proposedValue) ?? '—'} (${risk.level})`,
    })

    totals.proposed += 1
  }

  // ── Price history, which is recorded rather than proposed ──────────
  for (const { record, vehicle } of parsed) {
    if (vehicle.pakistanPrice === null || vehicle.pakistanPrice === undefined) continue
    if (options.dry) {
      totals.prices += 1
      continue
    }
    await recordPrice({
      carId: car.id,
      price: vehicle.pakistanPrice,
      currency: vehicle.priceCurrency ?? 'PKR',
      sourceId: record.sourceId,
      sourceUrl: record.sourceUrl,
      fetchedAt: record.fetchedAt,
      confidence: record.confidence,
    })
    totals.prices += 1
  }

  // ── Image provenance, recorded without fetching anything ──────────
  for (const { record, vehicle } of parsed) {
    const url = (vehicle as { imageUrl?: string | null }).imageUrl
    if (!url) continue
    if (options.dry) {
      totals.images += 1
      continue
    }
    await recordImageCandidate({
      carId: car.id,
      imageUrl: url,
      sourceUrl: record.sourceUrl,
      sourceId: record.sourceId,
      // Null licence is the honest default, and reviewImageCandidate refuses to
      // approve one — an image whose terms nobody recorded is not usable.
      licence: null,
      fetchedAt: record.fetchedAt,
    })
    totals.images += 1
  }

  return totals
}

export function addTotals(a: ProposeTotals, b: ProposeTotals): ProposeTotals {
  return {
    proposed: a.proposed + b.proposed,
    unchanged: a.unchanged + b.unchanged,
    prices: a.prices + b.prices,
    images: a.images + b.images,
    highRisk: a.highRisk + b.highRisk,
  }
}

/** Groups records by the car they matched, so each car is compared once. */
export function groupByCar<T extends { matchedCarId: string | null }>(
  records: T[],
): Map<string, T[]> {
  const byCar = new Map<string, T[]>()
  for (const record of records) {
    if (!record.matchedCarId) continue
    const list = byCar.get(record.matchedCarId) ?? []
    list.push(record)
    byCar.set(record.matchedCarId, list)
  }
  return byCar
}
