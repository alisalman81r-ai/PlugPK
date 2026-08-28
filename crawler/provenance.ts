// crawler/provenance.ts
//
// Which source record actually produced a stored value — checked, not trusted.
//
// ── Why this exists ───────────────────────────────────────────────────
//
// `FieldComparison.winner` names a *source*. `FieldComparison.winnerRecordId`
// names the *staging row* the winning value came from, and it was added in Phase
// 4.1 precisely because the first was being used as if it were the second: with
// one source contributing five records for five BYD Seal variants, resolving
// "which record won" through the source id returned the first record from that
// source every time.
//
// crawler/proposals.ts has used `winnerRecordId` since that fix, so proposals
// written from now on carry a true record id. The rows written *before* it do
// not, and they are the problem this module solves. On the byd-seal incident all
// five proposals were stamped `recordId = 16500aa6…`, whose externalId is
// `c2832ebc…` — the `61.4 kWh RWD Comfort` record, holding 61.4 kWh / 370 km /
// 110 kW. The values approved were 87 kWh, 425 km and 140 kW. The stamped
// provenance is not merely unproven, it is contradicted by the record it names.
//
// The audit tool read that stamp, looked up the record, took its variant, and
// concluded the figures came from the declared trim. It reported "0 of 5 approved
// changes cannot be substantiated" about the exact incident the phase was created
// for. A checker that trusts the field it is meant to be checking is worse than
// no checker, because it produces confidence.
//
// ── The rule ──────────────────────────────────────────────────────────
//
// A stored record id is a *claim*. This module confirms or refutes it by asking
// one question: does the record that claim names actually hold the value that was
// proposed? If it does, the record's variant is authoritative and identity can be
// assessed. If it does not, nothing about that variant may be inferred — and in
// particular the change cannot corroborate the catalogue's declared variant.
//
// ── Attribution is reported, never promoted to proof ──────────────────
//
// When a claim is refuted it is still useful to know which record *did* hold the
// value, so the incident can be described. That search runs over the enumerated
// set of records the run matched to this car and compares recorded values — it is
// not inference from the number's magnitude, and it is falsifiable: either
// exactly one record in that set holds the value or it does not.
//
// It is nonetheless kept strictly separate from `trustedVariant`, which stays
// null unless the stored claim was confirmed. Attribution answers "where did this
// come from"; only a confirmed claim answers "may this figure be applied to this
// car". Collapsing the two would rebuild the same false-confidence bug with a
// better search behind it.

import { sameValue } from './compare'
import { emptyVehicle, type NormalisedVehicle } from './model'
import { FIELD_MAP } from './proposals'

/**
 * A record id, distinguished from a source id at the type level.
 *
 * The whole defect was a string that named one thing being used where a string
 * naming another was required, and both are `string`. A brand makes the compiler
 * refuse the substitution, so the mistake cannot be repeated silently — and
 * `asRecordId` refuses it at runtime too, for the ids that arrive from the
 * database as plain text.
 */
export type RecordId = string & { readonly __recordId: unique symbol }

/**
 * Accepts a candidate record id, or refuses it.
 *
 * Returns null when the value is empty, or when it is one of the ids the source
 * registry uses — because a value that names a source is exactly the confusion
 * this module exists to catch, and letting it through as a record id would send
 * the lookup to whichever record happened to be first.
 */
export function asRecordId(
  value: string | null | undefined,
  knownSourceIds: readonly string[] = [],
): RecordId | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (knownSourceIds.some((id) => id.trim().toLowerCase() === trimmed.toLowerCase())) return null
  return trimmed as RecordId
}

/** A staging row, reduced to what provenance needs. Narrow, so tests can build one. */
export interface ProvenanceRecord {
  recordId: string
  externalId: string | null
  /** The variant the record itself states. Null means it stated none. */
  variant: string | null
  /** The record's payload, already parsed. */
  vehicle: NormalisedVehicle
}

/** What the record named by a stored claim turned out to hold. */
export interface ResolvedRecord {
  recordId: string
  externalId: string | null
  variant: string | null
  /** The record's own value for the field under audit. */
  value: unknown
}

export type ProvenanceStatus =
  /** The record the claim names holds the proposed value. Authoritative. */
  | 'confirmed'
  /** It does not. The stored provenance is contradicted by its own record. */
  | 'refuted'
  /** The claim names a record that is no longer in the database. */
  | 'record-missing'
  /** The claim carried a source id, or nothing, where a record id belongs. */
  | 'no-record-id'
  /** The field has no mapping onto a source payload, so nothing can be compared. */
  | 'field-not-comparable'

export type Attribution =
  /** Exactly one record in the candidate set holds the value. */
  | 'unique'
  /** Several do — the value cannot be traced to one record. */
  | 'ambiguous'
  /** None does. */
  | 'none'
  | 'not-comparable'

export interface ProvenanceResolution {
  status: ProvenanceStatus
  /** The record the stored claim names, if it exists. Never a source. */
  claimed: ResolvedRecord | null
  /** Records that actually hold the proposed value. Reporting only. */
  holders: ResolvedRecord[]
  /** Whether one *record* holds the value. */
  attribution: Attribution
  /**
   * Whether one *vehicle* holds it, which is the question that matters.
   *
   * A daily crawl stores a fresh row per run, so the live database holds three
   * copies of each of the five Seal records. Attribution by record therefore
   * reports "3 records" for a figure that belongs unambiguously to one trim, and
   * `attribution: 'ambiguous'` would understate what is actually known.
   *
   * Collapsing the holders by the variant they state separates the two: several
   * rows describing one vehicle is a unique vehicle attribution; rows describing
   * different vehicles is genuinely ambiguous. Neither is proof of anything —
   * `trustedVariant` is still the only field a caller may act on.
   */
  vehicleAttribution: 'unique-vehicle' | 'ambiguous' | 'none' | 'not-comparable'
  /** The distinct variants among the holders, in first-seen order. */
  holderVariants: (string | null)[]
  /**
   * The variant that may be used to assess identity.
   *
   * Non-null only when `status === 'confirmed'`. Any other status means the
   * figure's origin is unestablished, and an identity verdict computed from a
   * guess would be the original bug wearing a different hat.
   */
  trustedVariant: string | null
  /** True only for `confirmed`. Callers should gate every identity claim on it. */
  trustworthy: boolean
  reason: string
}

/** The FIELD_MAP entry for a catalogue column, or null when it has none. */
export function mappingFor(field: string): (typeof FIELD_MAP)[number] | null {
  return FIELD_MAP.find((entry) => entry.car === field) ?? null
}

/**
 * The value a record offers for a catalogue column.
 *
 * Read through FIELD_MAP, which is what crawler/proposals.ts used to build the
 * proposal in the first place — so the comparison is against the same reading of
 * the same payload, including the kW→hp conversion on power and the empty-array
 * handling on connectors. Re-deriving that here would be a second implementation
 * to keep in step.
 */
export function recordValueFor(field: string, vehicle: NormalisedVehicle): unknown {
  const mapping = mappingFor(field)
  return mapping ? mapping.from(vehicle) : null
}

/**
 * A stored proposal value, parsed back to the shape the payload holds.
 *
 * Proposals persist `proposedValue` as text. Comparing that text to a payload
 * number would fail on "87" vs 87, and on connectors — stored as "Type 2, CCS2"
 * against an array — so each is parsed by the shape its field uses. Anything
 * unparseable comes back as the original string, which then simply fails to
 * match; a bad parse must not read as a confirmation.
 */
export function parseStoredValue(field: string, stored: string | null | undefined): unknown {
  if (stored === null || stored === undefined) return null
  const text = stored.trim()
  if (text.length === 0) return null

  if (field === 'connectors') {
    const parts = text
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
    return parts.length > 0 ? parts : null
  }

  const asNumber = Number(text)
  return Number.isFinite(asNumber) ? asNumber : text
}

export interface ResolveProvenanceInput {
  field: string
  /** The value the proposal recorded, as stored. */
  proposedValue: string | null
  /** The record id the proposal carries. Pass through asRecordId first. */
  claimedRecordId: RecordId | null
  /** Every record the run matched to this car — the candidate set. */
  candidates: ProvenanceRecord[]
}

function resolve(record: ProvenanceRecord, field: string): ResolvedRecord {
  return {
    recordId: record.recordId,
    externalId: record.externalId,
    variant: record.variant,
    value: recordValueFor(field, record.vehicle),
  }
}

/**
 * Confirm or refute a stored provenance claim, and describe what was found.
 *
 * Pure. Takes the records rather than reading them, so the awkward cases — a
 * claim naming a source, a record that has since gone, five records holding the
 * same value — are all reachable from a fixture.
 */
export function resolveProvenance(input: ResolveProvenanceInput): ProvenanceResolution {
  const { field, proposedValue, claimedRecordId, candidates } = input

  const mapping = mappingFor(field)
  const resolvedCandidates = candidates.map((record) => resolve(record, field))
  const claimed =
    claimedRecordId === null
      ? null
      : (resolvedCandidates.find((record) => record.recordId === claimedRecordId) ?? null)

  if (mapping === null) {
    return {
      status: 'field-not-comparable',
      claimed,
      holders: [],
      attribution: 'not-comparable',
      vehicleAttribution: 'not-comparable',
      holderVariants: [],
      trustedVariant: null,
      trustworthy: false,
      reason: `"${field}" has no mapping onto a source payload, so the stored provenance cannot be checked against a value`,
    }
  }

  const wanted = parseStoredValue(field, proposedValue)
  const holders = resolvedCandidates.filter((record) => sameValue(record.value, wanted))
  const attribution: Attribution =
    holders.length === 1 ? 'unique' : holders.length > 1 ? 'ambiguous' : 'none'

  const holderVariants = [...new Set(holders.map((record) => record.variant))]
  const vehicleAttribution: ProvenanceResolution['vehicleAttribution'] =
    holderVariants.length === 1
      ? 'unique-vehicle'
      : holderVariants.length > 1
        ? 'ambiguous'
        : 'none'

  if (claimedRecordId === null) {
    return {
      status: 'no-record-id',
      claimed: null,
      holders,
      attribution,
      vehicleAttribution,
      holderVariants,
      trustedVariant: null,
      trustworthy: false,
      reason:
        'the proposal carries no usable record id: a source id names a provider, ' +
        'not one of its records, so it cannot say which vehicle a figure describes',
    }
  }

  if (claimed === null) {
    return {
      status: 'record-missing',
      claimed: null,
      holders,
      attribution,
      vehicleAttribution,
      holderVariants,
      trustedVariant: null,
      trustworthy: false,
      reason: `the record this proposal names (${claimedRecordId}) is not among the records matched to this car, so its variant cannot be read`,
    }
  }

  if (sameValue(claimed.value, wanted)) {
    return {
      status: 'confirmed',
      claimed,
      holders,
      attribution,
      vehicleAttribution,
      holderVariants,
      trustedVariant: claimed.variant,
      trustworthy: true,
      reason: `the record named by the proposal holds this value (${describe(claimed.value)}), so its variant is authoritative for this figure`,
    }
  }

  return {
    status: 'refuted',
    claimed,
    holders,
    attribution,
    vehicleAttribution,
    holderVariants,
    trustedVariant: null,
    trustworthy: false,
    reason:
      `the record named by the proposal holds ${describe(claimed.value)}, not the ${describe(wanted)} that was proposed — ` +
      `so the stored provenance is contradicted by its own record and nothing about its variant may be inferred`,
  }
}

/** Compact rendering for a reason string. */
function describe(value: unknown): string {
  if (value === null || value === undefined) return 'nothing'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/**
 * A payload parsed off a staging row, filled onto the vehicle shape.
 *
 * The provenance argument is what emptyVehicle requires and is overwritten by
 * the payload wherever the payload carries it; a row whose payload is missing or
 * unreadable comes back as an all-null vehicle, which reads every field as "not
 * published" and so refutes rather than confirms.
 */
export function vehicleFromPayload(
  payload: unknown,
  provenance: { source: string; sourceUrl: string; externalId?: string | null },
): NormalisedVehicle {
  const base = emptyVehicle({ ...provenance, extractionMethod: 'dataset' })
  if (payload === null || typeof payload !== 'object') return base
  return { ...base, ...(payload as Partial<NormalisedVehicle>) }
}
