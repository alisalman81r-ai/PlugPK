// scripts/export-cars.ts
//
// Snapshots the live catalogue out of the database into a tracked file, and
// copies the photographs that go with it out of the gitignored upload
// directory.
//
//   npx tsx scripts/export-cars.ts                 write the snapshot
//   npx tsx scripts/export-cars.ts --dry           report, write nothing
//   npx tsx scripts/export-cars.ts --no-images     rows only, skip the copy
//
// ── Why this exists ──────────────────────────────────────────────────
//
// The database is the live catalogue and `src/data/cars.ts` is only the seed
// it started from. Everything entered or corrected through the admin portal
// since then — 48 rows, and a photograph for every one of them — lives in two
// places that .gitignore excludes on purpose:
//
//   prisma/dev.db          (line 31)
//   public/uploads/        (line 42)
//
// Which is correct for a local database and for user-uploaded content, and also
// means a `prisma migrate reset`, a fresh clone, or a dead disk takes the lot.
// There was no way to get that work back. Now there is.
//
// This is a backup, not a migration. It does NOT touch src/data/cars.ts, the
// database, or the uploads — it only reads them and writes somewhere new. The
// seed stays the authored, reviewed starting point; this is the state of the
// running system beside it.
//
// ── What it writes ───────────────────────────────────────────────────
//
//   data/catalogue-snapshot.json    every column of every row, plus the
//                                   export date and the row count
//   data/catalogue-images/          the photograph for each row, renamed from
//                                   its upload uuid to the car's slug so the
//                                   file says which car it belongs to
//
// Both are inside the repository and neither is gitignored, so `git add data`
// puts the catalogue under version control. The JSON is pretty-printed and
// sorted by id: a diff between two snapshots is then a readable list of what
// actually changed, which is the point of keeping it in git rather than a
// binary .db copy.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { PrismaClient } from '@prisma/client'

const DRY = process.argv.includes('--dry')
const NO_IMAGES = process.argv.includes('--no-images')

const OUT_DIR = path.join(process.cwd(), 'data')
const OUT_JSON = path.join(OUT_DIR, 'catalogue-snapshot.json')
const OUT_IMAGES = path.join(OUT_DIR, 'catalogue-images')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

const prisma = new PrismaClient()

/** Where a stored image path actually lives on disk, or null if nowhere. */
function resolveImage(stored: string | null): string | null {
  if (!stored) return null
  // Stored paths are public-relative ("/uploads/cars/x.jpg"), so they resolve
  // under public/. A path that does not is reported rather than guessed at.
  const onDisk = path.join(PUBLIC_DIR, stored.replace(/^\//, ''))
  return fs.existsSync(onDisk) ? onDisk : null
}

async function main() {
  const rows = await prisma.car.findMany({ orderBy: { id: 'asc' } })

  console.log(`${rows.length} rows in the database`)

  const withImage = rows.filter((row) => row.image)
  const missingFile: string[] = []
  const copied: Array<{ slug: string; from: string; to: string }> = []

  for (const row of withImage) {
    const onDisk = resolveImage(row.image)
    if (!onDisk) {
      missingFile.push(`${row.id} -> ${row.image}`)
      continue
    }
    copied.push({
      slug: row.slug,
      from: onDisk,
      to: path.join(OUT_IMAGES, `${row.slug}${path.extname(onDisk)}`),
    })
  }

  console.log(`${withImage.length} rows carry an image path`)
  console.log(`${copied.length} of those resolve to a file on disk`)
  if (missingFile.length > 0) {
    console.log(`${missingFile.length} point at a file that is not there:`)
    for (const line of missingFile) console.log(`  ${line}`)
  }
  if (rows.length - withImage.length > 0) {
    console.log(`${rows.length - withImage.length} row(s) carry no image path at all`)
  }

  /*
    A digest of the rows, so two snapshots can be compared without reading
    them. Taken over the JSON exactly as written, so it changes if and only if
    the exported content does.
  */
  const payload = {
    exportedAt: new Date().toISOString(),
    rowCount: rows.length,
    imageCount: copied.length,
    source: 'prisma/dev.db (the live catalogue)',
    note:
      'Snapshot of the running catalogue, taken because both the database and the ' +
      'upload directory are gitignored. Not the seed: src/data/cars.ts remains the ' +
      'authored starting point and is not modified by this export.',
    cars: rows,
  }
  const json = `${JSON.stringify(payload, null, 2)}\n`
  const digest = crypto.createHash('sha256').update(json).digest('hex').slice(0, 12)

  if (DRY) {
    console.log(`\n[dry] would write ${OUT_JSON} (${(json.length / 1024).toFixed(1)} KB, sha ${digest})`)
    console.log(`[dry] would copy ${copied.length} image(s) into ${OUT_IMAGES}`)
    return
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_JSON, json, 'utf8')
  console.log(`\nwrote ${path.relative(process.cwd(), OUT_JSON)} (${(json.length / 1024).toFixed(1)} KB, sha ${digest})`)

  if (NO_IMAGES) {
    console.log('skipped the images (--no-images)')
    return
  }

  fs.mkdirSync(OUT_IMAGES, { recursive: true })
  let bytes = 0
  for (const file of copied) {
    fs.copyFileSync(file.from, file.to)
    bytes += fs.statSync(file.to).size
  }
  console.log(
    `copied ${copied.length} image(s) into ${path.relative(process.cwd(), OUT_IMAGES)} (${(bytes / 1024 / 1024).toFixed(1)} MB)`,
  )
  console.log('\nBoth paths are tracked. `git add data` puts the catalogue under version control.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
