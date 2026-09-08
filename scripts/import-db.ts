// scripts/import-db.ts
//
// Loads data/db-export/ into whatever DATABASE_URL points at.
//
//   DATABASE_URL="postgresql://..." npx tsx scripts/import-db.ts
//   DATABASE_URL="postgresql://..." npx tsx scripts/import-db.ts --dry
//
// ── Order is worked out, not declared ─────────────────────────────────
//
// Twenty-five models with foreign keys between them have an insert order, and
// writing that order by hand is a list that is correct until somebody adds a
// relation and forgets this file. Instead the import makes repeated passes:
// every row that inserts is kept, every row that fails on a constraint is put
// back in the queue, and the passes continue while any progress is being made.
// A row whose parent has not been inserted yet simply succeeds on a later pass.
//
// When a pass inserts nothing and rows remain, those rows are genuinely
// unsatisfiable — a parent that does not exist in the export at all — and the
// script stops and prints them rather than looping. That is a real problem with
// the data and silence would be the wrong answer to it.
//
// ── It refuses to run over existing rows ──────────────────────────────
//
// Importing into a database that already has content is how you get two of
// everything, so a non-empty target aborts unless --force is passed. This is
// meant to run once, into an empty database, immediately after migrate.

import { Prisma, PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'data', 'db-export')
const DRY = process.argv.includes('--dry')
const FORCE = process.argv.includes('--force')

const prisma = new PrismaClient()

function clientKey(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

/** Puts back the types export-db.ts wrapped on the way out. */
function reviver(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && '__type' in (value as Record<string, unknown>)) {
    const tagged = value as { __type: string; value: string }
    if (tagged.__type === 'Date') return new Date(tagged.value)
    if (tagged.__type === 'BigInt') return BigInt(tagged.value)
    if (tagged.__type === 'Decimal') return new Prisma.Decimal(tagged.value)
    if (tagged.__type === 'Buffer') return Buffer.from(tagged.value, 'base64')
  }
  return value
}

interface Pending {
  model: string
  key: string
  row: Record<string, unknown>
}

async function main() {
  if (!existsSync(join(DIR, '_manifest.json'))) {
    console.error('No data/db-export/_manifest.json — run `npx tsx scripts/export-db.ts` first.')
    process.exitCode = 1
    return
  }

  const models = Prisma.dmmf.datamodel.models
  const delegates = prisma as unknown as Record<
    string,
    { count: () => Promise<number>; create: (a: { data: unknown }) => Promise<unknown> }
  >

  // Refuse to double up.
  let existing = 0
  for (const model of models) {
    const d = delegates[clientKey(model.name)]
    if (d?.count) existing += await d.count()
  }
  if (existing > 0 && !FORCE) {
    console.error(`The target database already holds ${existing} rows.`)
    console.error('This import is meant for an empty database. Pass --force to add to it anyway.')
    process.exitCode = 1
    return
  }

  // Load everything first, so a malformed file fails before any write.
  let queue: Pending[] = []
  for (const model of models) {
    const key = clientKey(model.name)
    const path = join(DIR, `${key}.json`)
    if (!existsSync(path)) continue
    const rows = JSON.parse(await readFile(path, 'utf8'), reviver) as Record<string, unknown>[]
    for (const row of rows) queue.push({ model: model.name, key, row })
  }

  console.log(`${queue.length} rows to insert`)
  if (DRY) {
    console.log('--dry: nothing written.')
    return
  }

  let inserted = 0
  let pass = 0
  const counts = new Map<string, number>()

  while (queue.length > 0) {
    pass += 1
    const retry: Pending[] = []
    let progressed = 0
    let lastError = ''

    for (const item of queue) {
      try {
        await delegates[item.key]!.create({ data: item.row })
        inserted += 1
        progressed += 1
        counts.set(item.model, (counts.get(item.model) ?? 0) + 1)
      } catch (error) {
        lastError = error instanceof Error ? error.message.split('\n')[0]! : String(error)
        retry.push(item)
      }
    }

    console.log(`  pass ${pass}: +${progressed}, ${retry.length} deferred`)

    if (progressed === 0) {
      console.error('')
      console.error(`Stuck with ${retry.length} rows that cannot be inserted.`)
      console.error(`Last error: ${lastError}`)
      const stuck = new Map<string, number>()
      for (const r of retry) stuck.set(r.model, (stuck.get(r.model) ?? 0) + 1)
      for (const [model, n] of stuck) console.error(`  ${model}: ${n}`)
      process.exitCode = 1
      return
    }

    queue = retry
  }

  console.log('')
  for (const [model, n] of [...counts.entries()].sort()) {
    console.log(`  ${model.padEnd(22)} ${String(n).padStart(6)}`)
  }
  console.log('')
  console.log(`${inserted} rows imported in ${pass} pass${pass === 1 ? '' : 'es'}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
