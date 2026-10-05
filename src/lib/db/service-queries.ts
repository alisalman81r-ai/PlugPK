// src/lib/db/service-queries.ts
import 'server-only'

import type { EVService, ServiceCategory } from '@/lib/types'

import { prisma } from './client'
import { toService } from './serialize'

/**
 * Reads for the public services directory that the shared queries module does
 * not cover.
 *
 * The category page used to load every approved service and filter the list in
 * JavaScript — the whole directory read on every visit to show one slice of
 * it. The filter now runs in the database, on the same approved-only rule as
 * getServices(): an application nobody has reviewed must never reach a public
 * page, however it is queried.
 */
export async function getServicesByCategory(category: ServiceCategory): Promise<EVService[]> {
  const rows = await prisma.eVService.findMany({
    where: { status: 'approved', category },
    orderBy: { name: 'asc' },
  })
  return rows.map(toService)
}
