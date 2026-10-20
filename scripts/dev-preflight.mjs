// scripts/dev-preflight.mjs
//
// Runs as `predev`. Stops `next dev` from starting into a state that produces
// confusing failures later instead of a clear one now.
//
// ── Why this is not just "nice to have" ───────────────────────────────
//
// Both of the things it checks have already cost an afternoon each.
//
// A SECOND DEV SERVER. `next dev` does not fail when its port is taken — it
// increments and starts on the next one. Neither run sets NEXT_DIST_DIR, so the
// two then write build manifests over each other in one `.next`. That does not
// present as a port conflict. It presents as "Internal Server Error" on every
// route of one server and 404s on the other, which reads like the application
// is broken.
//
// A DATABASE URL THAT CANNOT WORK. After the move to Postgres, a leftover
// SQLite URL in .env let the server start normally and then throw
// "the URL must start with postgresql://" on every page that touches data —
// while pages already compiled kept serving from cache. Half the site worked.
// That is the worst kind of failure: intermittent, and pointing nowhere near
// the actual cause.
//
// Both are cheap to detect before Next starts, and neither is obvious after.

import { execSync, spawn } from 'node:child_process'
import { connect } from 'node:net'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PORT = Number(process.env.PORT ?? 3000)

const red = (s) => `\x1b[31m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

function fail(lines) {
  console.error('')
  for (const line of lines) console.error(line)
  console.error('')
  process.exit(1)
}

/**
 * Is something answering on this port?
 *
 * Connect, do not bind. Binding and treating EADDRINUSE as "taken" is the
 * obvious approach and is wrong on Windows: Node sets SO_REUSEADDR, so a second
 * bind to a port another process is listening on succeeds and the probe reports
 * it free. Written that way first, this let a second dev server straight
 * through on its first test.
 */
function portInUse(port, host = '127.0.0.1', timeout = 1500) {
  return new Promise((resolve) => {
    const socket = connect({ port, host })
    const done = (result) => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(timeout)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

/** DATABASE_URL from the environment, falling back to a literal in .env. */
function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (!existsSync('.env')) return null
  const line = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trimStart().startsWith('DATABASE_URL='))
  if (!line) return null
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
}

// ── 1. Port ───────────────────────────────────────────────────────────

if (!process.env.NEXT_DIST_DIR && (await portInUse(PORT))) {
  fail([
    red(`  Port ${PORT} is already in use, and a dev server is probably on it.`),
    '',
    '  Not starting a second one: next dev would move to the next free port and',
    '  then share .next with the first, which corrupts both — "Internal Server',
    '  Error" on one and 404s on the other.',
    '',
    `  ${bold('Use the server that is already running')}, or stop it:`,
    '',
    dim(`    npx kill-port ${PORT}`),
    '',
    '  To run a second one deliberately, give it its own output directory:',
    '',
    dim(`    NEXT_DIST_DIR=.next-alt npx next dev -p ${PORT + 5}`),
  ])
}

// ── 2. Database ───────────────────────────────────────────────────────

const url = readDatabaseUrl()

if (!url) {
  fail([
    red('  DATABASE_URL is not set.'),
    '',
    '  Copy .env.example to .env and fill it in, or start a local database:',
    '',
    dim('    npm run db:local'),
  ])
}

if (!/^postgres(ql)?:\/\//.test(url)) {
  const looksLikeSqlite = url.startsWith('file:')
  fail([
    red('  DATABASE_URL is not a Postgres URL.'),
    '',
    `  Found: ${dim(url.replace(/:\/\/[^@]*@/, '://***@'))}`,
    '',
    ...(looksLikeSqlite
      ? [
          '  That is a SQLite URL. This project moved to Postgres — the schema',
          '  declares it and there is no SQLite fallback, deliberately, so that',
          '  local behaviour matches production.',
          '',
          '  Left as is, the server would start and then fail on every page that',
          '  reads data, while already-compiled pages kept serving from cache.',
        ]
      : ['  It must start with postgresql:// or postgres://']),
    '',
    '  Start a local Postgres with the project data already in it:',
    '',
    dim('    npm run db:local'),
    '',
    '  Or point DATABASE_URL at a hosted database — see docs/VERCEL.md.',
  ])
}

/*
  The local database (npm run db:local) is started here when it is not
  running, rather than asking for it every morning. It is spawned detached,
  with its output in .localdb/server.log, so it keeps running after the dev
  server stops and the next `npm run dev` finds it already up. A restart of
  the machine stops it; the next `npm run dev` starts it again.
*/
const LOCAL_DB_PORT = 55432
const LOCAL_DB_LOG = join('.localdb', 'server.log')

async function startLocalDatabase(host, port) {
  const firstRun = !existsSync(join('.localdb', 'data'))
  console.log('')
  console.log(bold('  Starting the local database in the background…'))
  if (firstRun) console.log(dim('  First run: installing Postgres and importing the data, a few minutes.'))
  console.log(dim(`  Its output goes to ${LOCAL_DB_LOG}.`))

  mkdirSync('.localdb', { recursive: true })
  const log = openSync(LOCAL_DB_LOG, 'a')
  const child = spawn(process.execPath, [join('scripts', 'local-postgres.mjs')], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', log, log],
    windowsHide: true,
  })
  child.unref()
  closeSync(log)

  let exited = null
  child.once('exit', (code) => {
    exited = code
  })

  const deadline = Date.now() + (firstRun ? 10 * 60_000 : 90_000)
  while (Date.now() < deadline) {
    if (await portInUse(port, host, 1000)) {
      console.log(dim('  Database is up.'))
      return true
    }
    if (exited !== null) break
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

// Reachability. A URL that parses but answers nothing is the other half of the
// same problem, and the message Prisma gives for it arrives one page at a time.
try {
  const parsed = new URL(url)
  const dbPort = Number(parsed.port || 5432)
  const dbHost = parsed.hostname
  const isLocalDb = ['127.0.0.1', 'localhost'].includes(dbHost) && dbPort === LOCAL_DB_PORT

  if (isLocalDb && !(await portInUse(dbPort, dbHost, 1500))) {
    if (!(await startLocalDatabase(dbHost, dbPort))) {
      fail([
        red('  The local database did not start.'),
        '',
        `  See what it printed in ${LOCAL_DB_LOG}, or run it in its own terminal:`,
        '',
        dim('    npm run db:local'),
      ])
    }
  }

  // New migrations pulled since the last run, applied before any page needs
  // them. Local database only: a hosted one is migrated deliberately.
  if (isLocalDb) {
    try {
      execSync('npx prisma migrate deploy', { stdio: 'pipe', env: { ...process.env, DATABASE_URL: url } })
    } catch (error) {
      fail([
        red('  Applying migrations to the local database failed.'),
        '',
        dim(String(error.stderr ?? error.stdout ?? error.message).trim().split('\n').slice(-6).join('\n')),
        '',
        '  Run it yourself to see the whole output:',
        '',
        dim('    npx prisma migrate deploy'),
      ])
    }
  }

  if (!(await portInUse(dbPort, dbHost, 2500))) {
    fail([
      red(`  Nothing is answering at ${dbHost}:${dbPort}.`),
      '',
      '  DATABASE_URL is well formed but the server is not reachable, so every',
      '  page that reads data would fail once the server was up.',
      '',
      '  If this is the local development database, start it:',
      '',
      dim('    npm run db:local'),
      '',
      '  If it is hosted, check the URL and that the network is up.',
    ])
  }
} catch {
  fail([red('  DATABASE_URL could not be parsed as a URL.')])
}

process.exit(0)
