// scripts/apply-car-research.ts
//
// Applies a reviewed research file to the Car table: fills empty columns
// only, and records every fill in CarChangeHistory with its source URL.
//
// ── Fills and corrections ─────────────────────────────────────────────
//
// The database is what the site reads and what operators edit through the
// admin portal, so a batch never silently replaces a figure. `fills` only
// write into empty columns. A value that an official source contradicts is
// changed only through `corrections`, which a reviewer lists explicitly, and
// whose old value is kept in CarChangeHistory so the change can be undone.
// `conflicts` are disagreements nobody has ruled on: printed, never applied.
//
// ── The file ──────────────────────────────────────────────────────────
//
// data/research/<batch>.json, committed to the repository so the batch is
// reviewable in a pull request before it touches any database:
//
//   { "<slug>": { "fills":       { "<column>": { "value": 310, "source": "https://…" } },
//                 "corrections": { "<column>": { "value": 567, "source": "https://…", "note": "…" } },
//                 "conflicts":   [ … ] } }
//
// Usage:
//   npx tsx scripts/apply-car-research.ts data/research/byd.json           report only
//   npx tsx scripts/apply-car-research.ts data/research/byd.json --apply   write

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

const file = process.argv[2] ?? ''
const APPLY = process.argv.includes('--apply')
if (!file) {
  console.error('Usage: npx tsx scripts/apply-car-research.ts <research.json> [--apply]')
  process.exit(1)
}

type Fill = { value: string | number; source: string; note?: string }
type Correction = { value: string | number | null; source: string; note: string }
type Entry = {
  fills?: Record<string, Fill>
  corrections?: Record<string, Correction>
  conflicts?: Array<{ column: string; current: unknown; found: unknown; source: string; note?: string }>
}

/** Columns a research batch may fill, and how each is stored. */
const COLUMNS: Record<string, 'int' | 'float' | 'string'> = {
  variant: 'string', modelYear: 'int', generation: 'string',
  rangeStandard: 'string', electricRangeStandard: 'string',
  batteryCapacity: 'float', range: 'int', rangeMax: 'int', electricRange: 'int', electricRangeMax: 'int',
  power: 'int', acceleration: 'float', topSpeed: 'int', torque: 'int', seats: 'int',
  dcCharging: 'float', acCharging: 'float', connectors: 'string', engineCapacity: 'int',
  bodyType: 'string', driveType: 'string', motorPowerKw: 'int',
  realWorldRange: 'int', realWorldRangeMax: 'int', consumption: 'float', consumptionMax: 'float',
  acChargingHours: 'float', dcChargingMinutes: 'int', batteryTech: 'string',
  lengthMm: 'int', widthMm: 'int', heightMm: 'int', wheelbaseMm: 'int',
  groundClearanceMm: 'int', groundClearanceMaxMm: 'int', bootCapacityL: 'int', kerbWeightKg: 'int',
  availability: 'string', distributor: 'string', warranty: 'string', notes: 'string',
  priceMin: 'int', priceMax: 'int', priceDisplay: 'string',
}

const empty = (value: unknown) => value === null || value === undefined || value === ''

function coerce(column: string, value: string | number): string | number {
  const kind = COLUMNS[column]
  if (kind === 'string') return String(value)
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${column}: "${value}" is not a number`)
  return kind === 'int' ? Math.round(number) : number
}

async function main() {
  const batch = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Entry>
  const prisma = new PrismaClient()
  let filled = 0
  let skipped = 0

  try {
    for (const [slug, entry] of Object.entries(batch)) {
      const car = await prisma.car.findUnique({ where: { slug } })
      if (!car) {
        console.log(`✗ ${slug}: no such car — skipped`)
        continue
      }
      const row = car as unknown as Record<string, unknown>
      const data: Record<string, string | number | null> = {}
      const history: Array<{ field: string; oldValue: string | null; newValue: string | null; sourceUrl: string; reason?: string }> = []

      for (const [column, fill] of Object.entries(entry.fills ?? {})) {
        if (!(column in COLUMNS)) throw new Error(`${slug}: "${column}" is not a fillable column`)
        if (!fill.source?.startsWith('http')) throw new Error(`${slug}.${column}: every fill needs a source URL`)
        if (!empty(row[column])) {
          skipped++
          continue
        }
        const value = coerce(column, fill.value)
        data[column] = value
        history.push({ field: column, oldValue: null, newValue: String(value), sourceUrl: fill.source, reason: fill.note })
      }

      for (const [column, correction] of Object.entries(entry.corrections ?? {})) {
        if (!(column in COLUMNS)) throw new Error(`${slug}: "${column}" is not a correctable column`)
        if (!correction.source?.startsWith('http')) throw new Error(`${slug}.${column}: every correction needs a source URL`)
        if (!correction.note) throw new Error(`${slug}.${column}: every correction needs a note saying why`)
        const value = correction.value === null ? null : coerce(column, correction.value)
        const current = row[column]
        if (current === value) continue
        data[column] = value
        history.push({
          field: column,
          oldValue: empty(current) ? null : String(current),
          newValue: value === null ? null : String(value),
          sourceUrl: correction.source,
          reason: `Correction: ${correction.note}`,
        })
        console.log(`  ~ ${column}: ${JSON.stringify(current)} → ${JSON.stringify(value)}`)
      }

      console.log(`${slug}: ${history.length} to fill${history.length ? ` (${history.map((h) => h.field).join(', ')})` : ''}`)
      for (const conflict of entry.conflicts ?? []) {
        console.log(`  ! ${conflict.column}: database ${JSON.stringify(conflict.current)}, source ${JSON.stringify(conflict.found)} — ${conflict.source}`)
      }

      if (!APPLY || history.length === 0) continue
      await prisma.$transaction([
        prisma.car.update({ where: { id: car.id }, data }),
        ...history.map((change) =>
          prisma.carChangeHistory.create({
            data: {
              id: randomUUID(),
              carId: car.id,
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              sourceUrl: change.sourceUrl,
              approvedBy: `research batch ${file}`,
              reason: change.reason ?? 'Filled an empty column from a cited source',
            },
          }),
        ),
      ])
      filled += history.length
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log(APPLY ? `\nFilled ${filled} cells. ${skipped} already had a value and were left alone.` : '\nReport only. Pass --apply to write.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
