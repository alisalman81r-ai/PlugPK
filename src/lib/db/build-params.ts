// src/lib/db/build-params.ts
import { databaseUnavailable } from '@/lib/db/availability'

/**
 * Wraps a generateStaticParams body so a build without a usable database
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
 * What counts as "no usable database" — unreachable, unset, or reachable but
 * unmigrated — is decided in lib/db/availability, which the runtime guard
 * shares. A query that fails once connected to a migrated database is a defect
 * rather than a deployment fact, and still stops the build.
 */
export async function prebuiltParams<T>(route: string, load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch (error) {
    const reason = databaseUnavailable(error)
    if (!reason) throw error

    console.warn(
      `  ⚠ ${route}: ${reason}, so no pages were prebuilt for it. They will ` +
        `render on first request instead.`,
    )
    return []
  }
}
