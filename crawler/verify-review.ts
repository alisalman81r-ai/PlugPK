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
import { match, type MatchCandidateCar } from './match'
import { assess } from './policy'
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
console.log('\nUPDATE POLICY')
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
  const risk = assess({ comparison: safeChange, confidence: scoreComparison(safeChange) })
  check('filling a gap with agreeing sources is safe', risk.level === 'safe', risk.reason)
  check('and it is bulk-eligible', !risk.excludeFromBulk)
}
{
  const priceJump = compareField({
    field: 'priceMin',
    currentValue: 15_000_000,
    claims: [claim({ sourceId: 'local', role: 'pk-distributor', value: 19_000_000 })],
  })
  const risk = assess({ comparison: priceJump, confidence: scoreComparison(priceJump) })
  check('a 27% price jump is high risk', risk.level === 'high-risk', risk.reason)
  check('and it is never bulk-eligible', risk.excludeFromBulk)
}
{
  const smallPrice = compareField({
    field: 'priceMin',
    currentValue: 15_000_000,
    claims: [claim({ sourceId: 'local', role: 'pk-distributor', value: 15_300_000 })],
  })
  const risk = assess({ comparison: smallPrice, confidence: scoreComparison(smallPrice) })
  check('even a small price change needs reading', risk.level === 'review' && risk.excludeFromBulk)
}
{
  const identity = compareField({
    field: 'model',
    currentValue: 'Sealion 6',
    claims: [claim({ sourceId: 'A', role: 'aggregator', value: 'Sealion 7' })],
  })
  const risk = assess({ comparison: identity, confidence: scoreComparison(identity) })
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
  const risk = assess({ comparison: good, confidence: scoreComparison(good), match: weakMatch })
  check('a plausible value on a weak match is high risk', risk.level === 'high-risk', risk.reason)
  check('because a right value on the wrong car survives review', risk.excludeFromBulk)
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
process.exitCode = failures === 0 ? 0 : 1
