// src/app/admin/(protected)/members/page.tsx
import { flattenParams, pick } from '@/components/admin/list-params'
import { listMembersPage, toPage, toQuery, type MemberFilter, type MemberSort } from '@/lib/db/admin-queries'

import { MembersView } from './members-view'

/**
 * Everyone registered on plugpk, one page at a time.
 *
 * Search, filter, sort and page are URL parameters read here, so the database
 * returns twenty-five rows rather than the browser receiving every account's
 * email address to filter through.
 */

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const filter = pick<MemberFilter>(params.filter, ['all', 'admins', 'business'], 'all')
  const sort = pick<MemberSort>(params.sort, ['recent', 'oldest', 'name'], 'recent')
  const page = toPage(params.page)

  const listing = await listMembersPage({ q, filter, sort, page })

  return <MembersView listing={listing} params={params} q={q} filter={filter} sort={sort} page={page} />
}
