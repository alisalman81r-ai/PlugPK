// scripts/verify-cars.ts
//
// Exercises the car database's pure logic: search, every filter, all six sorts,
// price formatting and the per-category spec selection. Run with
// `npx tsx scripts/verify-cars.ts`.
//
// Kept as a script rather than a test suite because the project has no test
// runner configured, and adding one to prove a data module works would be a
// larger change than the thing being proved.
//
// Counts are DERIVED, not written down. This file used to assert "28 cars",
// "18 EVs", "BYD -> 4" and a dozen more literals, so adding eight cars turned
// fifteen checks red at once while every one of them was actually correct — the
// data had changed, not broken. A verifier that cries wolf on every legitimate
// edit is a verifier people stop reading, and the fifteen real assertions in
// here would have been lost in the noise. What is asserted now are the
// invariants that must hold at any size: totals agree with the sum of their
// parts, filters and sorts are subsets and permutations of the input, and every
// supplied figure is still exactly what was supplied.

import { cars } from '../src/data/cars'
import {
  EMPTY_FILTERS,
  filterCars,
  formatPkr,
  fullSpecs,
  getBrands,
  getCategories,
  getCarBySlug,
  getCarsByIds,
  headlineSpecs,
  searchCars,
  sortCars,
  type CarSort,
} from '../src/lib/cars'

let failures = 0

function check(label: string, condition: boolean, detail = '') {
  const mark = condition ? 'PASS' : 'FAIL'
  if (!condition) failures += 1
  console.log(`  ${mark}  ${label}${detail ? ` — ${detail}` : ''}`)
}

console.log('\nDATA')
const ids = cars.map((car) => car.id)
const slugs = cars.map((car) => car.slug)
check('at least the 28 supplied cars', cars.length >= 28, `${cars.length} cars`)
check('unique ids', new Set(ids).size === ids.length)
check('unique slugs', new Set(slugs).size === slugs.length)
check(
  'ids are kebab-case',
  ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)),
)
check(
  'every car has a price span with min <= max',
  cars.every((car) => car.price.min <= car.price.max && car.price.min > 0),
)
check(
  'every price display starts with PKR',
  cars.every((car) => car.price.display.startsWith('PKR ')),
)
check(
  'getBrands lists every brand present, once',
  getBrands().length === new Set(cars.map((car) => car.brand)).size,
  `${getBrands().length} brands`,
)
check(
  'getCategories lists every category present, in CATEGORY_ORDER',
  getCategories().join(',') ===
    (['EV', 'PHEV', 'REEV', 'Hybrid'] as const)
      .filter((category) => cars.some((car) => car.category === category))
      .join(','),
  getCategories().join(','),
)
check(
  'category counts sum to the whole catalogue',
  getCategories().reduce((total, category) => total + cars.filter((c) => c.category === category).length, 0) ===
    cars.length,
)
// A full hybrid has no plug. Asserting it here keeps a later edit from quietly
// giving one a charging speed, which would put it in the DC filter's results.
check(
  'hybrids carry no plug, no DC and no AC figure',
  cars
    .filter((car) => car.category === 'Hybrid')
    .every((car) => car.connector === null && car.dcCharging === null && car.acCharging === null),
)
// Every row whose price is not from the supplied list has to say so, wherever
// that price is printed.
check(
  'indicative prices are labelled in price.display',
  cars.every((car) => !car.notes?.includes('indicative') || car.price.display.includes('(indicative)')),
)

console.log('\nSUPPLIED FIGURES UNCHANGED')
const byId = (id: string) => cars.find((car) => car.id === id)!
check('Atto 2 = 72.9 Lakh', byId('byd-atto-2').price.min === 7_290_000)
check('Omoda 7 = 1.0649 Cr', byId('omoda-7').price.min === 10_649_000)
check('EV9 GT-Line = 4.32 Cr', byId('kia-ev9-gt-line').price.min === 43_200_000)
/*
  Was 13,300,000-17,000,000, the price list's rounded span.

  Updated deliberately, not to silence a red check. The 2026 model-year research
  supplies the four variant prices this span is meant to cover — Econ 13,299,000,
  Air 14,699,000, Pro 16,999,000, Ultra 18,499,000 — so the old maximum sat below
  the top variant it was supposed to include. The assertion still does its job:
  it pins the row to exact rupee figures rather than to a rounded summary.
*/
check('Riddara span 1.3299–1.8499 Cr', byId('riddara-rd6').price.min === 13_299_000 && byId('riddara-rd6').price.max === 18_499_000)
check('Sealion 7 battery 82.56', byId('byd-sealion-7-advanced').batteryCapacity === 82.56)
check('Sealion 7 range span 450–567', byId('byd-sealion-7-advanced').range === 450 && byId('byd-sealion-7-advanced').rangeMax === 567)
check('Deepal E07 DC 240 kW', byId('deepal-e07').dcCharging === 240)
check('Tiggo 9 power 610 hp', byId('chery-tiggo-9-phev').power === 610)
check('Haval H6 has only price + engine', byId('haval-h6-phev').engineCapacity === 1499 && byId('haval-h6-phev').batteryCapacity === null && byId('haval-h6-phev').power === null)
check('S05 REEV battery is null', byId('deepal-s05-reev').batteryCapacity === null)

console.log('\nSEARCH')
const brandCount = (brand: string) => cars.filter((car) => car.brand === brand).length
check(
  '"BYD" finds every BYD',
  searchCars(cars, 'BYD').length === brandCount('BYD'),
  searchCars(cars, 'BYD').map((c) => c.model).join(', '),
)
check(
  '"tiggo" finds every Tiggo',
  searchCars(cars, 'tiggo').length === cars.filter((c) => c.model.toLowerCase().includes('tiggo')).length,
)
check(
  '"PHEV" finds every PHEV',
  searchCars(cars, 'PHEV').length >= cars.filter((c) => c.category === 'PHEV').length,
)
check('"byd seal" matches Seal and Sealion', searchCars(cars, 'byd seal').length >= 2)
check('"kia ev9" -> 1', searchCars(cars, 'kia ev9').length === 1)
check('empty query -> all', searchCars(cars, '   ').length === cars.length)
check('nonsense -> 0', searchCars(cars, 'zzzz').length === 0)
check('case-insensitive', searchCars(cars, 'byd').length === searchCars(cars, 'BYD').length)

console.log('\nFILTERS')
const f = (patch: Partial<typeof EMPTY_FILTERS>) => filterCars(cars, { ...EMPTY_FILTERS, ...patch })
check('no filters -> all', f({}).length === cars.length)
check(
  'category EV -> every EV',
  f({ categories: ['EV'] }).length === cars.filter((c) => c.category === 'EV').length,
)
check('brand BYD -> every BYD', f({ brands: ['BYD'] }).length === brandCount('BYD'))
check(
  'two brands OR together',
  f({ brands: ['BYD', 'KIA'] }).length === brandCount('BYD') + brandCount('KIA'),
)
check(
  'stacked filters narrow rather than widen',
  f({ categories: ['EV'], brands: ['BYD'], priceMax: 15_000_000 }).every(
    (car) => car.category === 'EV' && car.brand === 'BYD' && car.price.min <= 15_000_000,
  ),
  f({ categories: ['EV'], brands: ['BYD'], priceMax: 15_000_000 }).map((c) => c.model).join(', '),
)
check(
  'price cap includes an overlapping span',
  f({ priceMax: 15_000_000 }).some((c) => c.id === 'riddara-rd6'),
  'Riddara 1.33–1.70 Cr is buyable under 1.5 Cr',
)
check('battery >= 60 excludes null batteries', f({ minBattery: 60 }).every((c) => (c.batteryCapacity ?? 0) >= 60))
check('range >= 400 reads electricRange too', f({ minRange: 400 }).every((c) => (c.range ?? c.electricRange ?? 0) >= 400))
check('power >= 300 -> only 300hp+', f({ minPower: 300 }).every((c) => (c.power ?? 0) >= 300))
check('connector Type 2 -> only cars that published one', f({ connectors: ['Type 2'] }).every((c) => c.connector?.includes('Type 2')))
check('impossible combination -> 0', f({ brands: ['BYD'], categories: ['REEV'] }).length === 0)

console.log('\nSORTING')
const sorted = (sort: CarSort) => sortCars(cars, sort)
const prices = sorted('price-asc').map((c) => c.price.min)
check('price-asc ascending', prices.every((p, i) => i === 0 || prices[i - 1]! <= p))
const desc = sorted('price-desc').map((c) => c.price.max)
check('price-desc descending', desc.every((p, i) => i === 0 || desc[i - 1]! >= p))
check(
  'price-asc puts the cheapest first',
  sorted('price-asc')[0]!.price.min === Math.min(...cars.map((car) => car.price.min)),
  sorted('price-asc')[0]!.fullName,
)
check(
  'price-desc puts the priciest first',
  sorted('price-desc')[0]!.price.max === Math.max(...cars.map((car) => car.price.max)),
  sorted('price-desc')[0]!.fullName,
)
check(
  'battery-desc puts the largest pack first',
  (sorted('battery-desc')[0]!.batteryCapacity ?? 0) ===
    Math.max(...cars.map((car) => car.batteryCapacity ?? 0)),
  sorted('battery-desc')[0]!.fullName,
)
check(
  'power-desc puts the strongest first',
  (sorted('power-desc')[0]!.power ?? 0) === Math.max(...cars.map((car) => car.power ?? 0)),
  sorted('power-desc')[0]!.fullName,
)
check(
  'range-desc puts the longest range first',
  (sorted('range-desc')[0]!.range ?? 0) === Math.max(...cars.map((car) => car.range ?? 0)),
  sorted('range-desc')[0]!.fullName,
)
check(
  'nulls sort last in power-desc',
  sorted('power-desc').slice(-2).every((c) => c.power === null),
)
// A sort must be a permutation: same cars, different order. Length alone would
// miss a sort that dropped one car and duplicated another.
check(
  'every sort is a permutation of the catalogue',
  (['price-asc', 'price-desc', 'range-desc', 'battery-desc', 'power-desc', 'newest'] as CarSort[]).every(
    (key) => {
      const out = sorted(key)
      return out.length === cars.length && new Set(out.map((car) => car.id)).size === cars.length
    },
  ),
)

console.log('\nFORMATTING')
check('7,290,000 -> 72.9 Lakh', formatPkr(7_290_000) === 'PKR 72.9 Lakh', formatPkr(7_290_000))
check('15,000,000 -> 1.5 Cr', formatPkr(15_000_000) === 'PKR 1.5 Cr', formatPkr(15_000_000))
check('43,200,000 -> 4.32 Cr', formatPkr(43_200_000) === 'PKR 4.32 Cr', formatPkr(43_200_000))
check('10,649,000 keeps precision', formatPkr(10_649_000) === 'PKR 1.0649 Cr', formatPkr(10_649_000))

console.log('\nCATEGORY-AWARE SPECS')
const evSpecs = headlineSpecs(byId('byd-atto-2')).map((s) => s.label)
const phevSpecs = headlineSpecs(byId('chery-tiggo-7-phev')).map((s) => s.label)
check('EV shows Battery/Range/DC/AC', evSpecs.join(',') === 'Battery,Range,DC charging,AC charging', evSpecs.join(','))
check('PHEV shows Battery/Electric range/Engine/Power', phevSpecs.join(',') === 'Battery,Electric range,Engine,Power', phevSpecs.join(','))
check('EV shows no Engine row', !evSpecs.includes('Engine'))
check('PHEV shows no plain Range row', !phevSpecs.includes('Range'))
check(
  'no spec row ever contains "null"',
  cars.every((car) => fullSpecs(car).every((row) => !row.value.includes('null'))),
)
check(
  'Haval renders only what it has',
  fullSpecs(byId('haval-h6-phev')).map((r) => r.label).join(',') === 'Category,Price,Engine capacity',
  fullSpecs(byId('haval-h6-phev')).map((r) => r.label).join(','),
)

console.log('\nLOOKUPS')
check('getCarBySlug finds', getCarBySlug('mg-zs-ev')?.fullName === 'MG ZS EV')
check('getCarBySlug misses cleanly', getCarBySlug('nope') === undefined)
check('getCarsByIds keeps pick order', getCarsByIds(['kia-ev5', 'byd-atto-2']).map((c) => c.id).join(',') === 'kia-ev5,byd-atto-2')
check('getCarsByIds drops unknown ids', getCarsByIds(['byd-atto-2', 'ghost']).length === 1)

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
process.exit(failures === 0 ? 0 : 1)
