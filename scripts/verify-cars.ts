// scripts/verify-cars.ts
//
// Exercises the car database's pure logic: search, every filter, all six sorts,
// price formatting and the per-category spec selection. Run with
// `npx tsx scripts/verify-cars.ts`.
//
// Kept as a script rather than a test suite because the project has no test
// runner configured, and adding one to prove a data module works would be a
// larger change than the thing being proved.

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
check('28 cars', cars.length === 28, `${cars.length}`)
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
check('brands', getBrands().length === 14, `${getBrands().length} brands`)
check('categories present', getCategories().join(',') === 'EV,PHEV,REEV', getCategories().join(','))
check('18 EVs', cars.filter((c) => c.category === 'EV').length === 18)
check('8 PHEVs', cars.filter((c) => c.category === 'PHEV').length === 8)
check('2 REEVs', cars.filter((c) => c.category === 'REEV').length === 2)

console.log('\nSUPPLIED FIGURES UNCHANGED')
const byId = (id: string) => cars.find((car) => car.id === id)!
check('Atto 2 = 72.9 Lakh', byId('byd-atto-2').price.min === 7_290_000)
check('Omoda 7 = 1.0649 Cr', byId('omoda-7').price.min === 10_649_000)
check('EV9 GT-Line = 4.32 Cr', byId('kia-ev9-gt-line').price.min === 43_200_000)
check('Riddara span 1.33–1.70 Cr', byId('riddara-rd6').price.min === 13_300_000 && byId('riddara-rd6').price.max === 17_000_000)
check('Sealion 7 battery 82.56', byId('byd-sealion-7-advanced').batteryCapacity === 82.56)
check('Sealion 7 range span 450–567', byId('byd-sealion-7-advanced').range === 450 && byId('byd-sealion-7-advanced').rangeMax === 567)
check('Deepal E07 DC 240 kW', byId('deepal-e07').dcCharging === 240)
check('Tiggo 9 power 610 hp', byId('chery-tiggo-9-phev').power === 610)
check('Haval H6 has only price + engine', byId('haval-h6-phev').engineCapacity === 1499 && byId('haval-h6-phev').batteryCapacity === null && byId('haval-h6-phev').power === null)
check('S05 REEV battery is null', byId('deepal-s05-reev').batteryCapacity === null)

console.log('\nSEARCH')
check('"BYD" -> 4', searchCars(cars, 'BYD').length === 4, searchCars(cars, 'BYD').map((c) => c.model).join(', '))
check('"tiggo" -> 3', searchCars(cars, 'tiggo').length === 3)
check('"PHEV" -> 8', searchCars(cars, 'PHEV').length === 8)
check('"byd seal" -> 2 (Seal, Sealion)', searchCars(cars, 'byd seal').length === 2)
check('"kia ev9" -> 1', searchCars(cars, 'kia ev9').length === 1)
check('empty query -> all', searchCars(cars, '   ').length === 28)
check('nonsense -> 0', searchCars(cars, 'zzzz').length === 0)
check('case-insensitive', searchCars(cars, 'byd').length === searchCars(cars, 'BYD').length)

console.log('\nFILTERS')
const f = (patch: Partial<typeof EMPTY_FILTERS>) => filterCars(cars, { ...EMPTY_FILTERS, ...patch })
check('no filters -> all 28', f({}).length === 28)
check('category EV -> 18', f({ categories: ['EV'] }).length === 18)
check('brand BYD -> 4', f({ brands: ['BYD'] }).length === 4)
check('two brands OR together', f({ brands: ['BYD', 'KIA'] }).length === 6)
check(
  'EV + BYD + under 1.5 Cr -> 3',
  f({ categories: ['EV'], brands: ['BYD'], priceMax: 15_000_000 }).length === 3,
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
check('price-asc cheapest first', sorted('price-asc')[0]!.id === 'dongfeng-vigo')
check('price-desc priciest first', sorted('price-desc')[0]!.id === 'kia-ev9-gt-line')
check('battery-desc largest first', sorted('battery-desc')[0]!.id === 'kia-ev9-gt-line')
check('power-desc strongest first', sorted('power-desc')[0]!.id === 'chery-tiggo-9-phev')
check('range-desc highest first', (sorted('range-desc')[0]!.range ?? 0) === 650)
check(
  'nulls sort last in power-desc',
  sorted('power-desc').slice(-2).every((c) => c.power === null),
)
check('every sort keeps all 28', (['price-asc', 'price-desc', 'range-desc', 'battery-desc', 'power-desc', 'newest'] as CarSort[]).every((s) => sorted(s).length === 28))

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
