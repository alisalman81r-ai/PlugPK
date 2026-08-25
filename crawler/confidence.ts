// crawler/confidence.ts

import type { FieldComparison } from './compare'
import { trustFor } from './priority-config'

/**
 * How much to believe a proposed value, and why.
 *
 * ── Transparent by construction ───────────────────────────────────────
 *
 * Every score comes back with the list of adjustments that produced it. A bare
 * number invites an operator either to trust it blindly or to ignore it, and both
 * are worse than showing the arithmetic: "82, because the top source is a
 * specialist on this field (+), three sources agree (+), the newest reading is
 * eleven months old (−)" is something a person can argue with.
 *
 * ── No fake certainty ─────────────────────────────────────────────────
 *
 * 100 is unreachable from crawled data. The ceiling for an automated proposal is
 * 95, and only a manual entry — a person who checked — can exceed it. A pipeline
 * that can print "100% confident" about a scraped price will eventually print it
 * about a wrong one.
 */

export interface ConfidenceReason {
  /** Positive or negative points. */
  delta: number
  reason: string
}

export interface Confidence {
  /** 0–100. */
  score: number
  reasons: ConfidenceReason[]
  /** high | medium | low, for a queue that a person reads at a glance. */
  band: 'high' | 'medium' | 'low'
}

/** The most an automated proposal may claim. A person can go higher. */
const AUTOMATED_CEILING = 95

/** Above this many days, a reading starts losing credit. */
const FRESH_DAYS = 90
/** Beyond this, it is stale enough to say so. */
const STALE_DAYS = 365

function daysSince(iso: string): number | null {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return null
  return Math.max(0, Math.round((Date.now() - then) / 86_400_000))
}

/**
 * Scores one field comparison.
 *
 * The base is the winning source's trust *for this field*, not its overall rank —
 * the same source can be authoritative about a battery and worthless about a
 * price, and a single global rank would smear the two together.
 */
export function scoreComparison(comparison: FieldComparison): Confidence {
  const reasons: ConfidenceReason[] = []

  const winner = comparison.claims.find((claim) => claim.sourceId === comparison.winner)
  if (!winner || comparison.proposedValue === null) {
    return {
      score: 0,
      reasons: [{ delta: 0, reason: 'no usable value was proposed' }],
      band: 'low',
    }
  }

  const base = trustFor(winner.role, comparison.field)
  let score = base
  reasons.push({
    delta: base,
    reason: `base: a ${winner.role} source, which this configuration trusts at ${base} for ${comparison.field}`,
  })

  // ── Agreement ─────────────────────────────────────────────────────
  const agreeing = comparison.claims.filter(
    (claim) =>
      claim.value !== null &&
      trustFor(claim.role, comparison.field) > 0 &&
      claim.sourceId !== winner.sourceId &&
      !comparison.conflicting,
  ).length

  if (agreeing > 0) {
    /*
      Six points per corroborating source, capped at eighteen.

      Uncapped, five mediocre aggregators copying each other would outrank a
      manufacturer's own figure — and on the open web that is exactly what
      happens, because they copy from the same place. Agreement is evidence, but
      weak evidence, and it must not be able to overturn authority.
    */
    const bonus = Math.min(18, agreeing * 6)
    score += bonus
    reasons.push({
      delta: bonus,
      reason: `${agreeing} other source(s) publish the same value`,
    })
  }

  // ── Disagreement ──────────────────────────────────────────────────
  if (comparison.conflicting) {
    const others = comparison.claims.filter(
      (claim) => claim.value !== null && claim.sourceId !== winner.sourceId,
    ).length
    const penalty = -Math.min(40, 20 + others * 5)
    score += penalty
    reasons.push({
      delta: penalty,
      reason: `sources contradict each other, so at least one is wrong and it is not known which`,
    })
  }

  // ── Freshness ─────────────────────────────────────────────────────
  const age = daysSince(winner.fetchedAt)
  if (age === null) {
    score -= 5
    reasons.push({ delta: -5, reason: 'the reading has no usable timestamp' })
  } else if (age > STALE_DAYS) {
    score -= 20
    reasons.push({ delta: -20, reason: `the reading is ${age} days old` })
  } else if (age > FRESH_DAYS) {
    const penalty = -Math.round(((age - FRESH_DAYS) / (STALE_DAYS - FRESH_DAYS)) * 15)
    score += penalty
    reasons.push({ delta: penalty, reason: `the reading is ${age} days old` })
  } else {
    reasons.push({ delta: 0, reason: `the reading is ${age} days old, which counts as current` })
  }

  // ── Official provenance ───────────────────────────────────────────
  if (winner.role === 'manufacturer' || winner.role === 'pk-distributor') {
    score += 5
    reasons.push({ delta: 5, reason: 'the value comes from an official source rather than an aggregator' })
  }

  // ── Validation ────────────────────────────────────────────────────
  const impossible = comparison.validationFlags.filter((flag) => flag.severity === 'impossible')
  const implausible = comparison.validationFlags.filter((flag) => flag.severity === 'implausible')

  if (impossible.length > 0) {
    /*
      Floored, not merely penalised. A value that cannot be true has no
      confidence, whatever else agrees with it, and letting corroboration lift it
      back into the "probably fine" band is how a systematic parsing error gets
      approved in bulk.
    */
    reasons.push({
      delta: -score,
      reason: `fails validation: ${impossible.map((flag) => flag.message).join('; ')}`,
    })
    return { score: 0, reasons, band: 'low' }
  }

  if (implausible.length > 0) {
    score -= 25
    reasons.push({
      delta: -25,
      reason: `implausible: ${implausible.map((flag) => flag.message).join('; ')}`,
    })
  }

  // ── How the value was obtained ────────────────────────────────────
  if (winner.conversion) {
    score -= 3
    reasons.push({ delta: -3, reason: `unit converted (${winner.conversion}), so a source mistake is possible` })
  }

  const ceiling = winner.role === 'manual' ? 100 : AUTOMATED_CEILING
  const final = Math.max(0, Math.min(ceiling, Math.round(score)))

  if (final !== Math.round(score)) {
    reasons.push({
      delta: final - Math.round(score),
      reason:
        winner.role === 'manual'
          ? 'clamped to the 0–100 range'
          : `capped at ${AUTOMATED_CEILING}: crawled data does not reach certainty`,
    })
  }

  return {
    score: final,
    reasons,
    band: final >= 80 ? 'high' : final >= 55 ? 'medium' : 'low',
  }
}

/** One line an operator can read without expanding anything. */
export function explain(confidence: Confidence): string {
  return confidence.reasons
    .filter((reason) => reason.delta !== 0)
    .map((reason) => `${reason.delta > 0 ? '+' : ''}${reason.delta} ${reason.reason}`)
    .join('; ')
}
