// crawler/identity.ts

/**
 * Establishing WHICH car a source record is about — down to the variant.
 *
 * ── The failure this module exists to prevent ─────────────────────────
 *
 * On 2026-08-25 the crawler stored five Open EV Data records for the BYD Seal:
 *
 *     variant "61.4 kWh RWD Comfort"     61.4 kWh   370 km
 *     variant "U 71.8 kWh Comfort"       71.8 kWh   360 km
 *     variant "82.5 kWh RWD Design"      82.5 kWh     —
 *     variant "82.5 kWh AWD Excellence"  82.5 kWh     —
 *     variant "U 87 kWh Design"          87 kWh     425 km
 *
 * All five matched the single catalogue row `byd-seal` with strategy
 * `exact-parts` and score 90 — `confident` — because the matcher compared brand
 * and model and nothing else. The catalogue row held 61.44 kWh, which is the
 * first of those variants almost to the decimal. On 2026-08-27 an operator
 * approved the resulting proposals and the row became 87 kWh and 425 km: figures
 * belonging to a different car.
 *
 * The queue had said "sources disagree". It was one source, describing five
 * different vehicles, and no part of the system could express that.
 *
 * ── What this module will not do ──────────────────────────────────────
 *
 * No edit distance, no trigram similarity, no "close enough". No inferring a
 * variant from a battery size, and no inferring a model year from a crawl date.
 * If a source says only "BYD Seal", that is all it has said, and the answer to
 * "which Seal?" is that we do not know — not a best guess.
 *
 * Every function here returns a verdict plus the evidence for it, and the verdict
 * that means "I could not establish this" is a first-class answer rather than a
 * failure mode.
 */

import { nameKey } from './normalise'

// ─── Identity ─────────────────────────────────────────────────────────

/**
 * What either side asserts about which car it is.
 *
 * The same shape for a catalogue row and a source record on purpose: the whole
 * bug was that the two were compared on different terms. `declaredVariant` is the
 * important field, and it is nullable, because "no variant stated" is a fact that
 * must survive into the comparison rather than being filled in.
 */
export interface CarIdentity {
  brand: string | null
  model: string | null
  /** Only what was explicitly stated. Never derived from a name or a figure. */
  variant: string | null
  trim: string | null
  modelYear: number | null
  generation: string | null
  externalId: string | null
}

export function emptyIdentity(): CarIdentity {
  return {
    brand: null,
    model: null,
    variant: null,
    trim: null,
    modelYear: null,
    generation: null,
    externalId: null,
  }
}

/** Normalised for comparison. Case, punctuation and spacing only. */
function key(value: string | null): string {
  return value === null ? '' : nameKey(value)
}

/**
 * Whether two variant strings state the same variant.
 *
 * Exact comparison over normalised text, and nothing more. It is tempting to be
 * cleverer here — "82.5 kWh RWD Design" and "Design 82.5" plainly mean the same
 * trim to a human — but every rule that forgives a difference in wording also
 * forgives a difference in meaning, and the difference between "82.5 kWh RWD
 * Design" and "82.5 kWh AWD Excellence" is two words and about 40 kW.
 *
 * A source and a catalogue row that spell a variant differently produce
 * `unproven`, which routes to review. A person then makes the call once, and
 * (when alias support is wired to a table) it can be recorded. That is slower
 * than a similarity score and it cannot be wrong in the way a score can.
 */
export function sameVariant(a: string | null, b: string | null): boolean {
  const left = key(a)
  const right = key(b)
  return left.length > 0 && left === right
}

// ─── Verdicts ─────────────────────────────────────────────────────────

export type VariantVerdict =
  /** Both sides state a variant and they agree, or an external id settled it. */
  | 'proven'
  /**
   * The model matched but the variant was not established.
   *
   * The commonest and most dangerous case, and the one that caused Phase 4.1:
   * either side may be silent about the variant, or they may spell it
   * differently. The match may well be right — it simply has not been shown.
   */
  | 'unproven'
  /**
   * Several distinct variants are competing for the same catalogue row.
   *
   * Different from `unproven`: here we can see positively that more than one
   * vehicle is claiming to be this car, so at most one of them is right.
   */
  | 'ambiguous'
  /** Both sides state a variant and they are different. Not this car. */
  | 'mismatch'

export type IdentityTier =
  /** A human previously confirmed this source id against this car. */
  | 'external-id'
  | 'brand-model-variant-year'
  | 'brand-model-variant'
  | 'brand-model-year'
  | 'brand-model'
  | 'none'

/** How much each tier proves. Ordering only — never a probability. */
export const TIER_RANK: Record<IdentityTier, number> = {
  'external-id': 100,
  'brand-model-variant-year': 95,
  'brand-model-variant': 90,
  'brand-model-year': 70,
  'brand-model': 50,
  none: 0,
}

export interface IdentityAssessment {
  tier: IdentityTier
  verdict: VariantVerdict
  /** One sentence, safe to show a reviewer. */
  reason: string
  /**
   * True when variant-sensitive fields must not be applied.
   *
   * Derived rather than stored so it cannot drift from the verdict: anything
   * other than `proven` blocks them.
   */
  blocksVariantSensitive: boolean
  /** Other catalogue rows that could equally be this record's subject. */
  rivals: string[]
}

export interface AssessIdentityInput {
  /** What the source published. */
  source: CarIdentity
  /** The catalogue row the matcher paired it with. */
  car: CarIdentity & { slug: string }
  /**
   * Every catalogue row sharing this car's brand and model.
   *
   * Needed to answer "does this model have more than one variant in the
   * catalogue?", which decides whether a model-only source record is ambiguous or
   * merely unproven.
   */
  siblings?: (CarIdentity & { slug: string })[]
  /**
   * Distinct variants of this model seen from the same source in this run.
   *
   * This is what was missing entirely. A record is matched on its own, so
   * nothing could see that five records were all claiming one row. Passing the
   * set in makes that visible at the point of judgement.
   */
  competingSourceVariants?: (string | null)[]
  /** externalId values a reviewer has already tied to this car. */
  confirmedExternalIds?: string[]
}

/**
 * Decides the identity tier and the variant verdict.
 *
 * Ordered by what it proves, strongest first, and the first rule that fires
 * decides — so a weak signal cannot dilute a strong one, and a strong one cannot
 * paper over a contradiction.
 */
export function assessIdentity(input: AssessIdentityInput): IdentityAssessment {
  const { source, car, siblings = [], competingSourceVariants = [], confirmedExternalIds = [] } = input

  const rivals = siblings.filter((sibling) => sibling.slug !== car.slug).map((s) => s.slug)

  /*
    Tier 1 — an external id a person already confirmed against this car.

    The only tier that can prove a variant without either side spelling one,
    because it is not an inference: somebody looked at this record and this car
    and said they were the same thing. That decision covers the variant too.
  */
  if (source.externalId && confirmedExternalIds.includes(source.externalId)) {
    return {
      tier: 'external-id',
      verdict: 'proven',
      reason: `source id "${source.externalId}" was confirmed against ${car.slug} by a person previously`,
      blocksVariantSensitive: false,
      rivals,
    }
  }

  const brandAgrees = key(source.brand).length > 0 && key(source.brand) === key(car.brand)
  const modelAgrees = key(source.model).length > 0 && key(source.model) === key(car.model)

  if (!brandAgrees || !modelAgrees) {
    return {
      tier: 'none',
      verdict: 'mismatch',
      reason: !brandAgrees
        ? `brand does not agree (source "${source.brand ?? '—'}" vs catalogue "${car.brand}")`
        : `model does not agree (source "${source.model ?? '—'}" vs catalogue "${car.model}")`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  /*
    A stated contradiction outranks everything below.

    Both sides name a variant and the names differ: this record is about a
    different vehicle, whatever else agrees. Reported before the year is even
    consulted, because a matching year on two different trims is not reassurance.
  */
  const bothStateVariant = source.variant !== null && car.variant !== null
  if (bothStateVariant && !sameVariant(source.variant, car.variant)) {
    return {
      tier: 'none',
      verdict: 'mismatch',
      reason: `both state a variant and they differ — source "${source.variant}" vs catalogue "${car.variant}"`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  const yearsBothStated = source.modelYear !== null && car.modelYear !== null
  const yearsAgree = yearsBothStated && source.modelYear === car.modelYear

  if (yearsBothStated && !yearsAgree) {
    return {
      tier: 'none',
      verdict: 'mismatch',
      reason: `both state a model year and they differ (source ${source.modelYear} vs catalogue ${car.modelYear})`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  // ── Variant proven ─────────────────────────────────────────────────
  if (bothStateVariant) {
    // Reaching here means the variants agree; only the year is still open.
    if (yearsAgree) {
      return {
        tier: 'brand-model-variant-year',
        verdict: 'proven',
        reason: `brand, model, variant and model year all agree exactly (${car.brand} ${car.model} ${car.variant}, ${car.modelYear})`,
        blocksVariantSensitive: false,
        rivals,
      }
    }

    return {
      tier: 'brand-model-variant',
      verdict: 'proven',
      reason:
        `brand, model and variant agree exactly (${car.brand} ${car.model} ${car.variant})` +
        (source.modelYear === null && car.modelYear === null
          ? '; neither states a model year'
          : '; only one side states a model year, which is not a contradiction'),
      blocksVariantSensitive: false,
      rivals,
    }
  }

  /*
    ── Everything below is model-level agreement with no variant proof ──

    This is where `byd-seal` sat, and where the damage was done. Every branch
    returns a verdict that blocks variant-sensitive fields. The distinctions
    between them are about what to tell the reviewer, not about whether to
    proceed.
  */

  const distinctCompeting = new Set(
    competingSourceVariants.filter((v): v is string => typeof v === 'string' && key(v).length > 0).map(key),
  )

  /*
    More than one distinct variant from the source is claiming this row.

    Positively ambiguous rather than merely unproven: we can see several vehicles
    competing, so at most one is right and probably none has been identified. This
    is the byd-seal case, and it is the strongest signal available short of a
    stated contradiction.
  */
  if (distinctCompeting.size > 1) {
    return {
      tier: 'brand-model',
      verdict: 'ambiguous',
      reason:
        `${distinctCompeting.size} different variants of ${car.brand} ${car.model} were published by the source and all match this one catalogue row — ` +
        `at most one of them describes it`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  /*
    The catalogue holds more than one row for this brand and model.

    A source naming no variant cannot be assigned to one of them, and picking the
    first would be an arbitrary choice presented as a result. Note this is
    currently unreachable — every (brand, model) in the catalogue is unique today
    because variant is baked into `model`. It exists for when that is fixed, and
    it is tested.
  */
  if (rivals.length > 0 && source.variant === null) {
    return {
      tier: 'brand-model',
      verdict: 'ambiguous',
      reason:
        `the catalogue holds ${rivals.length + 1} rows for ${car.brand} ${car.model} and the source names no variant — ` +
        `it cannot be assigned to one of them`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  if (source.variant !== null && car.variant === null) {
    /*
      The exact byd-seal shape, and the reason `unproven` had to exist.

      The source names a specific vehicle; the catalogue row names a model and
      leaves the variant open. The model matches, so this is very likely the right
      *row* — and it is not established that the row is about the *variant* the
      source is describing. Which is precisely what a battery capacity depends on.
    */
    return {
      tier: yearsAgree ? 'brand-model-year' : 'brand-model',
      verdict: 'unproven',
      reason:
        `the source describes variant "${source.variant}" but the catalogue row declares no variant, ` +
        `so it is not established that they are the same vehicle`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  if (source.variant === null && car.variant !== null) {
    return {
      tier: yearsAgree ? 'brand-model-year' : 'brand-model',
      verdict: 'unproven',
      reason:
        `the catalogue row is variant "${car.variant}" but the source names no variant, ` +
        `so it is not established that its figures describe this trim`,
      blocksVariantSensitive: true,
      rivals,
    }
  }

  // Neither side states a variant at all.
  return {
    tier: yearsAgree ? 'brand-model-year' : 'brand-model',
    verdict: 'unproven',
    reason: yearsAgree
      ? `brand, model and model year agree, but neither side states a variant`
      : `only brand and model agree; neither side states a variant`,
    blocksVariantSensitive: true,
    rivals,
  }
}

// ─── Variant-sensitive fields ─────────────────────────────────────────

/**
 * Fields whose correct value depends on which variant is being described.
 *
 * The test applied to each: **could two trims of the same model differ here?** If
 * yes, the field is variant-sensitive and cannot be written from a record whose
 * variant is unproven, however plausible the number looks.
 *
 * Battery, range, power and price obviously qualify. Charging rates do too, and
 * less obviously — the byd-seal 110 kW / 140 kW split is exactly a variant
 * difference, and it was one of the three wrong values applied.
 */
export const VARIANT_SENSITIVE_FIELDS = new Set([
  // Energy and range
  'batteryCapacity',
  'usableBatteryCapacity',
  'range',
  'rangeMax',
  'electricRange',
  'electricRangeMax',
  // Performance
  'power',
  'torque',
  'acceleration',
  'topSpeed',
  // Charging — a bigger pack usually charges faster, so these move with the trim
  'dcCharging',
  'acCharging',
  // Commercial
  'priceMin',
  'priceMax',
  'priceDisplay',
  'modelYear',
])

/**
 * Fields that describe the model rather than the trim.
 *
 * Named explicitly rather than inferred as "everything else", so adding a column
 * does not silently make it safe to write from an unproven variant. A field in
 * neither set is treated as variant-sensitive.
 */
export const MODEL_LEVEL_FIELDS = new Set([
  'brand',
  'model',
  'fullName',
  'category',
  'bodyType',
  'seats',
  /*
    Connectors are model-level in this market, with a caveat worth stating.

    Every variant of a given model sold here uses the same plug — the physical
    socket is not a trim option. It is listed as model-level because it is, and
    because the alternative would block a harmless correction (the byd-seal
    "CCS2, Type 2" -> "Type 2, CCS2" reorder) on variant grounds it has nothing to
    do with. If a model ever ships with different plugs by trim, move it.
  */
  'connectors',
  'engineCapacity',
  'image',
  'notes',
])

export function isVariantSensitive(field: string): boolean {
  if (MODEL_LEVEL_FIELDS.has(field)) return false
  /*
    Anything unrecognised is treated as variant-sensitive.

    The conservative default, chosen because the two failure modes are not
    symmetric: wrongly requiring review costs a reviewer ten seconds, and wrongly
    permitting a write puts another variant's figure on a public page.
  */
  return true
}

/** Which of a set of fields would be blocked by an unproven variant. */
export function blockedFields(fields: string[], assessment: IdentityAssessment): string[] {
  if (!assessment.blocksVariantSensitive) return []
  return fields.filter((field) => isVariantSensitive(field))
}

// ─── Reading identity off the two sides ───────────────────────────────

/** A catalogue row, as much of it as identity needs. */
export interface CarRowLike {
  slug: string
  brand: string
  model: string
  variant?: string | null
  trim?: string | null
  modelYear?: number | null
  generation?: string | null
}

export function identityFromCar(car: CarRowLike): CarIdentity & { slug: string } {
  return {
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    /*
      Read straight off the column. Deliberately NOT parsed out of `model`.

      The catalogue currently spells variants inside the model name — "Atto 3
      Advanced", "EV9 GT-Line" — and splitting that here would be this module
      guessing a variant, which is the one thing it must never do. A null variant
      is reported as null, the verdict comes back `unproven`, and variant-sensitive
      fields wait for a person. scripts/report-variant-identity.ts proposes the
      splits for review; until somebody accepts one, the column stays null and the
      safe path is the automatic one.
    */
    variant: car.variant ?? null,
    trim: car.trim ?? null,
    modelYear: car.modelYear ?? null,
    generation: car.generation ?? null,
    externalId: null,
  }
}

/** A normalised source record, as much of it as identity needs. */
export interface SourceRecordLike {
  brand?: string | null
  model?: string | null
  variant?: string | null
  trim?: string | null
  modelYear?: number | null
  generation?: string | null
  externalId?: string | null
}

export function identityFromSource(record: SourceRecordLike): CarIdentity {
  return {
    brand: record.brand ?? null,
    model: record.model ?? null,
    variant: record.variant ?? null,
    trim: record.trim ?? null,
    /*
      Model year comes from the source or is null. Never from the crawl date.

      A record fetched in 2026 says nothing about the model year of the car it
      describes, and stamping one would create a year that looks published and is
      invented — then the year guard would start comparing it, and a wrong year is
      worse than no year because it can produce a false mismatch as easily as a
      false match.
    */
    modelYear: record.modelYear ?? null,
    generation: record.generation ?? null,
    externalId: record.externalId ?? null,
  }
}

/**
 * A short label for a review screen: the variant, or an honest blank.
 *
 * "—" rather than "standard" or "base". A car whose variant nobody recorded is not
 * the base trim; it is a car whose variant nobody recorded.
 */
export function describeIdentity(identity: CarIdentity): string {
  const parts = [identity.brand, identity.model].filter(Boolean).join(' ')
  const variant = identity.variant ?? '—'
  const year = identity.modelYear === null ? 'year unknown' : String(identity.modelYear)
  return `${parts || '—'} · variant ${variant} · ${year}`
}
