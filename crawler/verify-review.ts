// crawler/verify-review.ts
//
// Exercises the Phase 3 layer: units, validation, comparison, confidence,
// policy, and matching against real catalogue names.
//
// Fixtures only — no database, no network. That is what makes the assertions
// about unit conversion and the powertrain rules reproducible rather than
// dependent on whatever is currently in dev.db.
//
// Run:  npm run crawl:verify-review

import { compareField, sameValue, type SourceClaim } from './compare'
import { explain, scoreComparison } from './confidence'
import { match, matchFromRecord, weakerDecision, type MatchCandidateCar } from './match'
import { assess } from './policy'
import {
  derivePriceDisplay,
  formatPriceDisplay,
  parsePriceDisplay,
  unitFor,
} from '../src/lib/price-display'
import { decideField, governingMatch, FIELD_MAP, type CarLike, type RecordLike } from './proposals'
import { trustFor } from './priority-config'
import { toKm, toKmh, toKg, toKwh, toHp, toMm, toNm, toPkr } from './units'
import { validateCrossField, validateField } from './validate'

let failures = 0

function check(label: string, condition: boolean, detail = '') {
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

/** A claim, with the boilerplate defaulted. */
function claim(partial: Partial<SourceClaim> & Pick<SourceClaim, 'sourceId' | 'role' | 'value'>): SourceClaim {
  return {
    raw: String(partial.value ?? ''),
    sourceUrl: `https://example.com/${partial.sourceId}`,
    fetchedAt: new Date().toISOString(),
    recordConfidence: 80,
    ...partial,
  }
}

const CATALOGUE: MatchCandidateCar[] = [
  { id: 'byd-atto-3-advanced', slug: 'byd-atto-3-advanced', brand: 'BYD', model: 'Atto 3 Advanced', fullName: 'BYD Atto 3 Advanced', category: 'EV' },
  { id: 'byd-sealion-6', slug: 'byd-sealion-6', brand: 'BYD', model: 'Sealion 6', fullName: 'BYD Sealion 6', category: 'PHEV' },
  { id: 'byd-sealion-7-advanced', slug: 'byd-sealion-7-advanced', brand: 'BYD', model: 'Sealion 7 Advanced', fullName: 'BYD Sealion 7 Advanced', category: 'EV' },
  { id: 'kia-ev9-gt-line', slug: 'kia-ev9-gt-line', brand: 'KIA', model: 'EV9 GT-Line', fullName: 'KIA EV9 GT-Line', category: 'EV' },
  { id: 'chery-tiggo-8-phev', slug: 'chery-tiggo-8-phev', brand: 'Chery', model: 'Tiggo 8 PHEV', fullName: 'Chery Tiggo 8 PHEV', category: 'PHEV' },
  { id: 'toyota-corolla-cross-hev', slug: 'toyota-corolla-cross-hev', brand: 'Toyota', model: 'Corolla Cross Hybrid', fullName: 'Toyota Corolla Cross Hybrid', category: 'Hybrid' },
]

console.log('\nPHASE 3 — COMPARISON, CONFIDENCE, POLICY\n')

// ── 6. Unit normalisation ─────────────────────────────────────────────
console.log('UNIT NORMALISATION')
check('298 miles -> 479.6 km', toKm('298 miles').value === 479.6)
check('a bare range number is refused, not assumed', toKm('298').value === null, toKm('298').problem ?? '')
check('a bare number is accepted when the field says km', toKm('298', 'km').value === 298)
check('the raw value is preserved', toKm('298 miles').raw === '298 miles')
check('the conversion is recorded', (toKm('298 miles').conversion ?? '').includes('mi ->'))
check('75000 Wh -> 75 kWh', toKwh('75000 Wh').value === 75)
check('a bare battery number is kWh', toKwh('77.4').value === 77.4)
check('155 mph -> 249.4 km/h', toKmh('155 mph').value === 249.4)
check('4000 lbs -> 1814 kg', toKg('4000 lbs').value === 1814)
check('150 kW -> 201 hp', toHp('150 kW').value === 201)
check('a bare power number stays hp', toHp('204').value === 204)
check('330 lb-ft -> 447 Nm', toNm('330 lb-ft').value === 447)
check('4.6 m -> 4600 mm', toMm('4.6 m').value === 4600)
check('"1.05 Cr" -> 10,500,000 PKR', toPkr('1.05 Cr').value === 10_500_000)
check('"PKR 72.9 Lakh" -> 7,290,000', toPkr('PKR 72.9 Lakh').value === 7_290_000)
check('a USD price is refused, not converted', toPkr('$45,000').value === null, toPkr('$45,000').problem ?? '')
check('a decimal comma is read as a decimal', toKwh('77,4 kWh').value === 77.4)
check('a thousands comma is grouping', toPkr('Rs 8,500,000').value === 8_500_000)

// ── 5. Validation ─────────────────────────────────────────────────────
console.log('\nVALIDATION')
check('a negative battery is impossible', validateField('batteryCapacity', -5).some((f) => f.severity === 'impossible'))
check('a negative range is impossible', validateField('range', -1).some((f) => f.severity === 'impossible'))
check('a negative charging rate is impossible', validateField('dcCharging', -50).some((f) => f.severity === 'impossible'))
check('a negative acceleration is impossible', validateField('acceleration', -3).some((f) => f.severity === 'impossible'))
check('1 seat is implausible', validateField('seats', 1).length > 0)
check('2.5 seats is impossible', validateField('seats', 2.5).some((f) => f.severity === 'impossible'))
check('a 900 km/h top speed is implausible', validateField('topSpeed', 900).length > 0)
check('a PKR 500 car is implausible', validateField('priceMin', 500).length > 0)
check('a normal battery passes', validateField('batteryCapacity', 77.4).length === 0)

check(
  'a hybrid cannot have a DC rate',
  validateCrossField({ category: 'Hybrid', dcCharging: 60 }).some((f) => f.severity === 'impossible'),
)
check(
  'a hybrid cannot have a connector',
  validateCrossField({ category: 'Hybrid', connectors: ['CCS2'] }).some((f) => f.severity === 'impossible'),
)
check(
  "a PHEV's range must not land in the BEV column",
  validateCrossField({ category: 'PHEV', range: 85 }).some((f) => f.severity === 'impossible'),
)
check(
  'an EV cannot have an engine',
  validateCrossField({ category: 'EV', engineCapacity: 1498 }).some((f) => f.severity === 'impossible'),
)
check(
  'an inverted span is impossible',
  validateCrossField({ range: 500, rangeMax: 400 }).some((f) => f.severity === 'impossible'),
)
check(
  'battery against range catches an absurd efficiency',
  validateCrossField({ category: 'EV', batteryCapacity: 60, range: 1000 }).length > 0,
)
check(
  'and catches the realistic mile/km mix-up: 480 km read as 480 miles',
  validateCrossField({ category: 'EV', batteryCapacity: 60, range: 772 }).length > 0,
)
check(
  'a realistic pair passes',
  validateCrossField({ category: 'EV', batteryCapacity: 60.48, range: 420 }).length === 0,
)

// ── 1 & 2. Comparison and change detection ────────────────────────────
console.log('\nCOMPARISON AND CHANGE DETECTION')
{
  // The brief's worked example: current 77.4, source A 77.4, source B 77.0.
  const c = compareField({
    field: 'batteryCapacity',
    currentValue: 77.4,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 77.4 }),
      claim({ sourceId: 'B', role: 'aggregator', value: 77.0 }),
    ],
  })
  check('77.4 vs 77.0 is rounding, not a conflict', !c.conflicting, c.changeType)
  check('and it reads as unchanged', c.changeType === 'unchanged')
}
{
  const c = compareField({
    field: 'range',
    currentValue: 480,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'ev-database', value: 530 })],
  })
  check('480 -> 530 km is a change', c.changeType === 'changed', c.reason)
  check('the current value is kept for display', c.currentValue === 480)
}
{
  const c = compareField({
    field: 'batteryCapacity',
    currentValue: 77.4,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 82.5 }),
      claim({ sourceId: 'B', role: 'aggregator', value: 71.8 }),
    ],
  })
  check('genuinely different figures conflict', c.conflicting && c.changeType === 'conflicting')
  check('the specialist wins the proposal', c.winner === 'A', String(c.proposedValue))
  check('the losing claim is retained', c.claims.length === 2)
}
{
  const c = compareField({
    field: 'torque',
    currentValue: null,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'manufacturer', value: 350 })],
  })
  check('an empty field getting a value is "new"', c.changeType === 'new')
}
{
  const c = compareField({ field: 'seats', currentValue: 5, category: 'EV', claims: [] })
  check('no source value leaves the catalogue alone', c.changeType === 'missing')
  check('and it is explicitly NOT cleared', c.proposedValue === null && c.reason.includes('NOT cleared'))
}
{
  const c = compareField({
    field: 'dcCharging',
    currentValue: 60,
    category: 'Hybrid',
    claims: [claim({ sourceId: 'A', role: 'aggregator', value: 100 })],
  })
  check('a hybrid charging figure is suspicious', c.changeType === 'suspicious', c.reason)
}
{
  const c = compareField({
    field: 'range',
    currentValue: 400,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 450 }),
      claim({ sourceId: 'B', role: 'open-dataset', value: 450 }),
    ],
  })
  check('two sources agreeing against the catalogue is source-disagreement', c.changeType === 'source-disagreement')
}
check('sameValue treats 77.4 and 77 as one claim', sameValue(77.4, 77))
check('sameValue keeps 400 and 450 apart', !sameValue(400, 450))
check('sameValue compares lists order-independently', sameValue(['CCS2', 'Type 2'], ['Type 2', 'CCS2']))

// ── 3. Source priority ────────────────────────────────────────────────
console.log('\nSOURCE PRIORITY')
check('a distributor outranks an EV database on price', trustFor('pk-distributor', 'priceMin') > trustFor('ev-database', 'priceMin'))
check('an EV database outranks a distributor on battery', trustFor('ev-database', 'batteryCapacity') > trustFor('pk-distributor', 'batteryCapacity'))
check('the manufacturer outranks everyone on charging', trustFor('manufacturer', 'dcCharging') > trustFor('ev-database', 'dcCharging'))
check('an EV database has no say on Pakistani availability', trustFor('ev-database', 'availability') === 0)
check('a manual entry outranks every automated source', trustFor('manual', 'priceMin') > trustFor('pk-distributor', 'priceMin'))
{
  const c = compareField({
    field: 'priceMin',
    currentValue: 15_000_000,
    claims: [
      claim({ sourceId: 'global', role: 'ev-database', value: 9_000_000 }),
      claim({ sourceId: 'local', role: 'pk-distributor', value: 15_500_000 }),
    ],
  })
  check('a zero-trust source is excluded from the price contest', c.winner === 'local', String(c.proposedValue))
  check('and its claim does not create a conflict', !c.conflicting)
}

// ── 4. Confidence ─────────────────────────────────────────────────────
console.log('\nCONFIDENCE')
{
  const agreeing = compareField({
    field: 'batteryCapacity',
    currentValue: null,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 77.4 }),
      claim({ sourceId: 'B', role: 'open-dataset', value: 77.4 }),
      claim({ sourceId: 'C', role: 'aggregator', value: 77.4 }),
    ],
  })
  const alone = compareField({
    field: 'batteryCapacity',
    currentValue: null,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'ev-database', value: 77.4 })],
  })
  const many = scoreComparison(agreeing)
  const one = scoreComparison(alone)
  check('three agreeing sources beat one', many.score > one.score, `${many.score} vs ${one.score}`)
  check('three agreeing sources read as high', many.band === 'high', String(many.score))
  check('the reasoning is recorded, not just the number', explain(many).includes('other source'))

  const conflicted = compareField({
    field: 'batteryCapacity',
    currentValue: null,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 82.5 }),
      claim({ sourceId: 'B', role: 'aggregator', value: 71.8 }),
    ],
  })
  check('a conflict scores below a lone claim', scoreComparison(conflicted).score < one.score)

  const stale = compareField({
    field: 'priceMin',
    currentValue: null,
    claims: [
      claim({
        sourceId: 'old',
        role: 'pk-market',
        value: 18_500_000,
        fetchedAt: new Date(Date.now() - 500 * 86_400_000).toISOString(),
      }),
    ],
  })
  const fresh = scoreComparison(stale)
  check('a single old price is not high confidence', fresh.band !== 'high', `${fresh.score} (${fresh.band})`)
  check('and the age is given as the reason', explain(fresh).includes('days old'))

  const impossible = compareField({
    field: 'batteryCapacity',
    currentValue: 60,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'manufacturer', value: -5 })],
  })
  check('an impossible value scores zero whatever its source', scoreComparison(impossible).score === 0)
  check('no automated proposal reaches 100', many.score <= 95, String(many.score))
}

// ── 7. Matching ───────────────────────────────────────────────────────
console.log('\nMATCHING')
const norm = (brand: string, model: string, year: number | null = null) => ({
  brand, model, variant: null, modelYear: year, fullName: `${brand} ${model}`,
  category: null, priceMin: null, priceMax: null, priceRaw: null, batteryKwh: null,
  rangeKm: null, electricRangeKm: null, powerHp: null, accelerationSec: null,
  topSpeedKph: null, torqueNm: null, seats: null, dcKw: null, acKw: null,
  engineCc: null, connectors: [], imageUrl: null,
})

check('exact match is confident', match({ normalised: norm('BYD', 'Atto 3 Advanced') }, CATALOGUE).decision === 'confident')
{
  const r = match({ normalised: norm('BYD', 'Sealion 6') }, CATALOGUE)
  check('Sealion 6 matches only Sealion 6', r.best?.car.id === 'byd-sealion-6')
  check('Sealion 7 is blocked by the number guard', r.blocked.some((b) => b.car.id === 'byd-sealion-7-advanced'))
}
{
  const r = match({ normalised: norm('Chery', 'Tiggo 8 PHEV') }, CATALOGUE)
  check('Tiggo 8 does not reach Tiggo 7 or 9', r.best?.car.id === 'chery-tiggo-8-phev')
}
{
  const r = match({ normalised: norm('BYD', 'Atto 3') }, CATALOGUE)
  check('a bare "Atto 3" does not silently take the Advanced trim', r.decision !== 'confident', r.decision)
}
{
  const r = match({ normalised: norm('Ford', 'Mustang Mach-E') }, CATALOGUE)
  check('an unknown car matches nothing', r.decision === 'none')
}
{
  const r = match(
    { normalised: norm('KIA', 'EV9 GT-Line'), externalId: 'x-1', knownExternalIds: { 'x-1': 'kia-ev9-gt-line' } },
    CATALOGUE,
  )
  check('a confirmed external id wins outright', r.best?.strategy === 'external-id' && r.best.score === 100)
}
{
  const scores = CATALOGUE.map((car) => match({ normalised: norm(car.brand, car.model) }, CATALOGUE))
  check('every catalogue car matches itself', scores.every((r) => r.decision === 'confident'))
  check('and none scores below 80 when confident', scores.every((r) => (r.best?.score ?? 0) >= 80))
}

// ── 13. Update policy ─────────────────────────────────────────────────
//
// Each of these isolates one policy rule, so each passes a PROVEN variant
// identity. Phase 4.1 made variant identity an input to `assess`, and its default
// when absent is to refuse variant-sensitive fields — correct for production and
// wrong for a unit test of the price rule, which would then pass for the wrong
// reason. The fail-closed default has its own test immediately below.
console.log('\nUPDATE POLICY')

/** Variant established, so these tests exercise the rule they name. */
const PROVEN = {
  tier: 'brand-model-variant' as const,
  verdict: 'proven' as const,
  reason: 'fixture: variant agreed exactly',
  blocksVariantSensitive: false,
  rivals: [],
}
{
  /*
    The fail-closed default itself.

    A caller that says nothing about the variant has not established it, and a
    variant-level field must not be applied on that basis. This is the rule whose
    absence let an 87 kWh figure overwrite 61.44 kWh.
  */
  const noIdentity = compareField({
    field: 'batteryCapacity',
    currentValue: 61.44,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'open-dataset', value: 87 })],
  })
  const risk = assess({ comparison: noIdentity, confidence: scoreComparison(noIdentity) })
  check(
    'a variant-sensitive field with NO identity assessment is high risk',
    risk.level === 'high-risk',
    risk.reason,
  )
  check('   and never bulk-eligible', risk.excludeFromBulk)
  check(
    '   the reason says the variant was not established',
    risk.reason.includes('no variant identity was established'),
    risk.reason,
  )
}
{
  const safeChange = compareField({
    field: 'torque',
    currentValue: null,
    category: 'EV',
    claims: [
      claim({ sourceId: 'A', role: 'ev-database', value: 350 }),
      claim({ sourceId: 'B', role: 'open-dataset', value: 350 }),
    ],
  })
  const risk = assess({ comparison: safeChange, confidence: scoreComparison(safeChange), identity: PROVEN })
  check('filling a gap with agreeing sources is safe', risk.level === 'safe', risk.reason)
  check('and it is bulk-eligible', !risk.excludeFromBulk)
}
{
  const priceJump = compareField({
    field: 'priceMin',
    currentValue: 15_000_000,
    claims: [claim({ sourceId: 'local', role: 'pk-distributor', value: 19_000_000 })],
  })
  const risk = assess({ comparison: priceJump, confidence: scoreComparison(priceJump), identity: PROVEN })
  check('a 27% price jump is high risk', risk.level === 'high-risk', risk.reason)
  check('and it is never bulk-eligible', risk.excludeFromBulk)
}
{
  const smallPrice = compareField({
    field: 'priceMin',
    currentValue: 15_000_000,
    claims: [claim({ sourceId: 'local', role: 'pk-distributor', value: 15_300_000 })],
  })
  const risk = assess({ comparison: smallPrice, confidence: scoreComparison(smallPrice), identity: PROVEN })
  check('even a small price change needs reading', risk.level === 'review' && risk.excludeFromBulk)
}
{
  const identity = compareField({
    field: 'model',
    currentValue: 'Sealion 6',
    claims: [claim({ sourceId: 'A', role: 'aggregator', value: 'Sealion 7' })],
  })
  const risk = assess({ comparison: identity, confidence: scoreComparison(identity), identity: PROVEN })
  check('renaming a car from crawled data is high risk', risk.level === 'high-risk', risk.reason)
}
{
  const good = compareField({
    field: 'range',
    currentValue: 400,
    category: 'EV',
    claims: [claim({ sourceId: 'A', role: 'manufacturer', value: 420 })],
  })
  const weakMatch = match({ normalised: norm('BYD', 'Atto 3') }, CATALOGUE)
  const risk = assess({
    comparison: good,
    confidence: scoreComparison(good),
    match: weakMatch,
    identity: PROVEN,
    /*
      Same cycle both sides, so this stays a test of the MATCH rule rather than
      becoming a test of the range-cycle rule.
    */
    currentRangeStandard: 'wltp',
    proposedRangeStandard: 'wltp',
  })
  check('a plausible value on a weak match is high risk', risk.level === 'high-risk', risk.reason)
  check('because a right value on the wrong car survives review', risk.excludeFromBulk)
}


// ── 14. The match tier reaches the live proposal path ─────────────────
//
// The rule that a weak match makes every field on a record high-risk was tested
// against `assess` directly and was correct there — but nothing passed a match
// into `assess` on the path the pipeline actually runs, so the rule was unwired.
// These exercise `decideField`, which IS that path: `proposeForCar` is a loop
// over it plus the writes.
console.log('\nMATCH TIER IN THE LIVE PROPOSAL PATH')

/**
 * A catalogue row, with only the columns the comparison reads.
 *
 * Declares a variant, and its test records declare the same one, so these tests
 * isolate the MATCH tier. Phase 4.1 added a second, independent gate — variant
 * identity — and without a declared variant every one of these would come back
 * high-risk for a reason that has nothing to do with what they are testing.
 *
 * The `PROVEN_VARIANT` constant is shared with the record fixture below so the two
 * cannot drift apart; a mismatch there would silently turn these into tests of the
 * variant rule.
 */
const PROVEN_VARIANT = 'DM-i 18.3 kWh Premium'

function carFixture(overrides: Partial<CarLike> = {}): CarLike {
  return {
    id: 'byd-sealion-6',
    slug: 'byd-sealion-6',
    fullName: 'BYD Sealion 6',
    category: 'PHEV',
    brand: 'BYD',
    model: 'Sealion 6',
    variant: PROVEN_VARIANT,
    trim: PROVEN_VARIANT,
    modelYear: null,
    generation: null,
    electricRangeStandard: 'cltc',
    range: null,
    electricRange: 90,
    torque: null,
    priceMin: 10_900_000,
    priceMax: 10_900_000,
    priceDisplay: 'PKR 1.09 Cr (indicative)',
    ...overrides,
  }
}

/**
 * A staging row, with the match columns a real one carries.
 *
 * The payload carries the brand, model and variant, because identity is read out
 * of the payload — a fixture that omits them describes a vehicle with no name,
 * which `assessIdentity` correctly calls a mismatch.
 */
function recordFixture(vehicle: Record<string, unknown>, columns: Partial<RecordLike> = {}): RecordLike {
  const payload = {
    brand: 'BYD',
    model: 'Sealion 6',
    variant: PROVEN_VARIANT,
    trim: PROVEN_VARIANT,
    modelYear: null,
    generation: null,
    electricRangeStandard: 'cltc',
    rangeStandard: 'cltc',
    ...vehicle,
  }

  return {
    id: `record-${columns.sourceId ?? 'A'}`,
    sourceId: 'openev',
    runId: 'run-1',
    sourceUrl: 'https://example.com/record',
    fetchedAt: new Date(),
    confidence: 80,
    raw: JSON.stringify(payload),
    normalised: JSON.stringify(payload),
    matchedCarId: 'byd-sealion-6',
    ...columns,
  }
}

/** One record, ready for decideField. */
function parsedFixture(vehicle: Record<string, unknown>, columns: Partial<RecordLike> = {}) {
  const record = recordFixture(vehicle, columns)
  return { record, vehicle: JSON.parse(record.normalised!) }
}

const ELECTRIC_RANGE_FIELD = FIELD_MAP.find((entry) => entry.car === 'electricRange')!
const TORQUE_FIELD = FIELD_MAP.find((entry) => entry.car === 'torque')!

{
  // The tiers, read back off the columns a staging row stores.
  check(
    'a stored exact-parts match reads back as confident',
    matchFromRecord({ matchStrategy: 'exact-parts', matchScore: 90 })?.decision === 'confident',
  )
  check(
    'a stored brand-model match reads back as probable, not confident',
    matchFromRecord({ matchStrategy: 'brand-model', matchScore: 65 })?.decision === 'probable',
  )
  check(
    'a stored "none" reads back as none',
    matchFromRecord({ matchStrategy: 'none', matchScore: null })?.decision === 'none',
  )
  check(
    'two close rivals read back as ambiguous',
    matchFromRecord({
      matchStrategy: 'exact-name',
      matchScore: 85,
      matchCandidates: JSON.stringify([
        { carId: 'a', score: 85 },
        { carId: 'b', score: 85 },
      ]),
    })?.decision === 'ambiguous',
  )
  check(
    'a distant rival does not make it ambiguous',
    matchFromRecord({
      matchStrategy: 'exact-parts',
      matchScore: 90,
      matchCandidates: JSON.stringify([
        { carId: 'a', score: 90 },
        { carId: 'b', score: 65 },
      ]),
    })?.decision === 'confident',
  )
  check(
    'a strategy with no score is placed by its tier, not assumed confident',
    matchFromRecord({ matchStrategy: 'brand-model' })?.decision === 'probable',
  )
  check(
    'a row with no match evidence at all reads back as null',
    matchFromRecord({ matchStrategy: null, matchScore: null, matchCandidates: null }) === null,
  )
  check(
    'unreadable candidate JSON does not throw',
    matchFromRecord({ matchCandidates: '{oops' }) === null,
  )
  check('the weaker of two decisions wins', weakerDecision('confident', 'probable') === 'probable')
}

{
  // 2. EXACT MATCH — keeps the treatment it had.
  const decision = decideField(carFixture(), TORQUE_FIELD, [
    parsedFixture({ torqueNm: 325 }, { matchStrategy: 'exact-parts', matchScore: 90 }),
  ])
  check('an exact match still produces a proposal', decision !== null)
  check(
    'and it is not made high-risk by the match check',
    decision!.risk.level !== 'high-risk',
    `${decision!.risk.level} — ${decision!.risk.reason}`,
  )
  check('its match reads as confident', decision!.match.evidence?.decision === 'confident')
  check('and it still carries a confidence score', decision!.confidence.score > 0)
}

{
  // 1. WEAK MATCH — a perfectly plausible figure on a probable match.
  const decision = decideField(carFixture(), TORQUE_FIELD, [
    parsedFixture({ torqueNm: 325 }, { matchStrategy: 'brand-model', matchScore: 65 }),
  ])
  check(
    'a weak match makes a plausible value high-risk on the live path',
    decision!.risk.level === 'high-risk',
    decision!.risk.reason,
  )
  check('and it is never bulk-eligible', decision!.risk.excludeFromBulk)
  check('the reason names the tier that caused it', decision!.risk.reason.includes('brand-model'))
}

{
  // An ambiguous match — several cars fitted equally well.
  const decision = decideField(carFixture(), TORQUE_FIELD, [
    parsedFixture(
      { torqueNm: 325 },
      {
        matchStrategy: 'exact-name',
        matchScore: 85,
        matchCandidates: JSON.stringify([
          { carId: 'byd-sealion-6', score: 85 },
          { carId: 'byd-sealion-7-advanced', score: 85 },
        ]),
      },
    ),
  ])
  check(
    'an ambiguous match is high-risk on the live path',
    decision!.risk.level === 'high-risk',
    decision!.risk.reason,
  )
  check('and the reason says how many cars fitted', decision!.risk.reason.includes('2 cars'))
}

{
  // A record whose match was never recorded: unknown, not weak.
  const decision = decideField(carFixture(), TORQUE_FIELD, [
    parsedFixture({ torqueNm: 325 }, { matchStrategy: null, matchScore: null }),
  ])
  check(
    'a record with no match evidence cannot be safe',
    decision!.risk.level !== 'safe',
    decision!.risk.reason,
  )
  check('but it is not called high-risk either', decision!.risk.level === 'review')
  check('and it is kept out of bulk approval', decision!.risk.excludeFromBulk)
}

{
  // The weakest contributor governs, so one good match cannot launder a bad one.
  const strong = recordFixture({ torqueNm: 325 }, { sourceId: 'openev', matchStrategy: 'exact-parts', matchScore: 90 })
  const weak = recordFixture({ torqueNm: 325 }, { sourceId: 'vehdb', matchStrategy: 'brand-model', matchScore: 65 })

  check(
    'the weakest match of a group is the one that governs',
    governingMatch([strong, weak]).evidence?.decision === 'probable',
  )
  check(
    'and one unrecorded record flags the whole group',
    governingMatch([strong, { ...weak, matchStrategy: null, matchScore: null }]).unrecorded,
  )

  const decision = decideField(carFixture(), TORQUE_FIELD, [
    { record: strong, vehicle: JSON.parse(strong.normalised!) },
    { record: weak, vehicle: JSON.parse(weak.normalised!) },
  ])
  check(
    'two sources agreeing does not rescue a weakly-matched one',
    decision!.risk.level === 'high-risk',
    decision!.risk.reason,
  )
}

{
  // 3. MODEL-NUMBER MISMATCH — the guard that keeps Sealion 6 and 7 apart is
  // still in force, and a record it refused cannot arrive as a safe proposal.
  const blocked = match({ normalised: norm('BYD', 'Sealion 7') }, CATALOGUE)
  check('Sealion 7 does not reach Sealion 6', blocked.best?.car.id !== 'byd-sealion-6')
  check(
    'and Sealion 6 is recorded as blocked, with the reason',
    blocked.blocked.some(
      (entry) => entry.car.id === 'byd-sealion-6' && entry.reason.includes('model numbers differ'),
    ),
  )

  const unknownNumber = match({ normalised: norm('BYD', 'Sealion 9') }, CATALOGUE)
  check('an unknown model number matches nothing at all', unknownNumber.decision === 'none')

  const decision = decideField(carFixture(), ELECTRIC_RANGE_FIELD, [
    parsedFixture({ electricRangeKm: 105 }, { matchStrategy: 'none', matchScore: null }),
  ])
  check(
    'a record the matcher never tied to a car is high-risk if it is proposed',
    decision!.risk.level === 'high-risk',
    decision!.risk.reason,
  )
  check(
    'and the reconstruction adds no fuzzy matching of its own',
    !/levenshtein|editDistance|similarity|fuzzy/i.test(matchFromRecord.toString()),
  )
}

// ── 15. Price consistency ─────────────────────────────────────────────
console.log('\nPRICE CONSISTENCY')
{
  const parsed = parsePriceDisplay('PKR 1.33–1.70 Cr')
  check('a span parses both ends', parsed?.min === 13_300_000 && parsed?.max === 17_000_000)
  check('and keeps its precision', parsed?.decimals === 2)

  const hedged = parsePriceDisplay('PKR 82 Lakh (indicative)')
  check('a qualifier is read, not discarded', hedged?.qualifier === '(indicative)')
  check('and Lakh is understood', hedged?.min === 8_200_000)

  check(
    'an unparseable string is refused rather than guessed',
    parsePriceDisplay('call for price') === null,
  )
  check('a dollar price is not read as rupees', parsePriceDisplay('$45,000') === null)
  check(
    'the unit follows the size of the figure',
    unitFor(9_900_000) === 'Lakh' && unitFor(10_000_000) === 'Cr',
  )
  check(
    'formatting is the inverse of parsing',
    formatPriceDisplay({ min: 10_500_000, max: 10_500_000, unit: 'Cr', decimals: 2 }) === 'PKR 1.05 Cr',
  )
}
{
  // priceMin moving, with the display carried along.
  const result = derivePriceDisplay({
    currentDisplay: 'PKR 1.09 Cr (indicative)',
    currentMin: 10_900_000,
    currentMax: 10_900_000,
    nextMin: 11_500_000,
    nextMax: 11_500_000,
  })
  check(
    'a priceMin rise rewrites the display string',
    result.ok && result.display === 'PKR 1.15 Cr (indicative)',
    result.ok ? result.display : result.reason,
  )
  check('and the qualifier survives', result.ok && result.display.includes('(indicative)'))
}
{
  // priceMax moving on a span.
  const result = derivePriceDisplay({
    currentDisplay: 'PKR 1.48–1.70 Cr',
    currentMin: 14_800_000,
    currentMax: 17_000_000,
    nextMin: 14_800_000,
    nextMax: 18_000_000,
  })
  check(
    'a priceMax rise updates the upper end alone',
    result.ok && result.display === 'PKR 1.48–1.80 Cr',
    result.ok ? result.display : result.reason,
  )
}
{
  const kept = derivePriceDisplay({
    currentDisplay: 'PKR 1.20 Cr',
    currentMin: 12_000_000,
    currentMax: 12_000_000,
    nextMin: 13_000_000,
    nextMax: 13_000_000,
  })
  check(
    "the catalogue's chosen precision is kept",
    kept.ok && kept.display === 'PKR 1.30 Cr',
    kept.ok ? kept.display : kept.reason,
  )
}
{
  const crossing = derivePriceDisplay({
    currentDisplay: 'PKR 89.9 Lakh',
    currentMin: 8_990_000,
    currentMax: 8_990_000,
    nextMin: 10_500_000,
    nextMax: 10_500_000,
  })
  check(
    'crossing a crore switches the unit',
    crossing.ok && crossing.display === 'PKR 1.05 Cr',
    crossing.ok ? crossing.display : crossing.reason,
  )

  const straddling = derivePriceDisplay({
    currentDisplay: 'PKR 89.9 Lakh',
    currentMin: 8_990_000,
    currentMax: 8_990_000,
    nextMin: 9_990_000,
    nextMax: 10_500_000,
  })
  check(
    'a span straddling a crore is refused, not invented',
    !straddling.ok,
    straddling.ok ? straddling.display : straddling.reason,
  )
}
{
  const unreadable = derivePriceDisplay({
    currentDisplay: 'from PKR 1.2 Cr onwards',
    currentMin: 12_000_000,
    currentMax: 12_000_000,
    nextMin: 13_000_000,
    nextMax: 13_000_000,
  })
  check('an unrewritable display refuses the whole change', !unreadable.ok)
  check('and says what a person must do', !unreadable.ok && unreadable.reason.includes('by hand'))

  const drifted = derivePriceDisplay({
    currentDisplay: 'PKR 1.20 Cr',
    currentMin: 11_000_000,
    currentMax: 11_000_000,
    nextMin: 13_000_000,
    nextMax: 13_000_000,
  })
  check(
    'a display that already disagrees is not used as a template',
    !drifted.ok,
    drifted.ok ? drifted.display : drifted.reason,
  )

  const unwritable = derivePriceDisplay({
    currentDisplay: 'PKR 1.20 Cr',
    currentMin: 12_000_000,
    currentMax: 12_000_000,
    nextMin: 10_649_321,
    nextMax: 10_649_321,
  })
  check(
    'a figure that will not write exactly is refused, not rounded',
    !unwritable.ok,
    unwritable.ok ? unwritable.display : unwritable.reason,
  )

  const backwards = derivePriceDisplay({
    currentDisplay: 'PKR 1.20 Cr',
    currentMin: 12_000_000,
    currentMax: 12_000_000,
    nextMin: 13_000_000,
    nextMax: 11_000_000,
  })
  check(
    'a lower price above the upper one is refused',
    !backwards.ok,
    backwards.ok ? backwards.display : backwards.reason,
  )
}
{
  const unchanged = derivePriceDisplay({
    currentDisplay: 'PKR 1.09 Cr (indicative)',
    currentMin: 10_900_000,
    currentMax: 10_900_000,
    nextMin: 10_900_000,
    nextMax: 10_900_000,
  })
  check('an unchanged price reports that no rewrite is needed', unchanged.ok && !unchanged.changed)
}


console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
process.exitCode = failures === 0 ? 0 : 1
