// crawler/discover.ts

import { isOutOfMarket, marketBrandKey } from './market'
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
  /**
   * A real car, correctly read, from a brand this catalogue does not cover.
   *
   * Separate from 'unusable' on purpose. Unusable means we could not read the
   * record; this means we read it fine and it is not our market. Keeping them
   * apart is what lets an extraction failure stay visible instead of being
   * filed under a market decision. See crawler/market.ts.
   */
  | 'out-of-market'

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
    Market scope, checked after identity and before anything else.

    After, because a record with no brand cannot be judged on brand and is an
    extraction failure rather than a scope decision — hasIdentity above owns
    that case. Before everything else, because a Porsche is out of scope
    whatever the matcher went on to think of it, and running the near-miss and
    duplicate reasoning first would only produce a comparison nobody will read.

    This is what stops a live run raising ~1,303 candidates from a global
    dataset against a 36-car Pakistani catalogue. The record still gets a stated
    reason, so an excluded brand can be found and reconsidered later; nothing is
    deleted and nothing is dropped in silence.
  */
  if (isOutOfMarket(vehicle.brand)) {
    return {
      verdict: 'out-of-market',
      reason: `${vehicle.brand} is outside the catalogue's market scope — not currently listed for Pakistan`,
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
    A guard-blocked candidate is a near miss of a specific and telling kind —
    but only when the block was against the SAME brand.

    The model-number guard blocks "Sealion 7" from matching "Sealion 6": the
    names are one character apart, the cars are different, and the record is
    very likely a genuinely new car in a family we already carry. That is worth
    saying out loud rather than presenting as an unexplained blank.

    This used to read `match.blocked[0]` — the first blocked entry, unranked, in
    whatever order the matcher happened to block rows. So a Kia EV9 came out as
    "related to BYD Atto 2 but rejected: model numbers differ (9 vs 2)", with
    verdict 'new', reason "a new variant in a family the catalogue already
    carries", at 55% confidence. Every part of that was wrong, and it was the
    text an operator would triage against.

    Two changes fix it, and both are needed. crawler/match.ts no longer blocks
    cross-brand pairs at all, so that entry would not exist today; and this
    searches for a same-brand block rather than taking whichever came first. A
    cross-brand block, if one ever appears again, now falls through to the clean
    'new' return below with no fabricated relation — because a cross-brand block
    is never a near miss.
  */
  const sameBrandBlocked = match.blocked.find(
    (candidate) => marketBrandKey(candidate.car.brand) === marketBrandKey(vehicle.brand),
  )

  if (sameBrandBlocked) {
    return {
      verdict: 'new',
      reason: 'a new variant in a family the catalogue already carries',
      possibleDuplicateOf: sameBrandBlocked.car.slug,
      duplicateReason: `related to ${sameBrandBlocked.car.fullName} but rejected: ${sameBrandBlocked.reason}`,
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
