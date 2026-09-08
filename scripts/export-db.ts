// scripts/export-db.ts
//
// Every row of every table, as JSON, into data/db-export/.
//
// ── Why this exists ───────────────────────────────────────────────────
//
// The catalogue already had a snapshot (scripts/export-cars.ts) because it is
// the part somebody spent weeks entering by hand. Nothing else did. Moving off
// SQLite means the stations, the reviews, the community posts and the whole
// crawler history have to come with, and "the whole database" is not something
// a per-table script can be asked for one table at a time.
//
// This walks Prisma's own model list rather than a hardcoded array, so a model
// added to the schema is exported without anybody remembering to add it here.
//
//   npx tsx scripts/export-db.ts
//
// The output is one file per model plus a manifest, pretty-printed and sorted
// by id, so a diff between two exports reads as a list of what changed rather
// than a reshuffle. Import it with scripts/import-db.ts.
//
// ── Dates and Decimals ────────────────────────────────────────────────
//
// JSON.stringify turns a Date into an ISO string and would turn a Prisma
// Decimal into an object. Both are written as tagged wrappers so the import can
// put them back as the types Prisma expects, rather than as strings that happen
// to look right until something sorts them.

import { Prisma, PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'data', 'db-export')

const prisma = new PrismaClient()

/** Model names as Prisma exposes them on the client, e.g. Station -> station. */
function clientKey(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) return { __type: 'Date', value: value.toISOString() }
  if (typeof value === 'bigint') return { __type: 'BigInt', value: value.toString() }
  if (value instanceof Prisma.Decimal) return { __type: 'Decimal', value: value.toString() }
  if (Buffer.isBuffer(value)) return { __type: 'Buffer', value: value.toString('base64') }
  return value
}

async function main() {
  await mkdir(OUT, { recursive: true })

  const models = Prisma.dmmf.datamodel.models
  const manifest: Array<{ model: string; file: string; rows: number }> = []
  let total = 0

  for (const model of models) {
    const key = clientKey(model.name)
    const delegate = (prisma as unknown as Record<string, { findMany: (a?: unknown) => Promise<unknown[]> }>)[key]
    if (!delegate?.findMany) {
      console.log(`  ${model.name.padEnd(22)} SKIPPED (no delegate)`)
      continue
    }

    // Sorted by the first id-ish field so two exports of the same data match.
    const idField = model.fields.find((f) => f.isId)?.name
    const rows = await delegate.findMany(idField ? { orderBy: { [idField]: 'asc' } } : undefined)

    const file = `${key}.json`
    await writeFile(join(OUT, file), JSON.stringify(rows, replacer, 2) + '\n', 'utf8')
    manifest.push({ model: model.name, file, rows: rows.length })
    total += rows.length
    console.log(`  ${model.name.padEnd(22)} ${String(rows.length).padStart(6)} rows`)
  }

  await writeFile(
    join(OUT, '_manifest.json'),
    JSON.stringify(
      { exportedAt: new Date().toISOString(), totalRows: total, models: manifest },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  console.log('')
  console.log(`${total} rows across ${manifest.length} models -> data/db-export/`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
