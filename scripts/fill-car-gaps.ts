// scripts/fill-car-gaps.ts
//
// Fills empty Car columns from the two tracked sources. Never overwrites.
//
// ── Why this exists alongside seed-cars.ts ───────────────────────────
//
// scripts/export-cars.ts writes the database out to data/catalogue-snapshot.json
// so the catalogue survives a reset or a dead disk. Nothing read it back. On a
// second machine that is exactly the gap it was written to close: the snapshot
// and the images arrive with a pull, the database does not, and the site then
// renders whatever that clone's dev.db happens to hold.
//
// seed-cars.ts cannot close it either, and deliberately so. Its default skips
// every row that already exists, and all 48 exist here — so it reports 48
// skipped and changes nothing. Its --force does the opposite and too much: it
// rewrites whole rows, which is the "way to silently revert somebody's
// afternoon of corrections" its own header warns about. byd-seal and
// kia-ev9-gt-line carry variant declarations set through the audited identity
// path and still null in the module; a blanket --force clears both.
//
// So this script does the one operation neither offers: per *cell*, additive
// only. A column that already holds a value is left exactly as it is, whatever
// the module or the snapshot say about it. Disagreements are counted and
// printed, never resolved — which side wins is the per-field judgement
// data/module-vs-database-drift.json exists to put in front of a person.
//
// ── Precedence ───────────────────────────────────────────────────────
//
// The module first, then the snapshot. src/data/cars.ts is authored and
// reviewed, with provenance in comments beside each row; the snapshot is a dump
// of one machine's database at one moment. Where the module states a figure it
// is the better source. Where it does not, the snapshot may still carry
// something a person entered through the admin portal, and that is worth more
// than a null.
//
// Usage:
//   npx tsx scripts/fill-car-gaps.ts              report, write nothing
//   npx tsx scripts/fill-car-gaps.ts --apply      write the fills
//   npx tsx scripts/fill-car-gaps.ts --only byd-seal
//
// Writing is opt-in because the default being destructive is how afternoons get
// reverted.

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

import { cars } from '../src/data/cars'

const APPLY = process.argv.includes('--apply')
const onlyFlag = process.argv.indexOf('--only')
const ONLY = onlyFlag >= 0 ? (process.argv[onlyFlag + 1] ?? null) : null

const prisma = new PrismaClient()

/** Columns that identify a row or record when it changed. Never filled. */
const NOT_DATA = new Set(['id', 'slug', 'createdAt', 'updatedAt'])

/**
 * Empty means null, undefined, or the empty string.
 *
 * `connectors` is `String @default("")`, so a row that never stated its
 * connectors holds '' rather than null. Both mean "nothing was said", and the
 * seed's own comment says the empty column is read back as null — so an empty
 * string is a gap this can fill, not a value it must protect.
 */
const has = (v: unknown) => v !== null && v !== undefined && v !== ''

/**
 * Columns that are two ends of one span, and must be filled as a unit.
 *
 * This is here because the first run of this script got it wrong and put a
 * figure on the site that describes no car. byd-seal held range 650 in the
 * database and the module states 510 — a disagreement, so the 650 was left
 * alone, correctly. But rangeMax was null, so the module's 650 went in beside
 * it, and the page rendered "650-650 km". dongfeng-vigo came out worse: 430 in
 * the database, 353 from the module, a maximum below its own minimum.
 *
 * The two ends came from rows describing different trims. Mixing them is the
 * same error the catalogue already has a rule against — "headline figures all
 * come from the trim that matches price.min" — arrived at from the other
 * direction.
 *
 * So: the upper half is filled only when the lower half is being filled in the
 * same operation, from the same source. If the database already states the
 * lower end, the pair is left as the database has it, and a gap stays a gap.
 * A missing maximum reads as "no span was stated", which is true; an invented
 * one reads as a specification.
 */
const SPAN_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['range', 'rangeMax'],
  ['electricRange', 'electricRangeMax'],
  ['realWorldRange', 'realWorldRangeMax'],
  ['consumption', 'consumptionMax'],
  ['groundClearanceMm', 'groundClearanceMaxMm'],
  ['priceMin', 'priceMax'],
]

/** Upper half -> lower half, for the check above. */
const SPAN_BASE = new Map(SPAN_PAIRS.map(([lo, hi]) => [hi, lo]))

/**
 * The module's authored shape flattened onto the database's column names.
 *
 * Three fields differ: price is nested, connector is an array, and the module
 * has no `trim` at all — it models that concept as `variant` alone. seed-cars.ts
 * maps `trim: car.variant`, copying one into the other; this does not, because
 * they are separate columns and nothing authored says they hold the same thing.
 */
function fromModule(c: (typeof cars)[number]): Record<string, unknown> {
  const o = c as unknown as Record<string, unknown>
  return {
    ...o,
    priceMin: c.price.min,
    priceMax: c.price.max,
    priceDisplay: c.price.display,
    connectors: (c.connector ?? []).join(','),
  }
}

interface Snapshot {
  exportedAt?: string
  rowCount?: number
  cars: Record<string, unknown>[]
}

async function main() {
  const snapshot = JSON.parse(readFileSync('data/catalogue-snapshot.json', 'utf8')) as Snapshot
  const snapById = new Map(snapshot.cars.map((r) => [String(r.id), r]))
  const moduleById = new Map(cars.map((c) => [c.id, fromModule(c)]))

  const dbCars = await prisma.car.findMany()
  const first = dbCars[0]
  if (first === undefined) {
    console.log('No cars in the database. This script fills gaps in existing rows;')
    console.log('run `npx tsx scripts/seed-cars.ts` first to create them.')
    return
  }

  // The column list comes off a row rather than a hardcoded array, so a column
  // added to the schema is filled without this file being edited.
  const columns = Object.keys(first).filter((k) => !NOT_DATA.has(k))

  let cellsFilled = 0
  let fromModuleCount = 0
  let fromSnapshotCount = 0
  let disagreements = 0
  let rowsTouched = 0
  let spansHeld = 0
  const byField = new Map<string, number>()

  for (const db of dbCars) {
    if (ONLY !== null && db.slug !== ONLY && db.id !== ONLY) continue

    const mod = moduleById.get(db.id) ?? null
    const snap = snapById.get(db.id) ?? null
    const row = db as unknown as Record<string, unknown>
    const patch: Record<string, unknown> = {}

    /*
      Spans first, and as a unit.

      Each pair is taken whole from whichever source states its lower end, so
      both ends describe the same car. A source that gives only the upper half
      is no use here — a maximum without its minimum is half a span — and a
      lower end already in the database means the pair is the database's, so
      neither end is touched.
    */
    const spanHandled = new Set<string>()
    for (const [lo, hi] of SPAN_PAIRS) {
      spanHandled.add(lo)
      spanHandled.add(hi)

      if (has(row[lo])) {
        // The database owns this span. Note a withheld upper half and move on.
        for (const end of [lo, hi] as const) {
          const m = mod?.[end]
          if (has(row[end]) && has(m) && String(m) !== String(row[end])) disagreements += 1
        }
        if (!has(row[hi]) && (has(mod?.[hi]) || has(snap?.[hi]))) spansHeld += 1
        continue
      }

      const source = has(mod?.[lo]) ? mod : has(snap?.[lo]) ? snap : null
      if (source === null) continue
      const fromMod = source === mod

      for (const end of [lo, hi] as const) {
        if (has(row[end]) || !has(source[end])) continue
        patch[end] = source[end]
        if (fromMod) fromModuleCount += 1
        else fromSnapshotCount += 1
        byField.set(end, (byField.get(end) ?? 0) + 1)
        cellsFilled += 1
      }
    }

    for (const col of columns) {
      if (spanHandled.has(col)) continue
      const current = row[col]

      if (has(current)) {
        // Occupied. Record a disagreement for the drift report, change nothing.
        const m = mod?.[col]
        if (has(m) && String(m) !== String(current)) disagreements += 1
        continue
      }

      const m = mod?.[col]
      if (has(m)) {
        patch[col] = m
        fromModuleCount += 1
      } else {
        const s = snap?.[col]
        if (!has(s)) continue
        patch[col] = s
        fromSnapshotCount += 1
      }

      byField.set(col, (byField.get(col) ?? 0) + 1)
      cellsFilled += 1
    }

    const keys = Object.keys(patch)
    if (keys.length === 0) continue
    rowsTouched += 1

    if (APPLY) {
      await prisma.car.update({ where: { id: db.id }, data: patch })
    }
  }

  const verb = APPLY ? 'filled' : 'would fill'
  console.log('')
  console.log(`${verb} ${cellsFilled} empty cells across ${rowsTouched} of ${dbCars.length} cars`)
  console.log(`  from src/data/cars.ts          ${fromModuleCount}`)
  console.log(`  from catalogue-snapshot.json   ${fromSnapshotCount}`)
  console.log('')
  console.log(`left alone: ${disagreements} cells where the database and the module disagree.`)
  console.log('  Those are a judgement, not a gap — see data/module-vs-database-drift.json.')
  console.log(`held back: ${spansHeld} upper span ends whose lower end the database already states.`)
  console.log('  Filling one end of a span from a source that disagrees about the other')
  console.log('  produces a figure describing no car — see SPAN_PAIRS.')

  if (byField.size > 0) {
    console.log('')
    console.log('by column:')
    for (const [col, n] of [...byField.entries()].sort((a, b) => b[1] - a[1])) {
      console.log('  ' + col.padEnd(24) + String(n).padStart(3) + ' cars')
    }
  }

  if (!APPLY) {
    console.log('')
    console.log('Nothing was written. Re-run with --apply to write these fills.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
