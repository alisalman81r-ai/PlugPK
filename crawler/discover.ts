// crawler/discover.ts

import type { MatchResult } from './match'
import type { NormalisedVehicle } from './model'

/**
 * Deciding what to do with a record that did not match a car.
 *
 * A source describing a car the catalogue does not have is the most valuable
 * thing a crawl finds and the most dangerous thing to act on. Valuable, because
 * it is how the catalogue keeps up with a market that adds a model a month.
 * Dangerous, because "no match" and "a car we do not have" are not the same
 * statement — the far more common cause is that the matcher failed on a name it
 * should have recognised, and acting on that adds a second copy of a car that is
 * already there.
 *
 * So nothing here creates a Car. It classifies, records, and hands the judgement
 * to a person, with the near-miss attached so that person is deciding between
 * two named cars rather than guessing.
 */

export type Verdict =
  /** Matched a car; not a discovery at all. */
  | 'matched'
  /** Plausibly new, with nothing in the catalogue close to it. */
  | 'new'
  /** Plausibly new, but something in the catalogue is close enough to check. */
  | 'possible-duplicate'
  /** Too little identity to record: no brand, or no model. */
  | 'unusable'

export interface DiscoveryInput {
  vehicle: NormalisedVehicle
  match: MatchResult
}

export interface Discovery {
  verdict: Verdict
  reason: string
  /** The car this might already be, when there is one. */
  possibleDuplicateOf: string | null
  duplicateReason: string | null
  matchScore: number | null
  /**
   * 0–100, and deliberately modest.
   *
   * This is confidence that the record describes a real, distinct car worth
   * adding — not confidence in its specifications. It never reaches a level that
   * would justify skipping review, because there is no level at which a crawler
   * should be inventing catalogue entries.
   */
  confidence: number
}

/**
 * How close a rejected match has to be before it is worth flagging.
 *
 * Below this, showing the reviewer a "possible duplicate" would be noise: every
 * unmatched Chinese SUV shares a brand with something, and a reviewer who is
 * shown five bad suggestions stops reading the sixth, which is the real one.
 */
const DUPLICATE_FLOOR = 45

/** Enough identity to be worth a row at all. */
function hasIdentity(vehicle: NormalisedVehicle): boolean {
  return Boolean(vehicle.brand?.trim()) && Boolean(vehicle.model?.trim())
}

export function classify(input: DiscoveryInput): Discovery {
  const { vehicle, match } = input

  /*
    A confident match is not a discovery, and neither is a probable one.

    `probable` is deliberately treated as matched here even though the proposal
    pipeline will not auto-apply its fields. The two decisions answer different
    questions: "should this figure change the catalogue" (no, not on a probable
    match) versus "is this a car we are missing" (also no — we probably have it,
    spelled differently). Raising a candidate for a probable match would mean
    every naming variant of an existing car arriving as a proposed new car.
  */
  if (match.decision === 'confident' || match.decision === 'probable') {
    return {
      verdict: 'matched',
      reason: `${match.decision} match for ${match.best?.car.slug ?? 'a catalogue car'}`,
      possibleDuplicateOf: match.best?.car.slug ?? null,
      duplicateReason: null,
      matchScore: match.best?.score ?? null,
      confidence: 0,
    }
  }

  if (!hasIdentity(vehicle)) {
    return {
      verdict: 'unusable',
      reason: 'no brand or no model, so there is nothing to identify a car by',
      possibleDuplicateOf: null,
      duplicateReason: null,
      matchScore: null,
      confidence: 0,
    }
  }

  /*
    Ambiguous means several cars fit equally well.

    This is the case most likely to be a duplicate rather than a discovery: the
    record looks like more than one car we already have, which usually means it
    is one of them under a name the matcher could not split. The first rival is
    named so the reviewer starts from a real comparison.
  */
  if (match.decision === 'ambiguous') {
    const rivals = match.candidates.slice(0, 3).map((candidate) => candidate.car.slug)
    return {
      verdict: 'possible-duplicate',
      reason: `matched ${match.candidates.length} catalogue cars equally well`,
      possibleDuplicateOf: match.candidates[0]?.car.slug ?? null,
      duplicateReason: `equally close to ${rivals.join(', ')} — one of them is probably this car`,
      matchScore: match.candidates[0]?.score ?? null,
      confidence: 10,
    }
  }

  // ── decision === 'none' ───────────────────────────────────────────
  const near = match.candidates.find((candidate) => candidate.score >= DUPLICATE_FLOOR)

  if (near) {
    return {
      verdict: 'possible-duplicate',
      reason: 'nothing matched well enough to accept, but one car came close',
      possibleDuplicateOf: near.car.slug,
      duplicateReason: `${near.score}/100 against ${near.car.fullName} via ${near.strategy}: ${near.reason}`,
      matchScore: near.score,
      confidence: 25,
    }
  }

  /*
    A guard-blocked candidate is a near miss of a specific and telling kind.

    The model-number guard blocks "Sealion 7" from matching "Sealion 6" — the
    names are one character apart and the cars are different. When that fires, the
    record is very likely a genuinely new car in a family we already carry, which
    is worth saying out loud rather than presenting as an unexplained blank.
  */
  const blocked = match.blocked[0]
  if (blocked) {
    return {
      verdict: 'new',
      reason: 'a new variant in a family the catalogue already carries',
      possibleDuplicateOf: blocked.car.slug,
      duplicateReason: `related to ${blocked.car.fullName} but rejected: ${blocked.reason}`,
      matchScore: null,
      confidence: 55,
    }
  }

  return {
    verdict: 'new',
    reason: 'no catalogue car resembles this record',
    possibleDuplicateOf: null,
    duplicateReason: null,
    matchScore: null,
    /*
      Capped well below anything that reads as certainty.

      Even a clean miss is only evidence that our matcher found nothing — the
      catalogue holds thirty-six cars and a global dataset holds hundreds, so most
      clean misses are cars we have deliberately not listed because they are not
      sold in Pakistan. That is a judgement about the market, and no score
      substitutes for it.
    */
    confidence: 60,
  }
}

/** Whether a verdict should be written to CarCandidate at all. */
export function isCandidate(verdict: Verdict): boolean {
  return verdict === 'new' || verdict === 'possible-duplicate'
}

/**
 * The identity a candidate is stored under.
 *
 * Matches the unique constraint on CarCandidate, so a daily crawl re-seeing the
 * same unmatched car updates one row instead of stacking a new one every
 * morning. Without this, a source with fifty cars we do not carry would add
 * fifty rows a day and the review queue would be unusable inside a week.
 */
export function candidateKey(vehicle: NormalisedVehicle): {
  brand: string
  model: string
  variant: string | null
  modelYear: number | null
} {
  return {
    brand: (vehicle.brand ?? '').trim(),
    model: (vehicle.model ?? '').trim(),
    variant: vehicle.variant?.trim() || null,
    modelYear: vehicle.modelYear ?? null,
  }
}
