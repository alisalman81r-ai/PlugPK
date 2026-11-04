// src/app/admin/(protected)/community/page.tsx
import { flattenParams, pick } from '@/components/admin/list-params'
import { listCommunityPage, toPage, toQuery } from '@/lib/db/admin-queries'

import { CommunityView } from './community-view'

/**
 * Moderating the community: posts, and the comments under them.
 *
 * deleteComment existed and nothing called it, so a bad comment could only be
 * removed by deleting the whole thread it sat in. Each post's comments now
 * open beneath it with their own delete.
 */

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const filter = pick(params.filter, ['all', 'unreviewed'] as const, 'all')
  const page = toPage(params.page)

  const listing = await listCommunityPage({ q, filter, page })

  return <CommunityView listing={listing} params={params} filter={filter} page={page} />
}
