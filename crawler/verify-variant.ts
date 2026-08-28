// crawler/verify-variant.ts
//
// Phase 4.1 — variant-level identity.
//
// The regression at the bottom of this file is the reason the phase exists. On
// 2026-08-25 the crawler stored five Open EV Data records for the BYD Seal —
// 61.4, 71.8, 82.5, 82.5 and 87 kWh — and every one matched the single catalogue
// row with strategy `exact-parts`, score 90, decision `confident`. On 2026-08-27
// an operator approved the resulting proposals and the row, which held 61.44 kWh,
// became 87 kWh and 425 km. Figures belonging to a different car.
//
// Fixtures and pure functions only. No database, no network, no wall clock: the
// question "would a 87 kWh record be allowed to overwrite a 61.44 kWh row?" has a
// definite answer that must not depend on what is in dev.db today.
//
// Run:  npm run crawl:verify-variant

import {
  assessIdentity,
  identityFromCar,
  identityFromSource,
  isVariantSensitive,
  sameVariant,
  type CarIdentity,
  type IdentityAssessment,
} from './identity'
import { match, type MatchCandidateCar } from './match'
import { toMatchInput } from './match-input'
import { emptyVehicle, type NormalisedVehicle } from './model'
import { assess } from './policy'
import {
  competingVariants,
  decideField,
  weakestIdentity,
  FIELD_MAP,
  type CarLike,
  type RecordLike,
} from './proposals'
import { compareStandards, toRangeStandard } from './range-standard'

let failures = 0
let checks = 0

function check(label: string, condition: boolean, detail = '') {
  checks += 1
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const NOW = new Date('2026-03-15T06:00:00.000Z')

// ─── Fixtures ─────────────────────────────────────────────────────────

/**
 * The catalogue row as it actually stood: model "Seal", no variant declared, and
 * the 61.44 kWh pack that BYD sells here.
 */
function sealRow(overrides: Partial<CarLike> = {}): CarLike {
  return {
    id: 'byd-seal',
    slug: 'byd-seal',
    brand: 'BYD',
    model: 'Seal',
    fullName: 'BYD Seal',
    category: 'EV',
    variant: null,
    trim: null,
    modelYear: null,
    generation: null,
    batteryCapacity: 61.44,
    range: 650,
    rangeStandard: 'cltc',
    dcCharging: null,
    acCharging: null,
    connectors: 'CCS2,Type 2',
    ...overrides,
  }
}

/** A source record, with the identity fields openev really publishes. */
function sealRecord(
  variant: string | null,
  figures: Partial<NormalisedVehicle> = {},
): NormalisedVehicle {
  const vehicle = emptyVehicle({
    source: 'openev',
    sourceUrl: `https://github.com/KilowattApp/open-ev-data#${variant ?? 'novariant'}`,
    externalId: variant ?? 'novariant',
    extractionMethod: 'dataset',
  })
  vehicle.brand = 'BYD'
  vehicle.model = 'Seal'
  vehicle.variant = variant
  vehicle.trim = variant
  vehicle.powertrainType = 'EV'
  vehicle.confidence = 90
  vehicle.fetchedAt = NOW.toISOString()
  return { ...vehicle, ...figures }
}

function record(id: string, overrides: Partial<RecordLike> = {}): RecordLike {
  return {
    id,
    sourceId: 'openev',
    runId: 'run-1',
    sourceUrl: `https://example.test/${id}`,
    fetchedAt: NOW,
    confidence: 90,
    raw: '{}',
    normalised: null,
    matchedCarId: 'byd-seal',
    matchStrategy: 'exact-parts',
    matchScore: 90,
    matchCandidates: JSON.stringify([
      { carId: 'byd-seal', slug: 'byd-seal', strategy: 'exact-parts', score: 90 },
    ]),
    ...overrides,
  }
}

function carIdentityOf(car: CarLike): CarIdentity & { slug: string } {
  return identityFromCar({
    slug: car.slug,
    brand: String(car.brand),
    model: String(car.model),
    variant: (car.variant as string | null) ?? null,
    trim: (car.trim as string | null) ?? null,
    modelYear: (car.modelYear as number | null) ?? null,
    generation: (car.generation as string | null) ?? null,
  })
}

function fieldMapping(field: string) {
  const mapping = FIELD_MAP.find((entry) => entry.car === field)
  if (!mapping) {
    throw new Error(
      `No FIELD_MAP entry for "${field}". Known: ${FIELD_MAP.map((e) => e.car).join(', ')}`,
    )
  }
  return mapping
}

/** The five variants the source really published, in the order it published them. */
const FIVE_SEAL_VARIANTS: { variant: string; usable: number; range: number | null; dc: number | null }[] = [
  { variant: 'U 87 kWh Design', usable: 87, range: 425, dc: 140 },
  { variant: '61.4 kWh RWD Comfort', usable: 61.4, range: 370, dc: 110 },
  { variant: 'U 71.8 kWh Comfort', usable: 71.8, range: 360, dc: 115 },
  { variant: '82.5 kWh RWD Design', usable: 82.5, range: null, dc: 150 },
  { variant: '82.5 kWh AWD Excellence', usable: 82.5, range: null, dc: 150 },
]

function fiveSealRecords(): { record: RecordLike; vehicle: NormalisedVehicle }[] {
  return FIVE_SEAL_VARIANTS.map((entry, index) => ({
    record: record(`rec-${index}`),
    vehicle: sealRecord(entry.variant, {
      usableBatteryCapacityKwh: entry.usable,
      rangeKm: entry.range,
      dcChargingKw: entry.dc,
      acChargingKw: 11,
      chargingStandards: ['Type 2', 'CCS2'],
      rangeStandard: entry.range === null ? null : 'unspecified',
    }),
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────

console.log('\nPHASE 4.1 — VARIANT-LEVEL IDENTITY\n')

// ── 1. BYD Seal with multiple variants ────────────────────────────────
console.log('1. BYD SEAL WITH MULTIPLE VARIANTS')
{
  const car = sealRow()
  const parsed = fiveSealRecords()

  const variants = competingVariants(parsed)
  check('all five published variants are visible to the decision', variants.length === 5)
  check(
    '   and they are five DIFFERENT variants, not one repeated',
    new Set(variants).size === 5,
    variants.filter((v): v is string => v !== null).join(' | '),
  )

  const assessment = assessIdentity({
    source: identityFromSource(parsed[0]!.vehicle),
    car: carIdentityOf(car),
    competingSourceVariants: variants,
  })

  check(
    '   five variants competing for one row is AMBIGUOUS, not confident',
    assessment.verdict === 'ambiguous',
    assessment.verdict,
  )
  check('   and it blocks variant-sensitive fields', assessment.blocksVariantSensitive)
  check(
    '   the reason names the count rather than saying "sources disagree"',
    assessment.reason.includes('5 different variants'),
    assessment.reason,
  )
}

// ── 2. BYD Seal source without variant ───────────────────────────────
console.log('\n2. BYD SEAL SOURCE WITHOUT VARIANT')
{
  const car = sealRow()
  const assessment = assessIdentity({
    source: identityFromSource(sealRecord(null, { usableBatteryCapacityKwh: 82.5 })),
    car: carIdentityOf(car),
    competingSourceVariants: [null],
  })

  check(
    'a source naming no variant is never proven',
    assessment.verdict === 'unproven',
    assessment.verdict,
  )
  check('   and cannot write a variant-sensitive field', assessment.blocksVariantSensitive)
  check(
    '   the tier records that only brand and model agreed',
    assessment.tier === 'brand-model',
    assessment.tier,
  )
}

// ── 3. BYD Seal source with exact variant ────────────────────────────
console.log('\n3. BYD SEAL SOURCE WITH EXACT VARIANT')
{
  // The catalogue row now declares the variant it actually is.
  const car = sealRow({ variant: '61.4 kWh RWD Comfort' })
  const assessment = assessIdentity({
    source: identityFromSource(sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4 })),
    car: carIdentityOf(car),
    competingSourceVariants: ['61.4 kWh RWD Comfort'],
  })

  check('an exactly agreeing variant is PROVEN', assessment.verdict === 'proven', assessment.verdict)
  check('   and stops blocking variant-sensitive fields', !assessment.blocksVariantSensitive)
  check(
    '   at the brand-model-variant tier',
    assessment.tier === 'brand-model-variant',
    assessment.tier,
  )

  const withYear = assessIdentity({
    source: identityFromSource(
      sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4, modelYear: 2025 }),
    ),
    car: carIdentityOf(sealRow({ variant: '61.4 kWh RWD Comfort', modelYear: 2025 })),
  })
  check(
    '   adding an agreeing year reaches the strongest name-based tier',
    withYear.tier === 'brand-model-variant-year' && withYear.verdict === 'proven',
    withYear.tier,
  )

  // A different spelling is NOT forgiven — no fuzzy matching anywhere.
  const spelled = assessIdentity({
    source: identityFromSource(sealRecord('Comfort 61.4 kWh RWD')),
    car: carIdentityOf(sealRow({ variant: '61.4 kWh RWD Comfort' })),
  })
  check(
    '   a reordered spelling is a MISMATCH, not a near-match',
    spelled.verdict === 'mismatch',
    spelled.reason,
  )
  check('   sameVariant does no fuzzy comparison', !sameVariant('82.5 RWD Design', '82.5 AWD Excellence'))
  check('   but is insensitive to case and punctuation', sameVariant('GT-Line', 'gt line'))
}

// ── 4. Same model, different year ────────────────────────────────────
console.log('\n4. SAME MODEL, DIFFERENT YEAR')
{
  const assessment = assessIdentity({
    source: identityFromSource(sealRecord('61.4 kWh RWD Comfort', { modelYear: 2023 })),
    car: carIdentityOf(sealRow({ variant: '61.4 kWh RWD Comfort', modelYear: 2025 })),
  })
  check(
    'two stated years that differ is a MISMATCH even with the variant agreeing',
    assessment.verdict === 'mismatch',
    assessment.reason,
  )

  const oneSilent = assessIdentity({
    source: identityFromSource(sealRecord('61.4 kWh RWD Comfort', { modelYear: null })),
    car: carIdentityOf(sealRow({ variant: '61.4 kWh RWD Comfort', modelYear: 2025 })),
  })
  check(
    '   one side being silent about the year is not a contradiction',
    oneSilent.verdict === 'proven',
    oneSilent.reason,
  )

  // And the matcher's year guard is now live rather than dead code.
  const catalogue: MatchCandidateCar[] = [
    { id: 'byd-seal', slug: 'byd-seal', brand: 'BYD', model: 'Seal', fullName: 'BYD Seal', category: 'EV', modelYear: 2025 },
  ]
  const blocked = match(toMatchInput(sealRecord(null, { modelYear: 2023 })), catalogue)
  check(
    '   the matcher blocks the pair outright on a year contradiction',
    blocked.decision === 'none' && blocked.blocked.length === 1,
    blocked.blocked[0]?.reason,
  )
}

// ── 5. Same model, different battery ─────────────────────────────────
console.log('\n5. SAME MODEL, DIFFERENT BATTERY')
{
  const car = sealRow()
  const parsed = [
    { record: record('rec-87'), vehicle: sealRecord('U 87 kWh Design', { usableBatteryCapacityKwh: 87 }) },
  ]

  const decision = decideField(car, fieldMapping('batteryCapacity'), parsed)
  check('a differing battery still produces a proposal', decision !== null)
  check(
    '   marked variant-sensitive',
    decision?.variantSensitive === true,
  )
  check(
    '   and graded HIGH-RISK because the variant is unproven',
    decision?.risk.level === 'high-risk',
    decision?.risk.reason,
  )
  check('   excluded from bulk approval', decision?.risk.excludeFromBulk === true)
  check(
    '   the reason tells the reviewer what to do',
    decision?.risk.reason.includes('Confirm which variant') === true,
    decision?.risk.reason,
  )
}

// ── 6. Different range standards ─────────────────────────────────────
console.log('\n6. DIFFERENT RANGE STANDARDS')
{
  const cltcVsWltp = compareStandards('cltc', 'wltp')
  check('CLTC and WLTP are not comparable', !cltcVsWltp.comparable, cltcVsWltp.reason)
  check('   and the difference requires review', cltcVsWltp.requiresReview)
  check(
    '   the reason explains they are different measurements',
    cltcVsWltp.reason.includes('different measurements'),
    cltcVsWltp.reason,
  )

  const same = compareStandards('wltp', 'wltp')
  check('   the same cycle both sides IS comparable', same.comparable, same.reason)
  check('   and needs no review on that ground', !same.requiresReview)

  check('   EPA is recognised', toRangeStandard('EPA est.') === 'epa')
  check('   CLTC is recognised', toRangeStandard('CLTC (combined)') === 'cltc')
  check('   NEDC is recognised', toRangeStandard('nedc') === 'nedc')
  check('   JC08 is recognised', toRangeStandard('JC08') === 'jc08')
}

// ── 7. Unknown range standard ────────────────────────────────────────
console.log('\n7. UNKNOWN RANGE STANDARD')
{
  check(
    'an unrecognised label becomes unspecified, never a guess',
    toRangeStandard('some cycle nobody has heard of') === 'unspecified',
  )
  check('   as does an absent one', toRangeStandard(null) === 'unspecified')
  check('   and an empty one', toRangeStandard('   ') === 'unspecified')

  const unknownVsKnown = compareStandards('cltc', 'unspecified')
  check(
    'an unspecified figure cannot replace a CLTC one',
    !unknownVsKnown.comparable,
    unknownVsKnown.reason,
  )

  const bothUnknown = compareStandards('unspecified', 'unspecified')
  check(
    '   and two unspecified figures are NOT comparable either',
    !bothUnknown.comparable,
    bothUnknown.reason,
  )
  check(
    '   because "neither of us knows" is not agreement',
    bothUnknown.requiresReview,
  )

  /*
    The exact byd-seal range case, through the policy layer: 650 CLTC in the
    catalogue, 425 unspecified from the source.
  */
  const risk = assess({
    comparison: {
      field: 'range',
      currentValue: 650,
      proposedValue: 425,
      proposedRaw: '425',
      unit: 'km',
      changeType: 'changed',
      claims: [],
      winner: 'openev',
      conflicting: false,
      validationFlags: [],
      reason: 'fixture',
    },
    confidence: { score: 65, reasons: [] } as never,
    match: { decision: 'confident', candidates: [], strategy: 'exact-parts', score: 90 },
    identity: {
      tier: 'brand-model-variant',
      verdict: 'proven',
      reason: 'fixture: variant proven, so only the cycle is in question',
      blocksVariantSensitive: false,
      rivals: [],
    },
    currentRangeStandard: 'cltc',
    proposedRangeStandard: 'unspecified',
  })
  check(
    '425 unspecified must NOT replace 650 CLTC even with the variant proven',
    risk.level === 'high-risk',
    risk.reason,
  )
  check('   and is excluded from bulk approval', risk.excludeFromBulk)
}

// ── 8. Exact external ID ─────────────────────────────────────────────
console.log('\n8. EXACT EXTERNAL ID')
{
  const assessment = assessIdentity({
    source: identityFromSource(sealRecord(null, { externalId: 'c2832ebc-649e' })),
    car: carIdentityOf(sealRow()),
    confirmedExternalIds: ['c2832ebc-649e'],
  })

  check(
    'a confirmed external id proves the variant without either side spelling one',
    assessment.verdict === 'proven' && assessment.tier === 'external-id',
    assessment.reason,
  )
  check('   and unblocks variant-sensitive fields', !assessment.blocksVariantSensitive)

  const unconfirmed = assessIdentity({
    source: identityFromSource(sealRecord(null, { externalId: 'c2832ebc-649e' })),
    car: carIdentityOf(sealRow()),
    confirmedExternalIds: [],
  })
  check(
    '   an UNCONFIRMED external id proves nothing',
    unconfirmed.verdict === 'unproven',
    unconfirmed.reason,
  )
}

// ── 9. Model-only source ─────────────────────────────────────────────
console.log('\n9. MODEL-ONLY SOURCE')
{
  const assessment = assessIdentity({
    source: identityFromSource(sealRecord(null)),
    car: carIdentityOf(sealRow()),
  })
  check(
    'neither side stating a variant is unproven, not proven-by-default',
    assessment.verdict === 'unproven',
    assessment.reason,
  )
  check('   and blocks variant-sensitive fields', assessment.blocksVariantSensitive)

  /*
    The subtlety that model-level uniqueness hides. There is exactly one "BYD
    Seal" row, so a model-only record matches it uniquely — and uniqueness is not
    proof of variant. This is the trap the old code fell into.
  */
  const catalogue: MatchCandidateCar[] = [
    { id: 'byd-seal', slug: 'byd-seal', brand: 'BYD', model: 'Seal', fullName: 'BYD Seal', category: 'EV' },
  ]
  const result = match(toMatchInput(sealRecord('U 87 kWh Design')), catalogue)
  check(
    '   the matcher still confidently identifies the MODEL',
    result.decision === 'confident' && result.best?.strategy === 'exact-parts',
    `${result.decision}/${result.best?.strategy}`,
  )
  check(
    '   and now says out loud that the trim is not established',
    result.best?.reason.includes('not established') === true,
    result.best?.reason,
  )
}

// ── 10. Ambiguous variant ────────────────────────────────────────────
console.log('\n10. AMBIGUOUS VARIANT')
{
  // Two catalogue rows for one model, source names no variant.
  const siblings = [
    identityFromCar({ slug: 'byd-seal-comfort', brand: 'BYD', model: 'Seal', variant: '61.4 kWh RWD Comfort' }),
    identityFromCar({ slug: 'byd-seal-design', brand: 'BYD', model: 'Seal', variant: '82.5 kWh RWD Design' }),
  ]

  const assessment = assessIdentity({
    source: identityFromSource(sealRecord(null)),
    car: siblings[0]!,
    siblings,
  })

  check(
    'two catalogue variants and a variant-less source is AMBIGUOUS',
    assessment.verdict === 'ambiguous',
    assessment.reason,
  )
  check(
    '   the reason states how many rows it could be',
    assessment.reason.includes('2 rows'),
    assessment.reason,
  )
  check('   and it blocks variant-sensitive fields', assessment.blocksVariantSensitive)
  check(
    '   the rival is named so a reviewer can compare',
    assessment.rivals.includes('byd-seal-design'),
    assessment.rivals.join(', '),
  )
}

// ── 11. Variant-sensitive fields ─────────────────────────────────────
console.log('\n11. VARIANT-SENSITIVE FIELDS')
{
  const sensitive = [
    'batteryCapacity',
    'usableBatteryCapacity',
    'range',
    'electricRange',
    'power',
    'torque',
    'acceleration',
    'topSpeed',
    'dcCharging',
    'acCharging',
    'priceMin',
    'priceMax',
    'modelYear',
  ]
  for (const field of sensitive) {
    check(`   ${field} is variant-sensitive`, isVariantSensitive(field))
  }
  check(
    '   and an unrecognised column is treated as sensitive, failing closed',
    isVariantSensitive('someColumnAddedNextYear'),
  )
}

// ── 12. Shared model-level fields ────────────────────────────────────
console.log('\n12. SHARED MODEL-LEVEL FIELDS')
{
  for (const field of ['brand', 'model', 'fullName', 'category', 'seats', 'connectors', 'image']) {
    check(`   ${field} is model-level, not variant-sensitive`, !isVariantSensitive(field))
  }

  /*
    The byd-seal connectors change — "CCS2, Type 2" to "Type 2, CCS2" — was one of
    the five applied, and unlike the others it was harmless. A model-level field
    must not be blocked on variant grounds it has nothing to do with.
  */
  const car = sealRow()
  const parsed = [
    {
      record: record('rec-conn'),
      vehicle: sealRecord('U 87 kWh Design', { chargingStandards: ['Type 2', 'CCS2'] }),
    },
  ]
  const decision = decideField(car, fieldMapping('connectors'), parsed)
  if (decision) {
    check(
      '   a connectors change is not blocked by an unproven variant',
      decision.risk.level !== 'high-risk' || !decision.risk.reason.includes('variant'),
      `${decision.risk.level}: ${decision.risk.reason}`,
    )
    check('   and is not marked variant-sensitive', decision.variantSensitive === false)
  } else {
    check('   a connectors reorder is treated as no change at all', true, 'no proposal raised')
  }
}

// ── 13. PHEV variants ────────────────────────────────────────────────
console.log('\n13. PHEV VARIANTS')
{
  /*
    A PHEV carries two range figures with different meanings — total and electric —
    and its electric range is the one that moves between trims. Sealion 6 is the
    catalogue's PHEV, at 18.3 kWh.
  */
  const phev: CarLike = {
    id: 'byd-sealion-6',
    slug: 'byd-sealion-6',
    brand: 'BYD',
    model: 'Sealion 6',
    fullName: 'BYD Sealion 6',
    category: 'PHEV',
    variant: null,
    batteryCapacity: 18.3,
    electricRange: 92,
    electricRangeStandard: 'cltc',
  }

  const boosted = emptyVehicle({
    source: 'openev',
    sourceUrl: 'https://example.test/sealion-6-dmi',
    externalId: 'sealion-6-dmi',
    extractionMethod: 'dataset',
  })
  boosted.brand = 'BYD'
  boosted.model = 'Sealion 6'
  boosted.variant = 'DM-i 26.6 kWh Flagship'
  boosted.powertrainType = 'PHEV'
  boosted.electricRangeKm = 160
  boosted.confidence = 88
  boosted.fetchedAt = NOW.toISOString()

  const decision = decideField(phev, fieldMapping('electricRange'), [
    { record: record('rec-phev'), vehicle: boosted },
  ])

  check('a PHEV electric range change is proposed', decision !== null)
  check('   and is variant-sensitive', decision?.variantSensitive === true)
  check(
    '   blocked while the trim is unproven — a bigger pack is a different trim',
    decision?.risk.level === 'high-risk',
    decision?.risk.reason,
  )

  const assessment = assessIdentity({
    source: identityFromSource(boosted),
    car: identityFromCar({ slug: 'byd-sealion-6', brand: 'BYD', model: 'Sealion 6', variant: null }),
  })
  check(
    '   the PHEV row declaring no variant is why',
    assessment.verdict === 'unproven',
    assessment.reason,
  )
}

// ── 14. Duplicate source records ─────────────────────────────────────
console.log('\n14. DUPLICATE SOURCE RECORDS')
{
  /*
    The same variant twice is not ambiguity. Two records for "61.4 kWh RWD
    Comfort" — a re-crawl, or the same car listed twice — must not be mistaken for
    two vehicles competing.
  */
  const car = sealRow({ variant: '61.4 kWh RWD Comfort' })
  const twice = [
    { record: record('rec-a'), vehicle: sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4 }) },
    { record: record('rec-b'), vehicle: sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4 }) },
  ]

  const assessment = assessIdentity({
    source: identityFromSource(twice[0]!.vehicle),
    car: carIdentityOf(car),
    competingSourceVariants: competingVariants(twice),
  })

  check(
    'the same variant twice stays PROVEN — a duplicate is not a competitor',
    assessment.verdict === 'proven',
    assessment.reason,
  )
  check('   and does not block anything', !assessment.blocksVariantSensitive)

  const distinctTwice = new Set(competingVariants(twice))
  check('   the competing set deduplicates', distinctTwice.size === 1)
}

// ── 15. Conflicting sources ──────────────────────────────────────────
console.log('\n15. CONFLICTING SOURCES')
{
  /*
    Two DIFFERENT sources describing the SAME proven variant and disagreeing about
    a figure. That is a genuine source conflict — the thing the old queue message
    claimed was happening — and it must still be caught, without being confused
    with a variant problem.
  */
  const car = sealRow({ variant: '61.4 kWh RWD Comfort' })

  const fromOpenev = sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4, rangeKm: 550 })
  const fromOther = sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 58.0, rangeKm: 520 })

  const parsed = [
    { record: record('rec-openev', { sourceId: 'openev' }), vehicle: fromOpenev },
    { record: record('rec-evspecsx', { sourceId: 'evspecsx' }), vehicle: fromOther },
  ]

  const decision = decideField(car, fieldMapping('batteryCapacity'), parsed)
  check('a genuine two-source disagreement is proposed', decision !== null)
  check(
    '   and reported as a conflict',
    decision?.comparison.conflicting === true ||
      decision?.comparison.changeType === 'conflicting',
    decision?.comparison.changeType,
  )
  check('   with both claims attached', (decision?.comparison.claims.length ?? 0) === 2)
  check(
    '   the variant is PROVEN, so the reason is about the sources, not the trim',
    decision?.identity.verdict === 'proven',
    decision?.identity.reason,
  )
  check(
    '   and it is still never graded safe',
    decision?.risk.level !== 'safe',
    `${decision?.risk.level}: ${decision?.risk.reason}`,
  )
}

// ── weakestIdentity ──────────────────────────────────────────────────
console.log('\n16. THE WEAKEST CONTRIBUTOR GOVERNS')
{
  const proven: IdentityAssessment = {
    tier: 'brand-model-variant',
    verdict: 'proven',
    reason: 'fixture proven',
    blocksVariantSensitive: false,
    rivals: [],
  }
  const ambiguous: IdentityAssessment = {
    tier: 'brand-model',
    verdict: 'ambiguous',
    reason: 'fixture ambiguous',
    blocksVariantSensitive: true,
    rivals: [],
  }

  check(
    'one ambiguous contributor governs a group that is otherwise proven',
    weakestIdentity([proven, proven, ambiguous]).verdict === 'ambiguous',
  )
  check(
    '   so a well-identified record cannot launder unidentified ones',
    weakestIdentity([proven, ambiguous]).blocksVariantSensitive,
  )
  check(
    '   an empty group is unproven, not proven',
    weakestIdentity([]).verdict === 'unproven' && weakestIdentity([]).blocksVariantSensitive,
  )
}

// ── 17. Provenance points at the record that supplied the value ──────
console.log('\n17. PROVENANCE ATTRIBUTION')
{
  /*
    A second bug, found while writing the Phase 4.1 report.

    FieldComparison.winner is a SOURCE id, and all five Seal records came from
    "openev". proposeForCar picked the winning record with
    `contributors.find(r => r.sourceId === comparison.winner)` — which returns the
    FIRST openev record, not the one whose value won.

    So the stored proposal for an 87 kWh value carried the URL, the variant and
    the model year of the 61.4 kWh record. The audit trail named the wrong
    vehicle, which is worse than naming none: it reads as corroboration.
  */
  const car = sealRow()

  /*
    The real failure, reproduced exactly.

    Claims are ranked by trust and then by record confidence, so with five records
    from one source the ranking is decided by confidence alone. `contributors`,
    meanwhile, stays in the order the database returned. In the live data the
    61.4 kWh record came back first while the 87 kWh record — which had more fields
    filled, so a higher confidence — ranked first. The value came from one record
    and the provenance from the other.

    So: 61.4 first in the array, 87 highest in confidence.
  */
  const parsed = [
    {
      record: record('rec-comfort', { confidence: 80 }),
      vehicle: sealRecord('61.4 kWh RWD Comfort', { usableBatteryCapacityKwh: 61.4, confidence: 80 }),
    },
    {
      record: record('rec-71', { confidence: 85 }),
      vehicle: sealRecord('U 71.8 kWh Comfort', { usableBatteryCapacityKwh: 71.8, confidence: 85 }),
    },
    {
      record: record('rec-87', { confidence: 95 }),
      vehicle: sealRecord('U 87 kWh Design', { usableBatteryCapacityKwh: 87, confidence: 95 }),
    },
  ]

  const decision = decideField(car, fieldMapping('batteryCapacity'), parsed)
  check('the comparison identifies a winning record, not merely a source', decision?.comparison.winnerRecordId != null)

  const winningRecordId = decision?.comparison.winnerRecordId
  const winningVehicle = parsed.find(({ record: r }) => r.id === winningRecordId)?.vehicle

  check(
    '   the winning record is the one whose value was proposed',
    winningVehicle?.usableBatteryCapacityKwh === decision?.comparison.proposedValue,
    `record ${String(winningRecordId)} says ${String(winningVehicle?.usableBatteryCapacityKwh)}, proposal says ${String(decision?.comparison.proposedValue)}`,
  )
  check(
    '   *** it is NOT the first record from that source ***',
    winningRecordId === 'rec-87',
    `winner=${String(winningRecordId)}, first in array=rec-comfort`,
  )
  check(
    '   *** and the variant attributed is the winning value own variant ***',
    winningVehicle?.variant === 'U 87 kWh Design',
    String(winningVehicle?.variant),
  )
  check(
    '   the old source-id lookup would have named the wrong record',
    parsed.find((entry) => entry.record.sourceId === decision?.comparison.winner)?.record.id ===
      'rec-comfort',
    'which is how an 87 kWh value came to carry the 61.4 kWh record URL',
  )
  check(
    '   every claim names the record it came from, so five can be told apart',
    decision?.comparison.claims.every((claim) => typeof claim.recordId === 'string') === true,
  )
  check(
    '   and each competing claim carries its own record id',
    new Set(decision?.comparison.claims.map((c) => c.recordId)).size === 3,
    String(new Set(decision?.comparison.claims.map((c) => c.recordId)).size),
  )
}

// ─── THE CRITICAL REGRESSION ──────────────────────────────────────────

console.log('\nCRITICAL REGRESSION — 87 kWh MUST NOT OVERWRITE 61.44 kWh')
{
  /*
    Exactly what happened, replayed. The catalogue holds the 61.44 kWh Seal and
    declares no variant. The source publishes five variants including
    "U 87 kWh Design" at 87 kWh, 425 km, 140 kW DC.

    Before Phase 4.1 this produced riskLevel 'review' with confidence 45, an
    operator approved it, and the public catalogue said 87 kWh.
  */
  const car = sealRow()
  const parsed = fiveSealRecords()

  const battery = decideField(car, fieldMapping('batteryCapacity'), parsed)
  check('the battery change is still surfaced as a proposal', battery !== null)
  check(
    '   *** graded HIGH-RISK, not review ***',
    battery?.risk.level === 'high-risk',
    `${battery?.risk.level}: ${battery?.risk.reason}`,
  )
  check('   *** excluded from bulk approval ***', battery?.risk.excludeFromBulk === true)
  check(
    '   *** the variant verdict is ambiguous ***',
    battery?.identity.verdict === 'ambiguous',
    battery?.identity.verdict,
  )
  check(
    '   the reviewer is told five variants are competing',
    battery?.identity.reason.includes('5 different variants') === true,
    battery?.identity.reason,
  )

  const range = decideField(car, fieldMapping('range'), parsed)
  check('the range change is surfaced', range !== null)
  check(
    '   *** also HIGH-RISK ***',
    range?.risk.level === 'high-risk',
    `${range?.risk.level}: ${range?.risk.reason}`,
  )

  const dc = decideField(car, fieldMapping('dcCharging'), parsed)
  check('the DC charging change is surfaced', dc !== null)
  check(
    '   *** also HIGH-RISK — 110 vs 140 kW is a trim difference ***',
    dc?.risk.level === 'high-risk',
    `${dc?.risk.level}: ${dc?.risk.reason}`,
  )

  /*
    And the other half: once a person declares which variant the row is, the
    correct figure for that variant becomes approvable. The fix has to unblock the
    right answer, not merely block every answer.
  */
  const declared = sealRow({ variant: '61.4 kWh RWD Comfort', rangeStandard: 'unspecified' })
  const rightRecord = [
    {
      record: record('rec-right'),
      vehicle: sealRecord('61.4 kWh RWD Comfort', {
        usableBatteryCapacityKwh: 61.4,
        rangeKm: 370,
        rangeStandard: 'unspecified',
      }),
    },
  ]

  const afterDeclaring = decideField(declared, fieldMapping('batteryCapacity'), rightRecord)
  check(
    'once the row declares its variant, the MATCHING record is no longer blocked on variant',
    afterDeclaring === null || afterDeclaring.identity.verdict === 'proven',
    afterDeclaring === null
      ? '61.4 vs 61.44 is within tolerance, so no change is even proposed'
      : afterDeclaring.identity.reason,
  )

  const wrongRecordAfter = decideField(declared, fieldMapping('batteryCapacity'), [
    { record: record('rec-wrong'), vehicle: sealRecord('U 87 kWh Design', { usableBatteryCapacityKwh: 87 }) },
  ])
  check(
    '   *** and the 87 kWh record is now a MISMATCH, blocked outright ***',
    wrongRecordAfter?.identity.verdict === 'mismatch',
    wrongRecordAfter?.identity.reason,
  )
  check(
    '   still high-risk, with the contradiction stated',
    wrongRecordAfter?.risk.level === 'high-risk',
    wrongRecordAfter?.risk.reason,
  )
}

// ─── Summary ──────────────────────────────────────────────────────────

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} — ${checks} checks\n`)
process.exitCode = failures === 0 ? 0 : 1
