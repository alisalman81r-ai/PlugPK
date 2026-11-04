// src/app/admin/(protected)/cars/page.tsx
import { LENS_KEYS, SORT_KEYS, type Lens, type SortKey } from '@/components/admin/car-inventory-filter'
import { flattenParams, pick } from '@/components/admin/list-params'
import { toPage, toQuery } from '@/lib/db/admin-queries'
import { auditCatalogue } from '@/lib/car-admin'
import { listCars } from '@/lib/db/car-queries'

import { CarsView } from './cars-view'

/**
 * The car catalogue, for an operator.
 *
 * Cars are a Prisma table, like everything else in this portal, so this
 * section reads and writes. src/data/cars.ts remains as the seed, and
 * scripts/seed-cars.ts loads it. Editing happens here.
 *
 * The catalogue's governing rule survives the move: nothing is invented, so a
 * figure that was never published is null rather than estimated. That makes the
 * gaps deliberate, and the gaps the work list — which is why this page leads
 * with what is missing rather than with a count of what is there.
 */

export const metadata = { title: { absolute: 'Cars · plugpk admin' } }

/** An admin page reading live rows must never be served from a cache. */
export const dynamic = 'force-dynamic'

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const query = toQuery(params.q)
  const lens = pick<Lens>(params.lens, LENS_KEYS, 'all')
  const sort = pick<SortKey>(params.sort, SORT_KEYS, 'name')
  const page = toPage(params.page)

  // The audit is computed in TypeScript, so the whole catalogue is read for
  // the tiles — but only one page of rows is sent to the browser.
  const audits = auditCatalogue(await listCars())

  return <CarsView audits={audits} params={params} query={query} lens={lens} sort={sort} page={page} />
}

