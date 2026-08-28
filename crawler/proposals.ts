// crawler/proposals.ts

import { compareField, needsReview, render, type FieldComparison, type SourceClaim } from './compare'
import { scoreComparison, explain, type Confidence } from './confidence'
import {
  matchFromRecord,
  weakerDecision,
  type MatchEvidence,
  type StoredMatchColumns,
} from './match'
import {
  assessIdentity,
  identityFromCar,
  identityFromSource,
  isVariantSensitive,
  type CarRowLike,
  type IdentityAssessment,
} from './identity'
import { assess, type RiskAssessment } from './policy'
import { standardColumnFor, toRangeStandard, type RangeStandard } from './range-standard'
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
  {
    car: 'connectors',
    /*
      `?? []` because `normalised` is JSON text on a row, and a row outlives the
      code that wrote it. A payload stored before this field existed — or by an
      adapter that omitted it — reaches here as undefined, and reading `.length`
      off that threw inside the loop, taking down the whole propose run for every
      car in the batch rather than skipping one field on one record.
    */
    from: (v) => ((v.chargingStandards ?? []).length > 0 ? v.chargingStandards : null),
  },
]

/** The staging row shape this needs — narrower than Prisma's, so tests can build one. */
export interface RecordLike extends StoredMatchColumns {
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

export interface CarLike extends Partial<CarRowLike> {
  id: string
  slug: string
  fullName: string
  category: string
  [column: string]: unknown
}

/**
 * Every distinct variant this source published for the car in one batch.
 *
 * The missing piece. A record is matched on its own, so nothing in the pipeline
 * could see that five Open EV Data records — 61.4 kWh Comfort, 71.8 kWh Comfort,
 * 82.5 kWh RWD Design, 82.5 kWh AWD Excellence and 87 kWh Design — were all
 * claiming the single `byd-seal` row. The field comparison saw five numbers and
 * reported "sources disagree", which was true about the numbers and wrong about
 * the cause: it was one source describing five different cars.
 *
 * Computed over the group so the ambiguity is visible where the decision is made.
 */
export function competingVariants(parsed: ParsedRecord[]): (string | null)[] {
  return parsed.map(({ vehicle }) => vehicle.variant ?? null)
}

export interface ProposeOptions {
  /**
   * Other catalogue rows sharing this car's brand and model.
   *
   * Lets a model-only source record be recognised as ambiguous rather than
   * assigned to whichever row the matcher reached first.
   */
  siblings?: (CarRowLike & { slug: string })[]
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

/** One staging row, with its payload already parsed. */
export interface ParsedRecord {
  record: RecordLike
  vehicle: NormalisedVehicle
}

/** How good the match was for the records behind one proposed field. */
export interface GoverningMatch {
  /** The weakest match among them, or undefined when none recorded one. */
  evidence: MatchEvidence | undefined
  /** True when at least one contributing record recorded no match evidence. */
  unrecorded: boolean
}

/**
 * How good the match was, across every record that contributed to a field.
 *
 * The *weakest* contributor governs, not the winning one. A field can be
 * proposed on the strength of several sources agreeing, and if one of those
 * agreements comes from a record that was only a probable match then the
 * agreement itself is suspect — the corroboration might be about a different
 * car. Taking the best match would let one confidently-matched record launder a
 * roomful of doubtful ones.
 */
export function governingMatch(records: StoredMatchColumns[]): GoverningMatch {
  let evidence: MatchEvidence | undefined
  let unrecorded = false

  for (const record of records) {
    const recorded = matchFromRecord(record)
    if (!recorded) {
      unrecorded = true
      continue
    }
    if (!evidence) {
      evidence = recorded
      continue
    }
    const weakest = weakerDecision(evidence.decision, recorded.decision)
    if (weakest !== evidence.decision) evidence = recorded
  }

  return { evidence, unrecorded }
}

/** Everything decided about one field, before anything is written. */
export interface FieldDecision {
  field: string
  comparison: FieldComparison
  confidence: Confidence
  risk: RiskAssessment
  /** The records that actually published a value for this field. */
  contributors: RecordLike[]
  match: GoverningMatch
  /**
   * Whether the variant was established, and by what.
   *
   * The weakest assessment among the contributing records governs, for the same
   * reason the weakest match does: a field proposed on the strength of several
   * records agreeing is only as trustworthy as the least identified of them.
   */
  identity: IdentityAssessment
  variantSensitive: boolean
  currentRangeStandard: RangeStandard | null
  proposedRangeStandard: RangeStandard | null
}

/**
 * The weakest identity among the records contributing to one field.
 *
 * `mismatch` is worst, then `ambiguous`, then `unproven`, then `proven`. Taking
 * the best would let one well-identified record launder a group of unidentified
 * ones — which is exactly the shape of the byd-seal failure, where a record
 * naming its variant sat beside four others naming different ones.
 */
const VERDICT_RANK = { mismatch: 0, ambiguous: 1, unproven: 2, proven: 3 } as const

export function weakestIdentity(assessments: IdentityAssessment[]): IdentityAssessment {
  if (assessments.length === 0) {
    return {
      tier: 'none',
      verdict: 'unproven',
      reason: 'no record contributed an identity assessment',
      blocksVariantSensitive: true,
      rivals: [],
    }
  }

  return assessments.reduce((worst, candidate) =>
    VERDICT_RANK[candidate.verdict] < VERDICT_RANK[worst.verdict] ? candidate : worst,
  )
}

/**
 * Decides one field: compare, score, and classify.
 *
 * Exported and pure so the tests exercise the same code the pipeline runs.
 * `proposeForCar` below is a loop over this function plus the writes — which
 * means a test asserting that a weak match produces a high-risk row is
 * asserting it about the live path, not about a re-implementation of it that
 * could quietly drift.
 *
 * Returns null when there is nothing to review.
 */
export function decideField(
  car: CarLike,
  mapping: (typeof FIELD_MAP)[number],
  parsed: ParsedRecord[],
  options: { siblings?: (CarRowLike & { slug: string })[] } = {},
): FieldDecision | null {
  const contributors: RecordLike[] = []
  const claims: SourceClaim[] = []
  const identities: IdentityAssessment[] = []

  /*
    Computed once over the whole group, not per contributor.

    The question "are several variants competing for this row?" is a property of
    the batch, and asking it per record would always answer no.
  */
  const competing = competingVariants(parsed)
  const carIdentity = identityFromCar({
    slug: car.slug,
    brand: String(car.brand ?? ''),
    model: String(car.model ?? ''),
    variant: car.variant ?? null,
    trim: car.trim ?? null,
    modelYear: car.modelYear ?? null,
    generation: car.generation ?? null,
  })

  for (const { record, vehicle } of parsed) {
    const value = mapping.from(vehicle)
    if (value === null || value === undefined) continue

    identities.push(
      assessIdentity({
        source: identityFromSource(vehicle),
        car: carIdentity,
        ...(options.siblings ? { siblings: options.siblings.map(identityFromCar) } : {}),
        competingSourceVariants: competing,
      }),
    )

    contributors.push(record)
    claims.push({
      sourceId: record.sourceId,
      recordId: record.id,
      role: roleFor(record.sourceId),
      value,
      raw: render(value),
      sourceUrl: record.sourceUrl,
      fetchedAt: record.fetchedAt.toISOString(),
      recordConfidence: record.confidence,
    })
  }

  if (claims.length === 0) return null

  const comparison = compareField({
    field: mapping.car,
    currentValue: car[mapping.car] ?? null,
    claims,
    category: car.category,
  })

  if (!needsReview(comparison)) return null

  const confidence = scoreComparison(comparison)
  const match = governingMatch(contributors)
  const identity = weakestIdentity(identities)
  const variantSensitive = isVariantSensitive(mapping.car)

  /*
    Test cycles, read from the column that governs this field.

    The catalogue's cycle comes off the Car row; the source's off its payload. Both
    default to `unspecified`, which is the honest reading of a missing value and
    the one that forces a review rather than permitting a swap.
  */
  const standardColumn = standardColumnFor(mapping.car)
  const currentRangeStandard = standardColumn
    ? toRangeStandard(car[standardColumn] as string | null)
    : null
  const proposedRangeStandard = standardColumn
    ? toRangeStandard(
        (parsed.find(({ vehicle }) => mapping.from(vehicle) !== null)?.vehicle as
          | { rangeStandard?: string | null }
          | undefined)?.rangeStandard ?? null,
      )
    : null

  return {
    field: mapping.car,
    comparison,
    confidence,
    risk: assess({
      comparison,
      confidence,
      ...(match.evidence ? { match: match.evidence } : {}),
      matchUnrecorded: match.unrecorded,
      identity,
      ...(currentRangeStandard ? { currentRangeStandard } : {}),
      ...(proposedRangeStandard ? { proposedRangeStandard } : {}),
    }),
    contributors,
    match,
    identity,
    variantSensitive,
    currentRangeStandard,
    proposedRangeStandard,
  }
}

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

  const parsed: ParsedRecord[] = records.map((record) => ({
    record,
    vehicle: JSON.parse(record.normalised ?? record.raw) as NormalisedVehicle,
  }))

  for (const mapping of FIELD_MAP) {
    const decision = decideField(car, mapping, parsed, {
      ...(options.siblings ? { siblings: options.siblings } : {}),
    })

    if (!decision) {
      /*
        Either no source published this field, or every source agrees with the
        catalogue. Only the second is worth counting as "already correct"; a
        field nobody mentioned was never in question.
      */
      if (parsed.some(({ vehicle }) => mapping.from(vehicle) !== null && mapping.from(vehicle) !== undefined)) {
        totals.unchanged += 1
      }
      continue
    }

    const { comparison, confidence, risk } = decision
    if (risk.level === 'high-risk') totals.highRisk += 1

    if (options.verbose) {
      console.log(
        `    ${mapping.car.padEnd(18)} ${String(render(comparison.currentValue) ?? '—').padEnd(10)} -> ` +
          `${String(render(comparison.proposedValue) ?? '—').padEnd(10)} ` +
          `${comparison.changeType.padEnd(20)} ${risk.level.padEnd(10)} conf ${confidence.score}` +
          `${decision.match.evidence && decision.match.evidence.decision !== 'confident' ? `  match ${decision.match.evidence.decision}` : ''}` +
          `${decision.match.unrecorded ? '  match unrecorded' : ''}`,
      )
    }

    if (options.dry) {
      totals.proposed += 1
      continue
    }

    /*
      The record that actually supplied the winning value.

      Matched on record id, not source id. Matching on source id returned the
      FIRST record from the winning source, which is only correct when a source
      contributes one record per car. Open EV Data contributes five for the Seal,
      so the proposal for an 87 kWh value was stamped with the URL, the variant and
      the model year of the 61.4 kWh record — an audit trail pointing at the wrong
      vehicle, which is worse than none because it reads as corroboration.

      The source-id lookup remains as a fallback for claims built before recordId
      existed; the array position fallback remains for the impossible case.
    */
    const winner =
      decision.contributors.find((record) => record.id === comparison.winnerRecordId) ??
      decision.contributors.find((record) => record.sourceId === comparison.winner) ??
      decision.contributors[0]!

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
        /*
          The variant each competing claim describes.

          Without this the opinions list showed five values from "openev" with no
          way to tell what any of them was about — which is exactly what the
          reviewer saw before approving 87 kWh over 61.44.
        */
        variant: variantOf(parsed, claim.recordId ?? ''),
        recordId: claim.recordId ?? null,
      })),
      validationFlags: comparison.validationFlags,
      sourceUrl: winner.sourceUrl,
      fetchedAt: winner.fetchedAt,

      /*
        The variant evidence, stored beside the value.

        So the review screen can show WHICH vehicle a figure describes. The five
        changes that caused Phase 4.1 were approved from a queue that showed the
        numbers and not the trims; "61.4 kWh RWD Comfort" beside "U 87 kWh Design"
        is the one piece of information that would have stopped it.
      */
      variantVerdict: decision.identity.verdict,
      identityTier: decision.identity.tier,
      sourceVariant: variantOf(parsed, winner.id),
      sourceModelYear: modelYearOf(parsed, winner.id),
      variantSensitive: decision.variantSensitive,
      currentRangeStandard: decision.currentRangeStandard,
      proposedRangeStandard: decision.proposedRangeStandard,
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

/** The variant the winning record published, for the proposal row. */
function variantOf(parsed: ParsedRecord[], recordId: string): string | null {
  return parsed.find(({ record }) => record.id === recordId)?.vehicle.variant ?? null
}

/** The model year the winning record published. Never inferred. */
function modelYearOf(parsed: ParsedRecord[], recordId: string): number | null {
  return parsed.find(({ record }) => record.id === recordId)?.vehicle.modelYear ?? null
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
