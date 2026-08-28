// crawler/match.ts

import { sameVariant } from './identity'
import { nameKey, type NormalisedCar } from './normalise'

/**
 * Deciding which catalogue car a scraped record is about.
 *
 * Proposes. Never applies. Nothing in this module writes to the database or
 * changes a `Car`; it returns a decision and its evidence, and Phase 1 stores
 * that as a suggestion for a human to confirm.
 *
 * ── Why the matching is deliberately narrow ───────────────────────────
 *
 * The catalogue is full of names that differ by one character and mean different
 * cars: Sealion 6 and Sealion 7, Tiggo 7 / 8 / 9, Atto 2 and Atto 3, EV5 and
 * EV9. Any similarity metric loose enough to forgive a spelling difference is
 * also loose enough to merge two of those, and the result — one car's price on
 * another car's page — is both wrong and very hard to spot afterwards.
 *
 * So there is no edit distance, no trigram score, no "80% similar" anywhere in
 * this file. The rules are exact comparisons over normalised parts, ordered by
 * how much they prove, and the strongest one that fires wins.
 *
 * The one hard guard, applied to every tier: MODEL NUMBERS MUST BE EQUAL. If
 * both names carry digits in the model, those digits have to agree exactly or
 * the pair is rejected outright, whatever else matches. That single rule is what
 * makes Sealion 6 vs Sealion 7 impossible rather than merely unlikely.
 */

/** The subset of a catalogue row the matcher compares against. */
export interface MatchCandidateCar {
  id: string
  slug: string
  brand: string
  model: string
  fullName: string
  category: string

  /**
   * Variant identity, added in Phase 4.1. Optional so fixtures and older callers
   * compile; null and absent both mean "this row declares no variant".
   *
   * Before these existed, `yearGuard` was called with a hard-coded null for the
   * catalogue side — dead code that could never fire, because there was no column
   * to compare against. Both guards are live now.
   */
  variant?: string | null
  trim?: string | null
  modelYear?: number | null
  generation?: string | null
}

export type MatchStrategy =
  | 'external-id'
  | 'slug'
  /** Brand, model, variant and model year all agree exactly. */
  | 'exact-variant-year'
  /** Brand, model and variant agree exactly. */
  | 'exact-variant'
  /** Brand and model agree exactly. Says nothing about the variant. */
  | 'exact-parts'
  | 'exact-name'
  | 'brand-model'
  | 'none'

export type MatchDecision =
  /** Safe to apply once a reviewer agrees. One candidate, strong evidence. */
  | 'confident'
  /** Plausible, but a human should look. */
  | 'probable'
  /** Several candidates fit equally well — never auto-apply. */
  | 'ambiguous'
  /** Nothing matched: probably a car the catalogue does not have yet. */
  | 'none'

export interface MatchCandidate {
  car: MatchCandidateCar
  strategy: MatchStrategy
  /** 0–100. Comparable only within a run, and never a probability. */
  score: number
  /** Why this candidate fired, in words a reviewer can check. */
  reason: string
}

export interface MatchResult {
  decision: MatchDecision
  best: MatchCandidate | null
  /** Rivals worth showing a reviewer, best first. */
  candidates: MatchCandidate[]
  /** Set when a candidate was rejected by a guard rather than by weak evidence. */
  blocked: { car: MatchCandidateCar; reason: string }[]
}

/** Aliases a source may use for a brand the catalogue spells differently. */
const BRAND_ALIASES: Record<string, string> = {
  byd: 'byd',
  'great wall': 'gwm',
  'great wall motors': 'gwm',
  gwm: 'gwm',
  haval: 'haval',
  changan: 'changan',
  deepal: 'deepal',
  'changan deepal': 'deepal',
  kia: 'kia',
  hyundai: 'hyundai',
  mg: 'mg',
  'morris garages': 'mg',
  chery: 'chery',
  jaecoo: 'jaecoo',
  omoda: 'omoda',
  toyota: 'toyota',
  dfsk: 'dfsk',
  seres: 'dfsk',
  xpeng: 'xpeng',
  'x-peng': 'xpeng',
  dongfeng: 'dongfeng',
  riddara: 'riddara',
  radar: 'riddara',
  forthing: 'forthing',
  gugo: 'gugo',
  aion: 'gugo',
}

function brandKey(brand: string | null): string {
  const key = nameKey(brand)
  return BRAND_ALIASES[key] ?? key
}

/**
 * The digits inside a model name.
 *
 * "Sealion 7" → ["7"], "Tiggo 8 PHEV" → ["8"], "EV9 GT-Line" → ["9"].
 * Four-digit runs are skipped: those are model years, which are compared
 * separately and should not be mistaken for a model number.
 */
export function modelNumbers(value: string | null): string[] {
  if (!value) return []
  return (nameKey(value).match(/\d+/g) ?? []).filter((digits) => digits.length < 4)
}

/**
 * The guard that makes near-identical model names safe.
 *
 * Returns a reason to reject, or null to allow. Numbers must match exactly when
 * both sides have them; one side having none is not evidence either way, so it
 * is allowed through to be judged on other grounds.
 */
export function numberGuard(a: string | null, b: string | null): string | null {
  const left = modelNumbers(a)
  const right = modelNumbers(b)
  if (left.length === 0 || right.length === 0) return null

  const same = left.length === right.length && left.every((digit, index) => digit === right[index])
  if (same) return null

  return `model numbers differ (${left.join(',')} vs ${right.join(',')})`
}

/** Model year, when both sides state one, must agree. */
function yearGuard(a: number | null, b: number | null): string | null {
  if (a === null || b === null) return null
  return a === b ? null : `model years differ (${a} vs ${b})`
}

export interface MatchInput {
  normalised: NormalisedCar
  /** The source's own id, and the ids it has previously been matched under. */
  externalId?: string | null
  /** externalId → car id, from records a reviewer has already approved. */
  knownExternalIds?: Record<string, string>
  /** Extra names a car is known by, keyed by car id. */
  aliases?: Record<string, string[]>
}

/**
 * Matches one normalised record against the catalogue.
 *
 * Pure and synchronous: the caller supplies the candidate list, so this can be
 * exercised over fixtures without a database.
 */
export function match(input: MatchInput, catalogue: MatchCandidateCar[]): MatchResult {
  const { normalised, externalId, knownExternalIds = {}, aliases = {} } = input
  const candidates: MatchCandidate[] = []
  const blocked: { car: MatchCandidateCar; reason: string }[] = []

  const byId = new Map(catalogue.map((car) => [car.id, car]))

  /*
    Tier 1 — an external id a reviewer has already tied to a car.

    The only tier that skips the name guards, because it is not a guess: a human
    confirmed this identifier belongs to this car on a previous run.
  */
  if (externalId) {
    const carId = knownExternalIds[externalId]
    const car = carId ? byId.get(carId) : undefined
    if (car) {
      return {
        decision: 'confident',
        best: {
          car,
          strategy: 'external-id',
          score: 100,
          reason: `source id "${externalId}" was confirmed against this car previously`,
        },
        candidates: [],
        blocked: [],
      }
    }
  }

  const sourceName = normalised.fullName
  const sourceModel = normalised.model
  const sourceBrand = brandKey(normalised.brand)
  const sourceKey = nameKey(sourceName)

  for (const car of catalogue) {
    // ── Guards, applied before any tier can score ──────────────────
    const numberProblem =
      numberGuard(sourceModel ?? sourceName, car.model) ?? numberGuard(sourceName, car.fullName)
    if (numberProblem) {
      blocked.push({ car, reason: numberProblem })
      continue
    }

    /*
      The year guard, now with something to compare against.

      This used to be `yearGuard(normalised.modelYear, null)` — a call that could
      never return a problem, because Car had no modelYear column and the second
      argument was a literal null. It looked like a working guard in every reading
      of this file. Phase 4.1 gave Car the column; the guard is live.

      Still only fires when BOTH sides state a year: one side being silent is not
      evidence either way, and treating it as a mismatch would block every record
      from a source that omits the year.
    */
    const yearProblem = yearGuard(normalised.modelYear, car.modelYear ?? null)
    if (yearProblem) {
      blocked.push({ car, reason: yearProblem })
      continue
    }

    /*
      A stated variant contradiction blocks the pair outright.

      Exact comparison over normalised text — see sameVariant in identity.ts for
      why there is no similarity scoring here. If both sides name a variant and
      the names differ, these are different vehicles and no amount of agreement
      elsewhere changes that.
    */
    if (normalised.variant && car.variant && !sameVariant(normalised.variant, car.variant)) {
      blocked.push({
        car,
        reason: `variants differ ("${normalised.variant}" vs "${car.variant}")`,
      })
      continue
    }

    const carBrand = brandKey(car.brand)
    const brandAgrees = sourceBrand.length > 0 && carBrand === sourceBrand

    // ── Tier 2 — the source's slug, if it happens to be ours ───────
    if (externalId && nameKey(externalId) === nameKey(car.slug)) {
      candidates.push({
        car,
        strategy: 'slug',
        score: 95,
        reason: `source id "${externalId}" equals the catalogue slug`,
      })
      continue
    }

    const modelAgrees = sourceModel !== null && nameKey(sourceModel) === nameKey(car.model)

    /*
      ── Tier 3 — brand, model AND variant agree exactly ──────────────

      The comment above this tier used to read "brand, model and variant all
      agree exactly" while the code compared brand and model. That gap is the
      whole of Phase 4.1: five Seal variants each scored 90 here and each came
      back `confident`, and the one that won the field-level comparison was not
      the one the catalogue described.

      The variant tiers are now separate and score higher, so a record that
      genuinely proves the trim outranks one that only proves the model. A
      model-only agreement still scores 90 and still reaches `confident` — it is
      a correct statement about the MODEL, and the model is what a match is for.
      What it no longer does is imply anything about the trim: that question is
      answered by identity.ts, and variant-sensitive fields are gated on its
      verdict rather than on this score.
    */
    const variantAgrees =
      normalised.variant !== null &&
      car.variant !== null &&
      car.variant !== undefined &&
      sameVariant(normalised.variant, car.variant)

    const yearAgrees =
      normalised.modelYear !== null &&
      car.modelYear !== null &&
      car.modelYear !== undefined &&
      normalised.modelYear === car.modelYear

    if (brandAgrees && modelAgrees && variantAgrees && yearAgrees) {
      candidates.push({
        car,
        strategy: 'exact-variant-year',
        score: 98,
        reason: `brand, model, variant and year match exactly (${car.brand} ${car.model} ${car.variant}, ${car.modelYear})`,
      })
      continue
    }

    if (brandAgrees && modelAgrees && variantAgrees) {
      candidates.push({
        car,
        strategy: 'exact-variant',
        score: 94,
        reason: `brand, model and variant match exactly (${car.brand} ${car.model} ${car.variant})`,
      })
      continue
    }

    if (brandAgrees && modelAgrees) {
      candidates.push({
        car,
        strategy: 'exact-parts',
        score: 90,
        reason:
          `brand and model match exactly (${car.brand} / ${car.model})` +
          (normalised.variant
            ? ` — the source names variant "${normalised.variant}", which this row does not declare, so the trim is not established`
            : ''),
      })
      continue
    }

    // ── Tier 4 — the whole normalised name is identical ────────────
    if (sourceKey.length > 0 && sourceKey === nameKey(car.fullName)) {
      candidates.push({
        car,
        strategy: 'exact-name',
        score: 85,
        reason: `full names are identical once normalised ("${car.fullName}")`,
      })
      continue
    }

    // ── Tier 5 — a recorded alias ──────────────────────────────────
    const carAliases = aliases[car.id] ?? []
    if (sourceKey.length > 0 && carAliases.some((alias) => nameKey(alias) === sourceKey)) {
      candidates.push({
        car,
        strategy: 'exact-name',
        score: 80,
        reason: `matches a recorded alias for ${car.fullName}`,
      })
      continue
    }

    /*
      Tier 6 — brand agrees and the catalogue model is a whole-word prefix of
      the source's, e.g. source "Atto 3 Advanced" against catalogue "Atto 3".

      Whole words only. A substring test would let "Seal" match "Sealion", which
      is exactly the confusion this file exists to prevent.
    */
    if (brandAgrees && sourceModel) {
      const sourceWords = nameKey(sourceModel).split(' ')
      const carWords = nameKey(car.model).split(' ')
      const isPrefix =
        carWords.length > 0 &&
        carWords.length <= sourceWords.length &&
        carWords.every((word, index) => word === sourceWords[index])

      if (isPrefix) {
        candidates.push({
          car,
          strategy: 'brand-model',
          score: 65,
          reason: `same brand, and "${car.model}" is the leading part of "${sourceModel}"`,
        })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  if (candidates.length === 0) {
    return { decision: 'none', best: null, candidates: [], blocked }
  }

  const best = candidates[0]!
  const runnerUp = candidates[1]

  /*
    Two candidates within ten points of each other is not a match, it is a
    question. Picking the first would be an arbitrary decision dressed up as a
    result, so it goes to review with both shown.
  */
  if (runnerUp && best.score - runnerUp.score < 10) {
    return { decision: 'ambiguous', best, candidates, blocked }
  }

  return {
    decision: best.score >= 85 ? 'confident' : 'probable',
    best,
    candidates,
    blocked,
  }
}

// ─── Reading a match back off a stored record ─────────────────────────

/**
 * What a downstream decision needs to know about a match.
 *
 * Narrower than `MatchResult` on purpose. A `MatchResult` satisfies it, and so
 * does a match reconstructed from a staging row — which cannot rebuild the full
 * candidate cars, because only their id and slug were stored. The policy layer
 * only ever asks how good the match was and how many rivals there were, so
 * asking it for more than that would force the reconstruction to invent brands
 * and model names it does not have.
 */
export interface MatchEvidence {
  decision: MatchDecision
  /** The rivals. Only the count is read, so the element type is irrelevant. */
  candidates: readonly unknown[]
  strategy?: string | null
  score?: number | null
}

/** The match columns a staging row carries. Prisma's row satisfies this. */
export interface StoredMatchColumns {
  matchStrategy?: string | null
  matchScore?: number | null
  /** Serialised rival candidates, exactly as `storeRecord` wrote them. */
  matchCandidates?: string | null
}

interface StoredCandidate {
  carId?: string
  slug?: string
  strategy?: string
  score?: number
}

/**
 * The score each tier awards, so a row that recorded a strategy but no number
 * can still be placed. Mirrors the tiers in `match()` above; if one changes,
 * both change together or a reconstructed match stops meaning what the live one
 * meant.
 */
const STRATEGY_SCORE: Record<string, number> = {
  'exact-variant-year': 98,
  'exact-variant': 94,
  'external-id': 100,
  slug: 95,
  'exact-parts': 90,
  'exact-name': 85,
  'brand-model': 65,
}

/** Weakest first, so a group of records can be judged by its worst member. */
export const MATCH_DECISION_RANK: Record<MatchDecision, number> = {
  none: 0,
  ambiguous: 1,
  probable: 2,
  confident: 3,
}

export function weakerDecision(a: MatchDecision, b: MatchDecision): MatchDecision {
  return MATCH_DECISION_RANK[a] <= MATCH_DECISION_RANK[b] ? a : b
}

function parseCandidates(json: string | null | undefined): StoredCandidate[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? (parsed as StoredCandidate[]) : []
  } catch {
    return []
  }
}

/**
 * Rebuilds the match decision a staging row was stored with.
 *
 * ── Why this exists ───────────────────────────────────────────────────
 *
 * The match happens when a record is crawled; the proposal is built later, from
 * the database, by a different command. The decision itself was never stored —
 * only its evidence was — so the proposal stage had no way to ask how good the
 * match was and instead assumed it had been a good one. That assumption held
 * only because the two runners happen to set `matchedCarId` on nothing weaker
 * than `confident`; anything else that ever sets it — a manual association, a
 * new adapter, a hand-edited row — would have had its fields treated as
 * confidently matched without a word.
 *
 * The rules here are the same rules `match()` applies, read back off the
 * columns rather than recomputed against the catalogue. Nothing is re-matched:
 * this is not a second matcher, and it will never disagree with the first about
 * *which* car — only report how sure that first answer was.
 *
 * Returns null when the row records no match evidence at all. That is different
 * from a weak match, and the caller must treat it differently: a weak match is
 * known to be poor, while no evidence means nothing is known either way.
 */
export function matchFromRecord(record: StoredMatchColumns): MatchEvidence | null {
  const strategy = record.matchStrategy ?? null
  const score = record.matchScore ?? null
  const candidates = parseCandidates(record.matchCandidates)

  if (strategy === null && score === null && candidates.length === 0) return null

  if (strategy === 'none') {
    return { decision: 'none', candidates, strategy, score }
  }

  const ranked = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const effective =
    score ?? (strategy !== null ? STRATEGY_SCORE[strategy] : undefined) ?? ranked[0]?.score ?? null

  if (effective === null) {
    /*
      Evidence exists but says nothing about strength. Deliberately not
      `confident`: the whole point of this function is that an unproven match
      must not be able to present itself as a proven one.
    */
    return { decision: 'probable', candidates, strategy, score }
  }

  /*
    Two candidates within ten points is the same "that is a question, not an
    answer" rule `match()` applies. A row stored before its rivals were recorded
    has an empty candidate list and is judged on its score alone.
  */
  const runnerUp = ranked[1]?.score
  if (runnerUp !== undefined && effective - runnerUp < 10) {
    return { decision: 'ambiguous', candidates, strategy, score: effective }
  }

  return {
    decision: effective >= 85 ? 'confident' : 'probable',
    candidates,
    strategy,
    score: effective,
  }
}
