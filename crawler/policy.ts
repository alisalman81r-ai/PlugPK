// crawler/policy.ts

import type { FieldComparison } from './compare'
import type { Confidence } from './confidence'
import { isVariantSensitive, type IdentityAssessment } from './identity'
import type { MatchEvidence } from './match'
import { compareStandards, isRangeField, type RangeStandard } from './range-standard'

/**
 * How risky a proposed change is, and therefore how it should be queued.
 *
 * ── "Safe" does not mean "applied" ────────────────────────────────────
 *
 * Three categories, and none of them bypasses review. `safe` means a reviewer can
 * glance and accept; `review` means read it properly; `high-risk` means it should
 * probably be refused and needs a reason if it is not.
 *
 * The distinction is about how much attention a change deserves, never about
 * whether a person is involved. There is deliberately no threshold above which
 * this pipeline writes to the catalogue on its own, and no bulk action that
 * approves an unseen queue — because the failure mode of getting that wrong is a
 * wrong price on a public page that nobody chose to publish.
 */

export type RiskLevel = 'safe' | 'review' | 'high-risk'

export interface RiskAssessment {
  level: RiskLevel
  /** Why, in a sentence a reviewer can act on. */
  reason: string
  /** True when this must not be included in a bulk approval. */
  excludeFromBulk: boolean
}

/** Fields where a change is consequential enough to always be read. */
const SENSITIVE_FIELDS = new Set([
  'priceMin',
  'priceMax',
  'priceDisplay',
  'brand',
  'model',
  'fullName',
  'category',
  'slug',
  'image',
])

/** A price move beyond this fraction is never routine. */
const PRICE_SHIFT_LIMIT = 0.15
/** A specification moving by more than this is worth reading, whatever it is. */
const SPEC_SHIFT_LIMIT = 0.3

/** Fields whose value is a price. */
const PRICE_FIELDS = new Set(['priceMin', 'priceMax', 'pakistanPrice'])

/**
 * How far a numeric value moved, as a fraction of the old one.
 *
 * Named for what it measures rather than for one of its callers. It was
 * `priceShift`, and because the caller did not check the field, a range going
 * 410 -> 480 km was reported to the operator as "the price moves 17.1%" and
 * forced to high risk. A queue whose stated reasons are wrong is worse than one
 * with no reasons: it teaches the reviewer to stop reading them.
 */
function relativeShift(comparison: FieldComparison): number | null {
  if (typeof comparison.currentValue !== 'number' || typeof comparison.proposedValue !== 'number') {
    return null
  }
  if (comparison.currentValue === 0) return null
  return Math.abs(comparison.proposedValue - comparison.currentValue) / comparison.currentValue
}

export interface AssessInput {
  comparison: FieldComparison
  confidence: Confidence
  /**
   * The match that tied this record to the car.
   *
   * A live `MatchResult` satisfies this, and so does one read back off the
   * staging row by `matchFromRecord`. Both are checked identically: the point of
   * the rule is the tier, not which stage of the pipeline established it.
   */
  match?: MatchEvidence | undefined
  /**
   * Set when the record carries no recorded match evidence at all.
   *
   * Distinct from a weak match, and it must stay distinct. A weak match is known
   * to be poor and is refused outright below; an unrecorded one is simply
   * unknown, which is not grounds to call a change dangerous but is grounds to
   * refuse to call it safe.
   */
  matchUnrecorded?: boolean | undefined

  /**
   * Whether the VARIANT was established, not just the model.
   *
   * Added in Phase 4.1. Its absence is what let a 87 kWh figure from a
   * "U 87 kWh Design" record be applied to a catalogue row holding the 61.44 kWh
   * Seal: the match was to the right model, the risk assessment had no way to ask
   * which trim, and the field was graded on the plausibility of the number alone.
   *
   * Optional so existing callers compile, and treated as unproven when absent —
   * see the rule below, which fails closed rather than assuming a missing
   * assessment means a good one.
   */
  identity?: IdentityAssessment | undefined

  /**
   * The test cycles either side of a range change.
   *
   * A range is only a number once you know how it was measured. 425 km
   * unspecified and 650 km CLTC are not a 34.6% decrease; they are two
   * measurements of unknown relationship.
   */
  currentRangeStandard?: RangeStandard | undefined
  proposedRangeStandard?: RangeStandard | undefined
}

/**
 * Classifies one proposed change.
 *
 * Ordered worst-first: the first rule that fires decides, so a high-risk signal
 * cannot be outvoted by several reassuring ones.
 */
export function assess(input: AssessInput): RiskAssessment {
  const {
    comparison,
    confidence,
    match,
    matchUnrecorded,
    identity,
    currentRangeStandard,
    proposedRangeStandard,
  } = input

  /*
    The match itself is the first thing to distrust.

    A perfectly plausible battery figure attached to the wrong car is worse than
    an implausible one attached to the right car: the value looks correct, so it
    survives review, and the catalogue quietly acquires a Sealion 7's
    specification under Sealion 6. Anything short of a confident match makes
    every field on that record high-risk regardless of its own merits.
  */
  if (match && match.decision !== 'confident') {
    const how =
      match.strategy && match.strategy !== 'none'
        ? ` (matched by ${match.strategy}${match.score === null || match.score === undefined ? '' : `, scoring ${match.score}`})`
        : ''

    return {
      level: 'high-risk',
      reason:
        match.decision === 'ambiguous'
          ? `the record matched ${match.candidates.length} cars equally well — it may not be about this car at all${how}`
          : match.decision === 'none'
            ? `the record matched no car by name, so its link to this one was not established by the matcher${how}`
            : `the record was only a ${match.decision} match for this car${how}`,
      excludeFromBulk: true,
    }
  }

  /*
    ── The variant, which is the other half of "is this the right car?" ──

    Placed directly after the match check because it is the same class of
    question. A confident match establishes the MODEL; it says nothing about the
    TRIM, and a battery capacity, a range, a power figure and a price all belong
    to a trim rather than to a model.

    This is the rule whose absence caused Phase 4.1. Five Open EV Data records
    for five different Seal variants each matched the one `byd-seal` row with
    strategy `exact-parts` and score 90. Every one was `confident`. The figures
    that reached the public catalogue — 87 kWh, 425 km, 140 kW DC — belonged to
    "U 87 kWh Design", while the row described the 61.4 kWh Comfort.

    Note what this rule does NOT do: it does not reject the match or the record.
    Model-level fields still flow normally, and the proposal is still raised with
    its evidence attached. It refuses only to let a trim-dependent figure be
    applied while the trim is unestablished.
  */
  if (isVariantSensitive(comparison.field)) {
    /*
      A missing assessment counts as unproven.

      Fails closed on purpose. `identity` is optional so that older callers
      compile, and the safe reading of "this caller did not tell me about the
      variant" is that the variant is unknown — not that it is fine.
    */
    if (!identity) {
      return {
        level: 'high-risk',
        reason:
          `${comparison.field} depends on which variant this is, and no variant identity was established for the record`,
        excludeFromBulk: true,
      }
    }

    if (identity.blocksVariantSensitive) {
      const verdict =
        identity.verdict === 'mismatch'
          ? 'the record is about a different vehicle'
          : identity.verdict === 'ambiguous'
            ? 'more than one vehicle is claiming this catalogue row'
            : 'the variant was not established'

      return {
        level: 'high-risk',
        reason:
          `${comparison.field} is a variant-level figure and ${verdict}: ${identity.reason}. ` +
          `Confirm which variant this catalogue row describes before accepting it`,
        excludeFromBulk: true,
      }
    }
  }

  /*
    ── A range without a comparable test cycle ─────────────────────────

    Before the numeric rules below, because those measure how far the value moved
    and that distance is meaningless across cycles. The catalogue's 650 km and the
    source's 425 km differ by 34.6%, which the old code reported as a large change
    worth reading — a true statement that invited exactly the wrong conclusion,
    because the two figures were never measuring the same thing.
  */
  if (isRangeField(comparison.field) && comparison.changeType !== 'new') {
    const current = currentRangeStandard ?? 'unspecified'
    const proposed = proposedRangeStandard ?? 'unspecified'
    const comparability = compareStandards(current, proposed)

    if (!comparability.comparable) {
      return {
        level: 'high-risk',
        reason:
          `${comparison.field}: ${comparability.reason}. ` +
          `Replacing one with the other would change what the figure means, not just its value`,
        excludeFromBulk: true,
      }
    }
  }

  if (comparison.validationFlags.some((flag) => flag.severity === 'impossible')) {
    return {
      level: 'high-risk',
      reason: `the value cannot be true: ${comparison.validationFlags
        .filter((flag) => flag.severity === 'impossible')
        .map((flag) => flag.message)
        .join('; ')}`,
      excludeFromBulk: true,
    }
  }

  if (comparison.changeType === 'unit-mismatch') {
    return {
      level: 'high-risk',
      reason: 'the source published a number whose unit could not be established',
      excludeFromBulk: true,
    }
  }

  // ── Identity fields ───────────────────────────────────────────────
  if (SENSITIVE_FIELDS.has(comparison.field) && comparison.field !== 'priceMin' && comparison.field !== 'priceMax' && comparison.field !== 'priceDisplay') {
    return {
      level: 'high-risk',
      reason: `${comparison.field} is what identifies this car; changing it from crawled data risks turning one car into another`,
      excludeFromBulk: true,
    }
  }

  // ── Price ─────────────────────────────────────────────────────────
  const shift = relativeShift(comparison)

  if (PRICE_FIELDS.has(comparison.field)) {
    if (shift !== null && shift > PRICE_SHIFT_LIMIT) {
      return {
        level: 'high-risk',
        reason: `the price moves ${(shift * 100).toFixed(1)}%, beyond the ${PRICE_SHIFT_LIMIT * 100}% a routine revision explains`,
        excludeFromBulk: true,
      }
    }
    return {
      level: 'review',
      reason: 'a price change — small, but it is the figure buyers act on',
      excludeFromBulk: true,
    }
  }

  if (SENSITIVE_FIELDS.has(comparison.field)) {
    return {
      level: 'review',
      reason: `${comparison.field} is shown on every card, so a change to it is worth reading`,
      excludeFromBulk: true,
    }
  }

  /*
    No match evidence on the record.

    Placed after every high-risk rule so it cannot mask one — a rename or a
    price jump keeps its own, sharper reason. What it does is stop such a row
    reaching any of the `safe` outcomes below: a value whose connection to this
    car was never established is not something to wave through in a batch,
    however unremarkable the number looks.
  */
  if (matchUnrecorded) {
    return {
      level: 'review',
      reason:
        'the record carries no recorded match evidence, so how it came to be attached to this car is unknown',
      excludeFromBulk: true,
    }
  }

  /*
    A large swing in an ordinary specification.

    Review rather than high risk: a 40% jump in a range figure usually means the
    catalogue was wrong, not that the record belongs to another car — that
    possibility is already covered by the match check above. But it is too big to
    wave through in a batch.
  */
  if (shift !== null && shift > SPEC_SHIFT_LIMIT) {
    return {
      level: 'review',
      reason: `${comparison.field} moves ${(shift * 100).toFixed(1)}%, which is too large to accept without looking`,
      excludeFromBulk: true,
    }
  }

  if (comparison.conflicting) {
    return {
      level: 'review',
      reason: 'sources disagree, so accepting one means rejecting another',
      excludeFromBulk: true,
    }
  }

  if (comparison.validationFlags.some((flag) => flag.severity === 'implausible')) {
    return {
      level: 'review',
      reason: `plausible but unusual: ${comparison.validationFlags
        .map((flag) => flag.message)
        .join('; ')}`,
      excludeFromBulk: false,
    }
  }

  /*
    Filling a gap is the least dangerous thing this pipeline does: there is no
    existing value to lose, so a wrong figure is a wrong figure rather than the
    destruction of a right one. It still needs a person to look.
  */
  if (comparison.changeType === 'new' && confidence.score >= 70) {
    return {
      level: 'safe',
      reason: `fills an empty field, confidence ${confidence.score}`,
      excludeFromBulk: false,
    }
  }

  if (comparison.changeType === 'source-disagreement' && confidence.score >= 80) {
    return {
      level: 'safe',
      reason: `several sources agree on a value the catalogue lacks, confidence ${confidence.score}`,
      excludeFromBulk: false,
    }
  }

  if (confidence.score >= 80) {
    return {
      level: 'safe',
      reason: `single high-confidence change, ${confidence.score}`,
      excludeFromBulk: false,
    }
  }

  return {
    level: 'review',
    reason: `confidence ${confidence.score} is not high enough to wave through`,
    excludeFromBulk: false,
  }
}
