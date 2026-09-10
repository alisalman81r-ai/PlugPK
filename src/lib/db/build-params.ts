// src/lib/db/build-params.ts
import { Prisma } from '@prisma/client'

/**
 * Wraps a generateStaticParams body so a build without a reachable database
 * produces zero prebuilt pages instead of failing.
 *
 * ── Why ──────────────────────────────────────────────────────────────
 *
 * Five routes prebuild their params from Postgres. That is the right shape at
 * runtime, but it makes `next build` depend on a live database, and a Vercel
 * builder has no route to a local one. The failure is not obvious from the
 * log: Next reports "Failed to collect page data for /cars/[slug]" and the
 * Prisma cause scrolls past above it.
 *
 * Returning an empty list is safe because dynamicParams defaults to true —
 * nothing is prebuilt, every slug is rendered on first request instead, and an
 * unknown one still 404s through the notFound() each page already calls. The
 * cost is the first hit per slug, not correctness.
 *
 * ── Why it does not swallow everything ───────────────────────────────
 *
 * Only PrismaClientInitializationError is caught: no DATABASE_URL, a malformed
 * URL, an unreachable host, a rejected password. Those mean "there is no
 * database here", which is a deployment fact rather than a defect.
 *
 * P2021 joins them: the connection worked but the table is not there, which
 * means the migration has not been applied to this database yet. That is the
 * same class of fact, and it is the state a fresh hosted database is in between
 * being created and `prisma migrate deploy` being run against it.
 *
 * A query that throws once connected to a migrated database — a renamed column,
 * a bad `select` — is a real bug, and silently shipping zero pages for it is
 * exactly the kind of quiet breakage that costs an afternoon. P2022 and the
 * rest rethrow and stop the build.
 */
export async function prebuiltParams<T>(route: string, load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch (error) {
    const reason = notDeployedYet(error)
    if (!reason) throw error

    console.warn(
      `  ⚠ ${route}: ${reason}, so no pages were prebuilt for it. They will ` +
        `render on first request instead.`,
    )
    return []
  }
}

/**
 * `instanceof` alone is not enough. A build can end up with more than one copy
 * of @prisma/client resolved — the generated client and the one this module
 * imports — and across that boundary the check fails even for the right error.
 * The name and the P1xxx connection codes are the stable signal.
 */
function notDeployedYet(error: unknown): string | null {
  const unreachable =
    'no database reachable at build time — set DATABASE_URL to one this build can reach'

  if (error instanceof Prisma.PrismaClientInitializationError) return unreachable

  if (typeof error !== 'object' || error === null) return null
  const { name, errorCode, code } = error as {
    name?: string
    errorCode?: string
    code?: string
  }

  if (name === 'PrismaClientInitializationError') return unreachable

  // P1000 authentication failed, P1001 cannot reach server, P1002 timed out,
  // P1003 database does not exist, P1017 server closed the connection.
  // These arrive as `errorCode` on an initialization error and as `code` on a
  // request error, depending on where the connection gave out.
  const connection = /^P100[0-3]$|^P1017$/
  if (
    (typeof errorCode === 'string' && connection.test(errorCode)) ||
    (typeof code === 'string' && connection.test(code))
  ) {
    return unreachable
  }

  // Connected, but the schema is not there yet.
  if (code === 'P2021') {
    return 'the database has no tables yet — run `prisma migrate deploy` against it'
  }

  return null
}
