// crawler/compare.ts

import { FIELD_UNITS } from './units'
import { trustFor, type SourceRole } from './priority-config'
import { isUsable, validateCrossField, validateField, type ValidationFlag } from './validate'

/**
 * Comparing what sources say against what the catalogue holds, field by field.
 *
 * Produces proposals. It writes nothing, decides nothing, and applies nothing —
 * every output is a row for a person to accept or refuse.
 *
 * ── The rule this file exists to enforce ──────────────────────────────
 *
 * A newer value does not win by being newer. That is the single most damaging
 * default a pipeline like this can have: it turns every re-crawl into an
 * unreviewed edit, and a source that briefly publishes a wrong figure
 * permanently overwrites a correct one. Recency is one input to confidence, never
 * a licence to replace.
 *
 * Nor does the highest-trust source win by itself. It wins the *proposal* — what
 * gets shown first — while every other claim travels with it, so a reviewer sees
 * that two sources disagreed rather than only the winner.
 */

export type ChangeType =
  /** The catalogue has nothing; a source does. */
  | 'new'
  /** Both have a value and they differ. */
  | 'changed'
  /** Both have the same value. Recorded, not proposed. */
  | 'unchanged'
  /** The catalogue has a value; no source published one. */
  | 'missing'
  /** Sources disagree with each other, regardless of the catalogue. */
  | 'conflicting'
  /** A value that failed validation. */
  | 'suspicious'
  /** A source's unit could not be established, so the number is unusable. */
  | 'unit-mismatch'
  /** Sources agree with each other but all differ from the catalogue. */
  | 'source-disagreement'

export interface SourceClaim {
  sourceId: string
  role: SourceRole
  /** The value after unit normalisation. */
  value: unknown
  /** Exactly what the source published. */
  raw: string | null
  /** Set when a conversion happened, naming both ends. */
  conversion?: string | undefined
  sourceUrl: string
  fetchedAt: string
  /** The source's own confidence in its record, 0–100. */
  recordConfidence: number
}

export interface FieldComparison {
  field: string
  /** What Car holds today. */
  currentValue: unknown
  /** What is being proposed, or null when nothing usable was offered. */
  proposedValue: unknown
  proposedRaw: string | null
  unit: string | null
  changeType: ChangeType
  /** Every claim, strongest first, including the ones that lost. */
  claims: SourceClaim[]
  /** Which source the proposal came from. */
  winner: string | null
  /** True when sources contradicted each other. */
  conflicting: boolean
  validationFlags: ValidationFlag[]
  /** Human-readable summary of why this row exists. */
  reason: string
}

/** Two values, compared as claims rather than as bytes. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined
  if (b === null || b === undefined) return false

  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return true
    /*
      One percent, and the reason is rounding rather than tolerance for error.
      Sources publish 77.4 and 77 for the same battery; treating that as a change
      would fill the queue with noise and bury the real differences. At 1%, 400
      and 450 km still differ, which they must.
    */
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

/** Rendered for storage and for a reviewer to read. */
export function render(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : null
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

export interface CompareInput {
  field: string
  currentValue: unknown
  claims: SourceClaim[]
  /** The car's powertrain, for the cross-field rules. */
  category?: string | null
}

/**
 * Compares one field.
 *
 * Ordering is by role trust for this specific field, then by the source's own
 * confidence. Claims that fail validation as impossible are excluded from
 * winning but kept in the list — the evidence that a source is broken is worth
 * more than a tidy queue.
 */
export function compareField(input: CompareInput): FieldComparison {
  const { field, currentValue, category } = input
  const unit = FIELD_UNITS[field]?.unit ?? null

  const ranked = [...input.claims].sort(
    (a, b) =>
      trustFor(b.role, field) - trustFor(a.role, field) ||
      b.recordConfidence - a.recordConfidence,
  )

  // Anything a role has no business claiming is dropped before it can win.
  const eligible = ranked.filter((claim) => trustFor(claim.role, field) > 0)

  const flagsFor = (claim: SourceClaim): ValidationFlag[] => [
    ...validateField(field, claim.value),
    ...validateCrossField({ category, [field]: claim.value } as never),
  ]

  const usable = eligible.filter((claim) => isUsable(flagsFor(claim)) && claim.value !== null)

  // ── Nothing usable was offered ────────────────────────────────────
  if (usable.length === 0) {
    const rejected = eligible.filter((claim) => claim.value !== null)
    const unitProblem = eligible.some((claim) => claim.value === null && claim.raw !== null)

    if (rejected.length > 0) {
      const flags = rejected.flatMap(flagsFor)
      return {
        field,
        currentValue,
        proposedValue: null,
        proposedRaw: rejected[0]?.raw ?? null,
        unit,
        changeType: 'suspicious',
        claims: ranked,
        winner: null,
        conflicting: false,
        validationFlags: flags,
        reason: `every claim failed validation: ${flags.map((flag) => flag.message).join('; ')}`,
      }
    }

    if (unitProblem) {
      return {
        field,
        currentValue,
        proposedValue: null,
        proposedRaw: eligible.find((claim) => claim.raw !== null)?.raw ?? null,
        unit,
        changeType: 'unit-mismatch',
        claims: ranked,
        winner: null,
        conflicting: false,
        validationFlags: [],
        reason: 'a source published a figure whose unit could not be established, so it was not converted',
      }
    }

    return {
      field,
      currentValue,
      proposedValue: null,
      proposedRaw: null,
      unit,
      changeType: 'missing',
      claims: ranked,
      winner: null,
      conflicting: false,
      validationFlags: [],
      reason:
        currentValue === null
          ? 'neither the catalogue nor any source has this figure'
          : 'the catalogue has this figure and no source published one — nothing to do, and it is NOT cleared',
    }
  }

  const best = usable[0]!
  const disagreeing = usable.filter((claim) => !sameValue(claim.value, best.value))
  const conflicting = disagreeing.length > 0
  const flags = flagsFor(best)

  const matchesCurrent = sameValue(currentValue, best.value)

  let changeType: ChangeType
  let reason: string

  if (conflicting) {
    changeType = 'conflicting'
    reason = `sources disagree: ${usable
      .map((claim) => `${claim.sourceId}=${render(claim.value)} (trust ${trustFor(claim.role, field)})`)
      .join(' vs ')}`
  } else if (matchesCurrent) {
    changeType = 'unchanged'
    reason = `${usable.length} source(s) confirm the current value`
  } else if (currentValue === null || currentValue === undefined) {
    changeType = 'new'
    reason = `the catalogue has no value; ${best.sourceId} publishes ${render(best.value)}`
  } else if (usable.length > 1) {
    changeType = 'source-disagreement'
    reason = `${usable.length} sources agree on ${render(best.value)}, which differs from the catalogue's ${render(currentValue)}`
  } else {
    changeType = 'changed'
    reason = `${best.sourceId} publishes ${render(best.value)} where the catalogue has ${render(currentValue)}`
  }

  if (flags.length > 0 && changeType !== 'unchanged') {
    reason += ` — flagged: ${flags.map((flag) => flag.message).join('; ')}`
  }

  return {
    field,
    currentValue,
    proposedValue: best.value,
    proposedRaw: best.raw,
    unit,
    changeType,
    claims: ranked,
    winner: best.sourceId,
    conflicting,
    validationFlags: flags,
    reason,
  }
}

/** Whether a comparison is worth an operator's attention. */
export function needsReview(comparison: FieldComparison): boolean {
  return comparison.changeType !== 'unchanged' && comparison.changeType !== 'missing'
}
