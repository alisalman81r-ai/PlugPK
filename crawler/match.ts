// crawler/match.ts

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
}

export type MatchStrategy =
  | 'external-id'
  | 'slug'
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

    const yearProblem = yearGuard(normalised.modelYear, null)
    if (yearProblem) {
      blocked.push({ car, reason: yearProblem })
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

    // ── Tier 3 — brand, model and variant all agree exactly ────────
    const modelAgrees = sourceModel !== null && nameKey(sourceModel) === nameKey(car.model)
    if (brandAgrees && modelAgrees) {
      candidates.push({
        car,
        strategy: 'exact-parts',
        score: 90,
        reason: `brand and model match exactly (${car.brand} / ${car.model})`,
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
