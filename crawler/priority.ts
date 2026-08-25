// crawler/priority.ts

import type { NormalisedVehicle, VehicleField } from './model'
import { VEHICLE_FIELDS } from './model'
import type { SourceAdapter } from './sources/types'

/**
 * Reconciling several sources that describe the same car.
 *
 * ── Priority is per field, never per source ───────────────────────────
 *
 * No source is right about everything. A global EV dataset is the best authority
 * on usable battery capacity and has no opinion at all about a Pakistani price;
 * a local marketplace is the reverse. Ranking sources as wholes would mean
 * accepting the global dataset's silence over the local source's real figure, or
 * the local source's guess at a battery chemistry over the specialist's
 * measurement.
 *
 * So each adapter declares `defaultTrust` plus a `fieldTrust` map, and every
 * field is decided on its own.
 *
 * ── What this does NOT do ─────────────────────────────────────────────
 *
 * It does not overwrite anything, and it does not choose on the operator's
 * behalf when sources genuinely disagree. Its output is a proposal plus a list
 * of conflicts. Disagreement is information — two sources quoting different
 * prices usually means one is ex-factory and the other on-road, which is worth
 * knowing rather than averaging away.
 */

export interface FieldOpinion {
  source: string
  value: unknown
  trust: number
  confidence: number
  sourceUrl: string
  fetchedAt: string
}

export interface FieldResolution {
  field: VehicleField
  /** The winning value, or null when nobody published one. */
  value: unknown
  /** The source it came from, or null. */
  winner: string | null
  /** True when sources published different, non-equal values. */
  conflicting: boolean
  /** Every opinion, strongest first — including the losing ones. */
  opinions: FieldOpinion[]
  /** 0–100: how much to believe the winner, given the disagreement. */
  confidence: number
}

export interface Reconciliation {
  /** The merged view. A proposal for review, never applied automatically. */
  merged: Partial<Record<VehicleField, unknown>>
  /** Every field, including the uncontested and the empty. */
  fields: FieldResolution[]
  /** Only the fields where sources disagreed. */
  conflicts: FieldResolution[]
  /** Overall 0–100, dragged down by each conflict. */
  confidence: number
}

/** The trust a source claims over one field. */
export function trustFor(adapter: SourceAdapter, field: VehicleField): number {
  const specific = adapter.fieldTrust?.[field]
  return typeof specific === 'number' ? specific : adapter.defaultTrust
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

/**
 * Are two values the same claim?
 *
 * Numbers are compared with a small tolerance, because sources round: 77.4 kWh
 * and 77 kWh are the same battery reported to different precision, and treating
 * that as a conflict would bury the real disagreements in noise. One percent is
 * narrow enough that 400 km and 450 km still conflict, which they should.
 */
function sameClaim(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return true
    const scale = Math.max(Math.abs(a), Math.abs(b))
    return scale > 0 && Math.abs(a - b) / scale <= 0.01
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const left = [...a].map(String).sort()
    const right = [...b].map(String).sort()
    return left.length === right.length && left.every((entry, index) => entry === right[index])
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLowerCase() === b.trim().toLowerCase()
  }

  return a === b
}

export interface SourcedVehicle {
  vehicle: NormalisedVehicle
  adapter: SourceAdapter
}

/**
 * Reconciles several sources' views of one car.
 *
 * Pure. Takes the records and the adapters that produced them, returns a
 * proposal — no database, no writes, no side effects.
 */
export function reconcile(inputs: SourcedVehicle[]): Reconciliation {
  const fields: FieldResolution[] = []

  for (const field of VEHICLE_FIELDS) {
    const opinions: FieldOpinion[] = inputs
      .filter(({ vehicle }) => !isEmpty(vehicle[field]))
      .map(({ vehicle, adapter }) => ({
        source: adapter.id,
        value: vehicle[field],
        /*
          A source with zero trust on a field is excluded entirely, not merely
          ranked last. Zero is how an adapter says "I have no business having an
          opinion here" — Open EV Data on a Pakistani price — and letting such a
          value win by default would be worse than having no value.
        */
        trust: trustFor(adapter, field),
        confidence: vehicle.confidence,
        sourceUrl: vehicle.sourceUrl,
        fetchedAt: vehicle.fetchedAt,
      }))
      .filter((opinion) => opinion.trust > 0)
      // Trust decides; the source's own confidence breaks ties.
      .sort((a, b) => b.trust - a.trust || b.confidence - a.confidence)

    if (opinions.length === 0) {
      fields.push({ field, value: null, winner: null, conflicting: false, opinions: [], confidence: 0 })
      continue
    }

    const best = opinions[0]!
    const disagreeing = opinions.filter((opinion) => !sameClaim(opinion.value, best.value))
    const conflicting = disagreeing.length > 0

    /*
      Confidence starts at the winner's trust and is cut hard by disagreement.

      A field two sources agree on is worth more than the same field from one
      source; a field they contradict is worth markedly less than either claimed
      alone, because at least one of them is wrong and we do not know which.
    */
    let confidence = best.trust
    if (conflicting) {
      confidence = Math.round(confidence * 0.5)
    } else if (opinions.length > 1) {
      confidence = Math.min(100, confidence + 5 * (opinions.length - 1))
    }

    fields.push({ field, value: best.value, winner: best.source, conflicting, opinions, confidence })
  }

  const merged: Partial<Record<VehicleField, unknown>> = {}
  for (const resolution of fields) {
    if (resolution.value !== null) merged[resolution.field] = resolution.value
  }

  const populated = fields.filter((entry) => entry.value !== null)
  const conflicts = fields.filter((entry) => entry.conflicting)

  const confidence =
    populated.length === 0
      ? 0
      : Math.round(populated.reduce((total, entry) => total + entry.confidence, 0) / populated.length)

  return { merged, fields, conflicts, confidence }
}

/** A one-line summary of a conflict, for a report or a review screen. */
export function describeConflict(resolution: FieldResolution): string {
  const claims = resolution.opinions
    .map((opinion) => `${opinion.source}=${JSON.stringify(opinion.value)} (trust ${opinion.trust})`)
    .join(' vs ')
  return `${resolution.field}: ${claims} → taking ${resolution.winner}, confidence ${resolution.confidence}`
}
