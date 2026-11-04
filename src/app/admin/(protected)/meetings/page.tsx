// src/app/admin/(protected)/meetings/page.tsx
import { flattenParams, pick } from '@/components/admin/list-params'
import { listMeetingsPage, toPage, toQuery } from '@/lib/db/admin-queries'

import { MeetingsView } from './meetings-view'

export const dynamic = 'force-dynamic'

export default async function AdminMeetingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick(params.status, ['all', 'new', 'handled'] as const, 'all')
  const page = toPage(params.page)

  const listing = await listMeetingsPage({ q, status, page })

  return <MeetingsView listing={listing} params={params} status={status} page={page} />
}
