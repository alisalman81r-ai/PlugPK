// scripts/seed-cars.ts
//
// Loads src/data/cars.ts into the Car table.
//
// The module is the seed now, not the source. It stays in the repository as the
// authored, reviewable starting point — 36 rows with their provenance written
// down in comments — and the database is what the site reads and the admin
// edits.
//
// Idempotent by upsert on id, so running it twice is harmless. It does NOT
// delete rows the module has dropped, and it does not overwrite a field an
// operator has since edited unless --force is passed: re-running a seed should
// not be a way to silently revert somebody's afternoon of corrections.
//
// Usage:
//   npx tsx scripts/seed-cars.ts            insert missing rows only
//   npx tsx scripts/seed-cars.ts --force     also overwrite existing rows
//   npx tsx scripts/seed-cars.ts --dry       report, write nothing

import { PrismaClient } from '@prisma/client'

import { cars } from '../src/data/cars'

const FORCE = process.argv.includes('--force')
const DRY = process.argv.includes('--dry')

const prisma = new PrismaClient()

function toRow(car: (typeof cars)[number]) {
  return {
    id: car.id,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    fullName: car.fullName,
    category: car.category,
    priceMin: car.price.min,
    priceMax: car.price.max,
    priceDisplay: car.price.display,
    batteryCapacity: car.batteryCapacity,
    range: car.range,
    rangeMax: car.rangeMax,
    electricRange: car.electricRange,
    electricRangeMax: car.electricRangeMax,
    power: car.power,
    acceleration: car.acceleration,
    topSpeed: car.topSpeed,
    torque: car.torque,
    seats: car.seats,
    dcCharging: car.dcCharging,
    acCharging: car.acCharging,
    // Null and [] mean different things on the interface — never stated, versus
    // stated as none — and both collapse to an empty column. rowToCar maps the
    // empty column back to null, which is the honest one of the two.
    connectors: (car.connector ?? []).join(','),
    engineCapacity: car.engineCapacity,
    image: car.image,
    notes: car.notes,
  }
}

async function main() {
  const existing = new Set((await prisma.car.findMany({ select: { id: true } })).map((r) => r.id))

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const car of cars) {
    const row = toRow(car)
    const isNew = !existing.has(car.id)

    if (!isNew && !FORCE) {
      skipped += 1
      continue
    }

    if (!DRY) {
      await prisma.car.upsert({ where: { id: car.id }, create: row, update: row })
    }

    if (isNew) inserted += 1
    else updated += 1
  }

  const orphans = [...existing].filter((id) => !cars.some((car) => car.id === id))

  console.log(`${DRY ? '[dry] ' : ''}inserted ${inserted}, updated ${updated}, left alone ${skipped}`)
  if (orphans.length > 0) {
    // Reported, never deleted: a row the admin added is not in the module, and
    // treating "not in the seed" as "delete" would wipe every car created
    // through the portal on the next seed run.
    console.log(`${orphans.length} row(s) in the database but not in the module (left in place):`)
    console.log(`  ${orphans.join(', ')}`)
  }
  if (skipped > 0 && !FORCE) {
    console.log('Pass --force to overwrite existing rows from the module.')
  }

  console.log(`\ntotal in database: ${await prisma.car.count()}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
