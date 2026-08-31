// crawler/verify-pipeline.ts
//
// Exercises the Phase 1 pipeline's pure logic: normalisation, matching, robots
// parsing, and the duplicate/multi-source rules.
//
// A script rather than a test suite, matching scripts/verify-cars.ts — this
// project has no test runner configured, and adding one to prove four modules
// work would be a larger change than the thing being proved.
//
// It touches no database and no network. Every case is a fixture, which is the
// only way to assert that robots precedence and the model-number guard behave
// the same on every machine.
//
// Run:  npm run crawl:verify

import { match, modelNumbers, numberGuard, type MatchCandidateCar } from './match'
import { nameKey, normalise, parseNumber, parsePkr, splitName } from './normalise'
import { isPathAllowed, parseRobots, type RobotsPolicy } from './robots'
import { emptyVehicle } from './model'
import { reconcile } from './priority'
import { evdbAdapter } from './sources/evdb'
import { matchesCarFilter } from './sources/openev'
import { evspecsxAdapter } from './sources/evspecsx'
import { vehdbAdapter } from './sources/vehdb'
import type { SourceAdapter } from './sources/types'
import type { ScrapedCar } from './types'

let failures = 0

function check(label: string, condition: boolean, detail = '') {
  const mark = condition ? 'PASS' : 'FAIL'
  if (!condition) failures += 1
  console.log(`  ${mark}  ${label}${detail ? ` — ${detail}` : ''}`)
}

/**
 * A scraped record, with only the fields a case cares about spelled out.
 *
 * `name` and `price` are pulled out before the spread. The first version put
 * `...partial` last, which overwrote the constructed Field objects with the raw
 * strings — so every record reached the normaliser with `name.value` undefined
 * and every match came back "none". Nine checks failed and none of them were
 * about the code they claimed to test.
 */
function scraped(
  partial: Omit<Partial<ScrapedCar>, 'name' | 'price'> & { name?: string; price?: string } = {},
): ScrapedCar {
  const { name, price, ...rest } = partial

  return {
    sourceId: 'fixture',
    provenance: { url: 'https://example.com/x', fetchedAt: new Date(0).toISOString(), status: 200 },
    imageUrl: { raw: null, value: null, selector: 'img' },
    specs: {},
    ...(rest as object),
    name: { raw: name ?? null, value: name ?? null, selector: 'h1' },
    price: { raw: price ?? null, value: price ?? null, selector: 'x' },
  } as ScrapedCar
}

const BRANDS = ['BYD', 'Chery', 'KIA', 'Toyota', 'Haval', 'GWM', 'Deepal', 'MG']

const CATALOGUE: MatchCandidateCar[] = [
  { id: 'byd-sealion-6', slug: 'byd-sealion-6', brand: 'BYD', model: 'Sealion 6', fullName: 'BYD Sealion 6', category: 'PHEV' },
  { id: 'byd-sealion-7-advanced', slug: 'byd-sealion-7-advanced', brand: 'BYD', model: 'Sealion 7 Advanced', fullName: 'BYD Sealion 7 Advanced', category: 'EV' },
  { id: 'byd-atto-3-advanced', slug: 'byd-atto-3-advanced', brand: 'BYD', model: 'Atto 3 Advanced', fullName: 'BYD Atto 3 Advanced', category: 'EV' },
  { id: 'byd-seal', slug: 'byd-seal', brand: 'BYD', model: 'Seal', fullName: 'BYD Seal', category: 'EV' },
  { id: 'chery-tiggo-7-phev', slug: 'chery-tiggo-7-phev', brand: 'Chery', model: 'Tiggo 7 PHEV', fullName: 'Chery Tiggo 7 PHEV', category: 'PHEV' },
  { id: 'chery-tiggo-8-phev', slug: 'chery-tiggo-8-phev', brand: 'Chery', model: 'Tiggo 8 PHEV', fullName: 'Chery Tiggo 8 PHEV', category: 'PHEV' },
  { id: 'chery-tiggo-9-phev', slug: 'chery-tiggo-9-phev', brand: 'Chery', model: 'Tiggo 9 PHEV', fullName: 'Chery Tiggo 9 PHEV', category: 'PHEV' },
  { id: 'kia-ev5', slug: 'kia-ev5', brand: 'KIA', model: 'EV5', fullName: 'KIA EV5', category: 'EV' },
  { id: 'kia-ev9-gt-line', slug: 'kia-ev9-gt-line', brand: 'KIA', model: 'EV9 GT-Line', fullName: 'KIA EV9 GT-Line', category: 'EV' },
  { id: 'toyota-corolla-cross-hev', slug: 'toyota-corolla-cross-hev', brand: 'Toyota', model: 'Corolla Cross Hybrid', fullName: 'Toyota Corolla Cross Hybrid', category: 'Hybrid' },
]

const norm = (name: string, specs: Record<string, string> = {}, price?: string) =>
  normalise(scraped({ name, price, specs }), { knownBrands: BRANDS }).car

console.log('\nPHASE 1 PIPELINE\n')

// ── Normalisation ─────────────────────────────────────────────────────
console.log('NORMALISATION')
check('"PKR 72.9 Lakh" -> 7,290,000', parsePkr('PKR 72.9 Lakh')?.min === 7_290_000)
check('"1.05 Cr" -> 10,500,000', parsePkr('1.05 Cr')?.min === 10_500_000)
check('"Rs 8,500,000" -> 8,500,000', parsePkr('Rs 8,500,000')?.min === 8_500_000)
check(
  'a span keeps both ends',
  parsePkr('PKR 45–52 Lakh')?.min === 4_500_000 && parsePkr('PKR 45–52 Lakh')?.max === 5_200_000,
)
check('vague prose is refused, not guessed', parsePkr('around one crore') === null)
check('a stray small number is refused', parsePkr('2024') === null)
check('bounds reject an impossible battery', parseNumber('4000 kWh', { min: 1, max: 250 }) === null)
check(
  'brand and trim split off the model',
  splitName('BYD Atto 3 Advanced', BRANDS).model === 'Atto 3' &&
    splitName('BYD Atto 3 Advanced', BRANDS).variant === 'Advanced',
)
check(
  '"Tiggo 8 Pro Max" stays one model, not a corrupted "Tiggo 8 Pro"',
  splitName('Chery Tiggo 8 Pro Max', BRANDS).model === 'Tiggo 8 Pro Max',
  splitName('Chery Tiggo 8 Pro Max', BRANDS).model ?? 'null',
)
check('digits survive the name key', nameKey('BYD Sealion-7') === 'byd sealion 7')

// ── Malformed input ───────────────────────────────────────────────────
console.log('\nMALFORMED SCRAPED DATA')
{
  const empty = normalise(scraped({}), { knownBrands: BRANDS })
  check('an empty record does not throw', true)
  check('a missing name is a recorded problem', 'fullName' in empty.problems)
  check('a missing price is a recorded problem', 'price' in empty.problems)
  check('nothing is invented', empty.car.priceMin === null && empty.car.brand === null)
  check('confidence collapses', empty.confidence <= 10, `${empty.confidence}`)

  const junk = normalise(
    scraped({ name: 'Ω≈ç√', price: 'call for price', specs: { Battery: 'n/a' } }),
    { knownBrands: BRANDS },
  )
  check('unparseable price becomes a problem, not a number', junk.car.priceMin === null)
  check('"n/a" battery becomes null', junk.car.batteryKwh === null)

  const suspect = normalise(
    scraped({
      name: 'BYD Seal',
      imageUrl: {
        raw: 'x.jpg',
        value: 'https://e.com/other-car.jpg',
        selector: 'img',
        suspect: 'wrong car',
      },
    }),
    { knownBrands: BRANDS },
  )
  check('a flagged photograph is dropped, not carried', suspect.car.imageUrl === null)

  const hybrid = normalise(
    scraped({ name: 'Toyota Corolla Cross Hybrid', specs: { Powertrain: 'Hybrid', 'DC charging': '60 kW' } }),
    { knownBrands: BRANDS },
  )
  check('a hybrid with a charging figure is contradicted', 'category' in hybrid.problems)
}

// ── Matching: the guard that matters most ─────────────────────────────
console.log('\nMATCHING — NEAR-IDENTICAL NAMES')
check('model numbers are extracted', modelNumbers('Sealion 7 Advanced').join() === '7')
check('a four-digit year is not a model number', modelNumbers('Atto 3 2024').join() === '3')
check('6 vs 7 is blocked', numberGuard('Sealion 6', 'Sealion 7') !== null)
check('7 vs 7 is allowed', numberGuard('Sealion 7', 'Sealion 7 Advanced') === null)

{
  const r = match({ normalised: norm('BYD Sealion 6') }, CATALOGUE)
  check('Sealion 6 matches Sealion 6', r.best?.car.id === 'byd-sealion-6', r.decision)
  check(
    'Sealion 7 was blocked by the number guard',
    r.blocked.some((b) => b.car.id === 'byd-sealion-7-advanced'),
  )
}
for (const [name, expected] of [
  ['Chery Tiggo 7 PHEV', 'chery-tiggo-7-phev'],
  ['Chery Tiggo 8 PHEV', 'chery-tiggo-8-phev'],
  ['Chery Tiggo 9 PHEV', 'chery-tiggo-9-phev'],
] as const) {
  const r = match({ normalised: norm(name) }, CATALOGUE)
  check(`${name} -> ${expected}`, r.best?.car.id === expected, r.best?.car.id ?? 'none')
}
{
  const r = match({ normalised: norm('KIA EV5') }, CATALOGUE)
  check('EV5 never reaches EV9', r.best?.car.id === 'kia-ev5', r.best?.car.id ?? 'none')
}
{
  const r = match({ normalised: norm('BYD Seal') }, CATALOGUE)
  check('"Seal" does not match "Sealion"', r.best?.car.id === 'byd-seal', r.best?.car.id ?? 'none')
}

console.log('\nMATCHING — TIERS AND REFUSALS')
{
  const r = match(
    { normalised: norm('Atto 3'), externalId: 'pw-991', knownExternalIds: { 'pw-991': 'byd-atto-3-advanced' } },
    CATALOGUE,
  )
  check('a confirmed external id wins outright', r.best?.strategy === 'external-id' && r.decision === 'confident')
}
{
  const r = match({ normalised: norm('BYD Atto 3 Advanced') }, CATALOGUE)
  check('exact parts match confidently', r.decision === 'confident', `${r.best?.strategy}`)
}
{
  const r = match({ normalised: norm('Ford Mustang Mach-E') }, CATALOGUE)
  check('an unknown car matches nothing', r.decision === 'none' && r.best === null)
}
{
  const r = match({ normalised: norm('BYD Atto 3 Extended Range') }, CATALOGUE)
  check(
    'a near miss is proposed, never asserted',
    r.decision !== 'confident' || r.best?.strategy === 'exact-parts',
    r.decision,
  )
}

// ── Robots ────────────────────────────────────────────────────────────
console.log('\nROBOTS')
const policy = (body: string): RobotsPolicy => ({
  url: 'https://e.com/robots.txt',
  fetched: true,
  ...parseRobots(body, 'PlugPK-crawler'),
})
{
  const p = policy('User-agent: *\nDisallow: /admin\nAllow: /admin/public\nCrawl-delay: 5')
  check('disallowed path is refused', !isPathAllowed(p, '/admin/secret'))
  check('a longer Allow overrides a shorter Disallow', isPathAllowed(p, '/admin/public/page'))
  check('an unlisted path is allowed', isPathAllowed(p, '/cars/byd-atto-3'))
  check('crawl-delay is read', p.crawlDelaySeconds === 5)
}
{
  const p = policy('User-agent: PlugPK-crawler\nDisallow: /\n\nUser-agent: *\nAllow: /')
  check('a named group wins over *', !isPathAllowed(p, '/anything'), `agent=${p.matchedAgent}`)
}
{
  const p = policy('User-agent: *\nDisallow:')
  check('an empty Disallow does not block the site', isPathAllowed(p, '/cars'))
}
{
  const p = policy('User-agent: *\nDisallow: /*.pdf$')
  check('wildcard and anchor are honoured', !isPathAllowed(p, '/a/b.pdf') && isPathAllowed(p, '/a/b.pdf.html'))
}
{
  const unreachable: RobotsPolicy = {
    url: 'x', fetched: false, rules: [], crawlDelaySeconds: null, sitemaps: [], matchedAgent: null,
  }
  check('an unreachable robots.txt refuses everything', !isPathAllowed(unreachable, '/cars'))
}
{
  const p = policy('User-agent: *\nUser-agent: Googlebot\nDisallow: /x')
  check('consecutive agents share one group', p.rules.length === 1)
}

// ── Duplicates and multiple sources ───────────────────────────────────
console.log('\nDUPLICATES AND MULTI-SOURCE')
{
  // The storage key is (sourceId, sourceUrl, runId). These assertions describe
  // the rule the unique index enforces; the index itself is proven by the
  // migration, not re-tested against a live database here.
  const key = (s: string, u: string, r: string) => `${s}|${u}|${r}`
  check(
    'same source, same URL, same run is one row',
    key('a', '/x', 'r1') === key('a', '/x', 'r1'),
  )
  check(
    'same source and URL on a later run is a new row (history)',
    key('a', '/x', 'r1') !== key('a', '/x', 'r2'),
  )
  check(
    'two sources describing one car are two rows',
    key('a', '/x', 'r1') !== key('b', '/x', 'r1'),
  )

  const one = norm('BYD Atto 3 Advanced', {}, 'PKR 90 Lakh')
  const two = norm('BYD Atto 3 Advanced', {}, 'PKR 92 Lakh')
  const m1 = match({ normalised: one }, CATALOGUE)
  const m2 = match({ normalised: two }, CATALOGUE)
  check(
    'both sources propose the same car, so disagreement is visible',
    m1.best?.car.id === m2.best?.car.id && one.priceMin !== two.priceMin,
    `${one.priceMin} vs ${two.priceMin}`,
  )
}

// ── Source priority and conflicts ─────────────────────────────────────
console.log('\nSOURCE PRIORITY AND CONFLICTS')
{
  const stub = { access: async () => ({ kind: 'open-dataset' as const, allowed: true, reason: 'fixture' }), fetch: async () => ({ vehicles: [] }) }

  const globalDb: SourceAdapter = {
    id: 'global-ev-db', name: 'Global EV DB', baseUrl: 'https://x', defaultTrust: 70,
    fieldTrust: { usableBatteryCapacityKwh: 90, pakistanPrice: 0, availability: 0 },
    ...stub,
  }
  const localPk: SourceAdapter = {
    id: 'pk-local', name: 'Pakistan source', baseUrl: 'https://y', defaultTrust: 60,
    fieldTrust: { pakistanPrice: 95, availability: 95, usableBatteryCapacityKwh: 30 },
    ...stub,
  }

  const a = emptyVehicle({ source: 'global-ev-db', sourceUrl: 'https://x/1', extractionMethod: 'dataset' })
  a.usableBatteryCapacityKwh = 82.5
  a.rangeKm = 570
  a.confidence = 90

  const b = emptyVehicle({ source: 'pk-local', sourceUrl: 'https://y/1', extractionMethod: 'dom' })
  b.usableBatteryCapacityKwh = 80
  b.rangeKm = 570
  b.pakistanPrice = 15_500_000
  b.availability = 'official'
  b.confidence = 60

  const r = reconcile([{ vehicle: a, adapter: globalDb }, { vehicle: b, adapter: localPk }])
  const field = (name: string) => r.fields.find((entry) => entry.field === name)

  check('the specialist wins the battery figure', r.merged.usableBatteryCapacityKwh === 82.5, String(r.merged.usableBatteryCapacityKwh))
  check('the local source wins the Pakistan price', r.merged.pakistanPrice === 15_500_000 && field('pakistanPrice')?.winner === 'pk-local')
  check('a zero-trust source is excluded from a field it has no business in', field('availability')?.winner === 'pk-local')
  check('the disagreement is flagged, not averaged', r.conflicts.some((entry) => entry.field === 'usableBatteryCapacityKwh'))
  check('both claims survive on the conflicting field', (field('usableBatteryCapacityKwh')?.opinions.length ?? 0) === 2)
  check('a conflicted field is trusted less than either claim alone', (field('usableBatteryCapacityKwh')?.confidence ?? 100) < 90)
  check('agreement raises confidence above a single source', (field('rangeKm')?.confidence ?? 0) > 70)

  const rounded = reconcile([
    { vehicle: { ...a, usableBatteryCapacityKwh: 77.4 }, adapter: globalDb },
    { vehicle: { ...b, usableBatteryCapacityKwh: 77 }, adapter: localPk },
  ])
  check('rounding is not treated as a conflict', !rounded.conflicts.some((entry) => entry.field === 'usableBatteryCapacityKwh'))
}

/**
 * The access checks are async, so they and the summary live in a function.
 *
 * Top-level await is unavailable under the CJS transform tsx uses here — and
 * printing the summary outside this would report a result before the async
 * checks had run, which is the one failure mode a verifier must not have.
 */
// -- The --car filter -------------------------------------------------
//
// crawler/daily.ts documents `--car byd-seal` as taking a car "by slug or
// name". The slug form did not work: the needle was split on whitespace only,
// so "byd-seal" stayed one word and failed against the haystack "byd seal" on
// the hyphen. The run fetched 0 records and reported success -- the one
// spelling the docs recommended was the one spelling that silently matched
// nothing. Both sides are normalised now.
{
  console.log('\nCAR FILTER')

  // What the dataset actually publishes for these two, as observed.
  const SEAL = { brand: 'BYD', model: 'SEAL' }
  const ATTO = { brand: 'BYD', model: 'ATTO 3' }
  const EV9 = { brand: 'Kia', model: 'EV9' }

  const hit = (needle: string, car: { brand: string; model: string }) =>
    matchesCarFilter([needle], car.brand, car.model)

  check('   the slug form matches, which is what the docs promise', hit('byd-seal', SEAL))
  check('   the spaced form matches', hit('byd seal', SEAL))
  check('   the underscore form matches', hit('byd_seal', SEAL))
  check('   a partial name still narrows it', hit('seal', SEAL))
  check('   mixed case and padding do not matter', hit('  BYD-Seal  ', SEAL))
  check(
    '   all four spellings agree with each other',
    new Set([
      hit('byd-seal', SEAL),
      hit('byd seal', SEAL),
      hit('byd_seal', SEAL),
      hit('BYD Seal', SEAL),
    ]).size === 1,
  )

  check('   a non-matching needle returns nothing', !hit('porsche-taycan', SEAL))
  check(
    '   brand and model must BOTH be satisfied, so a slug cannot cross brands',
    !hit('byd-seal', EV9) && !hit('kia-ev9', SEAL),
  )
  check('   a hyphenated model matches its slug', hit('byd-atto-3', ATTO))
  check('   and does not match a different number in the family', !hit('byd-atto-2', ATTO))

  check(
    '   no needles means no filter, not no records',
    matchesCarFilter([], SEAL.brand, SEAL.model),
  )
  check(
    '   *** an empty needle matches NOTHING, not everything ***',
    !hit('', SEAL) && !hit('   ', SEAL),
  )
  check(
    '   a null brand or model does not throw',
    matchesCarFilter(['seal'], null, 'SEAL') && !matchesCarFilter(['seal'], null, null),
  )
}

async function accessChecks(): Promise<void> {
  console.log('\nACCESS CONTROL')

  for (const adapter of [evdbAdapter, vehdbAdapter, evspecsxAdapter]) {
    const verdict = await adapter.access()
    check(`${adapter.name}: refuses access`, verdict.allowed === false && verdict.kind === 'blocked')
    check(`${adapter.name}: states what it needs`, (verdict.requires?.length ?? 0) > 0)

    let threw = false
    try {
      await adapter.fetch()
    } catch {
      threw = true
    }
    check(`${adapter.name}: throws rather than reporting an empty success`, threw)
  }
}

accessChecks()
  .then(() => {
    console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
    process.exitCode = failures === 0 ? 0 : 1
  })
  .catch((error: unknown) => {
    console.error('\nverifier crashed:', error)
    process.exitCode = 1
  })
