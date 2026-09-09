// scripts/local-postgres.mjs
//
// A real PostgreSQL for local development, with the project's data in it.
//
//   npm run db:local
//
// First run: downloads a Postgres binary, creates a cluster, applies the
// migration and imports data/db-export/. Later runs just start it. Leave it
// running in its own terminal; Ctrl-C stops it and keeps the data.
//
// ── Why this exists ───────────────────────────────────────────────────
//
// The project moved from SQLite to Postgres, deliberately with no fallback, so
// that `contains` behaves the same locally as in production. The cost is that
// `npm run dev` needs a Postgres, and "install Postgres" is a bad first step
// for someone who just cloned the repository.
//
// ── Why it is not a dependency in package.json ────────────────────────
//
// The `embedded-postgres` package pulls a ~30MB server binary. Vercel installs
// devDependencies during a build, so listing it there would download that
// binary on every deploy to run a database nothing in production uses. Instead
// it is installed on demand into .localdb/, which is gitignored, and
// package.json never mentions it.
//
// It is also beta-only at the time of writing, which is fine for a local
// development convenience and would not be fine for something a production
// build depends on.
//
// ── UTF8 is not optional ──────────────────────────────────────────────
//
// initdb takes its encoding from the host locale, which on a Windows machine
// gives a WIN1252 cluster. The catalogue contains "≈" (U+2248) in a note on
// alektra-solar-mini-x4, and importing that row into WIN1252 fails with
// SQLSTATE 22P05: "character with byte sequence 0xe2 0x89 0x88 ... has no
// equivalent in encoding WIN1252". Exactly one row in 155, which is the kind of
// thing that looks like a corrupt export rather than a cluster setting.
//
// Hosted providers give UTF8 by default. This forces it so the local database
// matches them.

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const HOME = join(ROOT, '.localdb')
const DATA = join(HOME, 'data')
const PORT = 55432
const USER = 'plugpk'
const PASSWORD = 'plugpk'
const DBNAME = 'plugpk'
const VERSION = '18.4.0-beta.17'

const DB_URL = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DBNAME}`

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options })
}

// ── Install the server, once ──────────────────────────────────────────

if (!existsSync(join(HOME, 'node_modules', 'embedded-postgres'))) {
  console.log(bold('\nInstalling a local Postgres server (first run only)…\n'))
  mkdirSync(HOME, { recursive: true })
  writeFileSync(
    join(HOME, 'package.json'),
    JSON.stringify({ name: 'plugpk-localdb', private: true, version: '1.0.0' }, null, 2) + '\n',
  )
  run(`npm install embedded-postgres@${VERSION} --no-audit --no-fund`, { cwd: HOME })
}

/*
  pathToFileURL rather than string concatenation. A Windows absolute path is
  `F:\...`, which is not a valid URL and which `import()` rejects; hand-building
  `file://` + the path gets the drive letter and the backslashes wrong in
  different ways depending on the depth.
*/
const { default: EmbeddedPostgres } = await import(
  pathToFileURL(join(HOME, 'node_modules', 'embedded-postgres', 'dist', 'index.js')).href
)

const pg = new EmbeddedPostgres({
  databaseDir: DATA,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
  // See the UTF8 note at the head of this file. `--locale=C` keeps collation
  // predictable and independent of whatever the host machine is set to.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})

const firstRun = !existsSync(DATA)

if (firstRun) {
  console.log(bold('\nCreating the cluster (UTF8)…\n'))
  await pg.initialise()
}

await pg.start()

if (firstRun) {
  try {
    await pg.createDatabase(DBNAME)
  } catch (error) {
    console.log(dim(`  createDatabase: ${String(error.message).slice(0, 100)}`))
  }

  console.log(bold('\nApplying the migration…\n'))
  run('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: DB_URL } })

  console.log(bold('\nImporting data/db-export/…\n'))
  run('npx tsx scripts/import-db.ts', { env: { ...process.env, DATABASE_URL: DB_URL } })
}

console.log('')
console.log(green(bold('  Postgres is running.')))
console.log('')
console.log('  Put this in .env:')
console.log('')
console.log(`    DATABASE_URL="${DB_URL}"`)
console.log('')
console.log(dim('  Leave this running and start the app in another terminal:'))
console.log(dim('    npm run dev'))
console.log('')
console.log(dim('  Ctrl-C stops the server. The data stays in .localdb/data.'))
console.log('')

const shutdown = async () => {
  console.log('\nStopping Postgres…')
  try {
    await pg.stop()
  } catch {
    // Already down is the desired end state.
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Hold the process open; the server dies with it.
setInterval(() => {}, 1 << 30)
