// src/lib/db/availability.ts
import { Prisma } from '@prisma/client'

/**
 * Telling "there is no database here" apart from "this query is wrong".
 *
 * Both arrive as a thrown Prisma error, and the two need opposite handling: a
 * missing database is a deployment fact that the page should survive, while a
 * renamed column is a defect that should be loud. Everything that decides
 * between them lives here so the build-time guard (build-params) and the
 * runtime one below cannot drift apart.
 *
 * Returns a human sentence naming the problem, or null when the error is not
 * about availability at all and belongs to the caller.
 */
export function databaseUnavailable(error: unknown): string | null {
  const unreachable = 'no database reachable — set DATABASE_URL to one this deployment can reach'

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

/**
 * How long a page will wait for the database before rendering without it.
 *
 * The number is chosen against the serverless function limit rather than
 * against how fast the database usually is. A Hobby function is killed at 10s,
 * and a killed function is a 504 — the visitor gets a browser error page
 * instead of the site, which is strictly worse than the site with a figure
 * missing from it. Five seconds leaves room to finish rendering and still
 * answer inside the limit.
 *
 * A healthy query here takes single-digit milliseconds, so this never fires in
 * normal operation.
 */
const READ_TIMEOUT_MS = 5_000

/**
 * A read whose failure should cost its own section of the page, not the page.
 *
 * This is for supplementary data — the counters on the landing page, a rail of
 * clubs. When the database cannot answer, the visitor is better served by the
 * rest of the page than by the error boundary, which throws away the header,
 * the navigation and every static section along with the number that failed.
 *
 * ── Not for everything ───────────────────────────────────────────────
 *
 * A page that exists to show a row — a car, a station — must NOT use this. An
 * empty page served with HTTP 200 is a soft 404: a crawler indexes it as real
 * content and a visitor cannot tell a broken site from an empty one. Those
 * pages should keep throwing, and the boundary should keep catching them.
 *
 * ── The cache consequence ────────────────────────────────────────────
 *
 * The landing page is cached for 300s. A render that fell back is cached like
 * any other, so a database outage can leave zeros on the page for up to five
 * minutes after the database returns. That is the accepted cost of not showing
 * an error page, and any write that matters already calls revalidatePath('/').
 *
 * A query error that is not about availability — a bad `select`, a renamed
 * column — is rethrown, because silently rendering zeros for a real defect is
 * how a broken page survives to production.
 */
export async function readOrFallback<T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      load(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new DatabaseTimeout()), READ_TIMEOUT_MS)
      }),
    ])
  } catch (error) {
    const reason = error instanceof DatabaseTimeout ? error.message : databaseUnavailable(error)
    if (!reason) throw error

    console.warn(`  ⚠ ${label}: ${reason}. Rendering without it.`)
    return fallback
  } finally {
    // Without this the timer holds the event loop open, which on a serverless
    // function is billed time after the response has already been sent.
    if (timer) clearTimeout(timer)
  }
}

class DatabaseTimeout extends Error {
  constructor() {
    super(`the database did not answer within ${READ_TIMEOUT_MS}ms`)
    this.name = 'DatabaseTimeout'
  }
}
