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

import { connect } from 'node:net'
import { readFileSync, existsSync } from 'node:fs'

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

// Reachability. A URL that parses but answers nothing is the other half of the
// same problem, and the message Prisma gives for it arrives one page at a time.
try {
  const parsed = new URL(url)
  const dbPort = Number(parsed.port || 5432)
  const dbHost = parsed.hostname
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
