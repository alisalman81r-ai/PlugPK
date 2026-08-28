// scripts/remove-test-sources.ts
//
// Removes the two fabricated sources the Phase 3 verification left registered in
// dev.db — `testA` and `testB` — and everything they wrote.
//
//   npm run db:remove-test-sources            report what would go, change nothing
//   npm run db:remove-test-sources -- --apply do it
//
// ── What this does not touch ──────────────────────────────────────────
//
// Real source configurations (openev, evdb), crawler code, the Phase 3 tables
// themselves, and the catalogue. It deletes rows whose `sourceId` is one of the
// test ids and nothing else — it is not a general staging cleaner, and it takes
// the ids from the list below rather than from an argument, so it cannot be
// pointed at a real source by a typo on the command line.
//
// ── The one case that is not a delete ─────────────────────────────────
//
// One of those fabricated sources got as far as Car. The verification approved a
// proposal from `testA`, which wrote `torque` onto BYD Atto 3 Advanced and left a
// CarChangeHistory row saying it had been "verified against the press pack" — a
// sentence written by a test script, about a press pack nobody opened, attached
// to a figure on a public page.
//
// Deleting that history row on its own would be the worst outcome: the value
// stays on the site with its provenance erased. So the write is undone instead —
// the column goes back to the value the history row itself records it had — and
// the row is deleted with it. The catalogue ends up exactly as it was before the
// fixture ran.
//
// Undone only when the column still holds what the test put there. If somebody
// has since changed it by hand, that is a real decision and this leaves it alone
// and says so.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Hard-coded, because a mistyped argument here would delete a real source. */
const TEST_SOURCE_IDS = ['testA', 'testB'] as const

/**
 * How to read a history row's `oldValue` back into its column.
 *
 * Deliberately its own map rather than the review layer's allow-list: this has
 * to be able to put back a column that the allow-list no longer permits a
 * proposal to write (`priceDisplay` is exactly that case), and a maintenance
 * script that could only reverse what is currently writable would be unable to
 * reverse the past.
 */
const COLUMN_KIND: Record<string, 'int' | 'float' | 'string'> = {
  batteryCapacity: 'float',
  range: 'int',
  rangeMax: 'int',
  electricRange: 'int',
  electricRangeMax: 'int',
  power: 'int',
  acceleration: 'float',
  topSpeed: 'int',
  torque: 'int',
  seats: 'int',
  dcCharging: 'float',
  acCharging: 'float',
  engineCapacity: 'int',
  connectors: 'string',
  notes: 'string',
  priceMin: 'int',
  priceMax: 'int',
  priceDisplay: 'string',
}

type Coerced = { ok: true; value: number | string | null } | { ok: false; reason: string }

function coerce(field: string, text: string | null): Coerced {
  if (text === null) return { ok: true, value: null }

  const kind = COLUMN_KIND[field]
  if (!kind) return { ok: false, reason: `no known column type for "${field}"` }

  if (kind === 'string') return { ok: true, value: text }

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return { ok: false, reason: `"${text}" is not a number` }
  return { ok: true, value: kind === 'int' ? Math.round(parsed) : parsed }
}

interface Tally {
  sources: number
  records: number
  proposals: number
  history: number
  prices: number
  images: number
  candidates: number
  runs: number
  logs: number
}

async function tally(): Promise<Tally> {
  const where = { sourceId: { in: [...TEST_SOURCE_IDS] } }

  const [sources, records, proposals, history, prices, images, candidates, runs, logs] =
    await Promise.all([
      prisma.carSource.count({ where: { id: { in: [...TEST_SOURCE_IDS] } } }),
      prisma.carSourceRecord.count({ where }),
      prisma.carFieldChange.count({ where }),
      prisma.carChangeHistory.count({ where }),
      prisma.carPriceHistory.count({ where }),
      prisma.carImageCandidate.count({ where }),
      prisma.carCandidate.count({ where }),
      prisma.crawlRun.count({ where }),
      prisma.crawlLogEntry.count({ where }),
    ])

  return { sources, records, proposals, history, prices, images, candidates, runs, logs }
}

function report(label: string, counts: Tally) {
  console.log(`\n  ${label}`)
  for (const [name, count] of Object.entries(counts)) {
    console.log(`    ${name.padEnd(12)} ${count}`)
  }
}

async function main(): Promise<number> {
  const apply = process.argv.includes('--apply')

  console.log(
    `\nRemoving test sources ${TEST_SOURCE_IDS.join(', ')}` +
      `${apply ? '' : '  (report only — pass --apply to write)'}`,
  )

  const carsBefore = await prisma.car.count()
  const before = await tally()
  report('Rows referencing them now:', before)

  if (Object.values(before).every((count) => count === 0)) {
    console.log('\n  Nothing to remove. Already clean.\n')
    return 0
  }

  // ── The writes that reached Car ────────────────────────────────────
  const applied = await prisma.carChangeHistory.findMany({
    where: { sourceId: { in: [...TEST_SOURCE_IDS] } },
    orderBy: { approvedAt: 'asc' },
  })

  const reversals: { id: string; carId: string; field: string; from: unknown; to: unknown }[] = []
  const kept: string[] = []

  for (const row of applied) {
    const car = await prisma.car.findUnique({ where: { id: row.carId } })
    if (!car) {
      kept.push(`${row.field} on ${row.carId}: the car no longer exists`)
      continue
    }

    const current = (car as unknown as Record<string, unknown>)[row.field]
    const currentText = current === null || current === undefined ? null : String(current)

    if (currentText !== row.newValue) {
      /*
        Somebody changed this since the fixture did. That later value is a real
        decision, and reverting it would be this script overwriting a person.
      */
      kept.push(
        `${row.field} on ${car.slug}: now "${currentText ?? '—'}", not the "${row.newValue ?? '—'}" the test wrote — left alone`,
      )
      continue
    }

    const restored = coerce(row.field, row.oldValue)
    if (!restored.ok) {
      kept.push(`${row.field} on ${car.slug}: cannot be reversed — ${restored.reason}`)
      continue
    }

    reversals.push({
      id: row.id,
      carId: row.carId,
      field: row.field,
      from: current,
      to: restored.value,
    })
  }

  if (reversals.length > 0) {
    console.log('\n  Catalogue writes to undo:')
    for (const reversal of reversals) {
      console.log(
        `    ${reversal.carId}.${reversal.field}: ${String(reversal.from)} -> ${reversal.to === null ? 'null' : String(reversal.to)}`,
      )
    }
  }

  if (kept.length > 0) {
    console.log('\n  Catalogue writes NOT undone:')
    for (const line of kept) console.log(`    ${line}`)
  }

  if (!apply) {
    console.log('\n  Nothing written. Re-run with --apply.\n')
    return 0
  }

  // ── Do it ─────────────────────────────────────────────────────────
  const where = { sourceId: { in: [...TEST_SOURCE_IDS] } }

  /*
    One transaction. A half-removed test source is a worse state than either
    end: the reverted column with its history row still present would read as a
    change that was undone by nobody.
  */
  await prisma.$transaction([
    ...reversals.map((reversal) =>
      prisma.car.update({
        where: { id: reversal.carId },
        data: { [reversal.field]: reversal.to },
      }),
    ),
    prisma.carChangeHistory.deleteMany({ where }),
    prisma.carFieldChange.deleteMany({ where }),
    prisma.carPriceHistory.deleteMany({ where }),
    prisma.carImageCandidate.deleteMany({ where }),
    prisma.carCandidate.deleteMany({ where }),
    prisma.crawlLogEntry.deleteMany({ where }),
    prisma.crawlRun.deleteMany({ where }),
    // Staging records cascade from the source row, so this goes last.
    prisma.carSource.deleteMany({ where: { id: { in: [...TEST_SOURCE_IDS] } } }),
  ])

  // ── Verify ────────────────────────────────────────────────────────
  const after = await tally()
  const carsAfter = await prisma.car.count()
  report('Rows referencing them after:', after)

  const leftovers = Object.entries(after).filter(([, count]) => count > 0)
  const carCountHeld = carsBefore === carsAfter

  console.log(`\n  Car rows: ${carsBefore} -> ${carsAfter}`)

  if (leftovers.length > 0) {
    console.error(
      `\n  FAILED: ${leftovers.map(([name, count]) => `${count} ${name}`).join(', ')} still reference a test source.\n`,
    )
    return 1
  }
  if (!carCountHeld) {
    console.error('\n  FAILED: the number of cars changed. Nothing here should delete a car.\n')
    return 1
  }

  console.log('\n  Removed. No row anywhere references testA or testB.\n')
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
