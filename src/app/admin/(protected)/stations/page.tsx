// src/app/admin/(protected)/stations/page.tsx
import { Plus } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { NetworkSummary } from '@/components/admin/NetworkSummary'
import { StationTable } from '@/components/admin/StationTable'
import { STATUS_FILTERS, VENUE_FILTERS, type StatusFilter, type VenueFilter } from '@/components/admin/station-filters'
import { flattenParams, pick } from '@/components/admin/list-params'
import { deleteStation } from '@/lib/db/actions'
import { listStationsPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { getNetworkHealth } from '@/lib/db/network-health'

export const dynamic = 'force-dynamic'

const VENUES = [...VENUE_FILTERS.map((option) => option.value), 'other'] as VenueFilter[]

export default async function AdminStationsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick<StatusFilter>(params.status, STATUS_FILTERS.map((option) => option.value), 'all')
  const venue = pick<VenueFilter>(params.venue, VENUES, 'all')
  const page = toPage(params.page)

  /*
    The listing is one filtered page from the database; the summary is
    getNetworkHealth(), what the dashboard's Live Network panel reads — so this
    page is a third view of one network rather than a fourth copy of it.
  */
  const [listing, health] = await Promise.all([
    listStationsPage({ q, status, venue, page }),
    getNetworkHealth(),
  ])

  /**
   * Bound here rather than inside the table: the table is a Client Component
   * and cannot import the server action module directly, but it can be handed
   * a reference to one.
   */
  async function removeStation(id: string) {
    'use server'
    return deleteStation(id)
  }

  return (
    <>
      <AdminHeader
        title="Stations"
        help={
          <>
            <b>Every charging location on your public map.</b> Saving a row here makes it
            appear on the map and in the route planner, and deleting one removes it.
            Status controls whether people are told they can charge there; venue records
            what kind of place it sits at.
          </>
        }
        description={`${listing.counts.all} published on the live site.`}
        action={
          <Link
            href="/admin/stations/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Add station
          </Link>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        {/* Same figures as the dashboard, from the same query. Counting them
            again here is how two screens come to report different totals for
            one network. */}
        <NetworkSummary health={health} />
        <div>
          <StationTable
            stations={listing.rows}
            total={listing.total}
            counts={listing.counts}
            status={status}
            venue={venue}
            onDelete={removeStation}
          />
          <AdminPagination
            path="/admin/stations"
            params={params}
            page={page}
            pageSize={listing.pageSize}
            total={listing.total}
            noun={['station', 'stations']}
          />
        </div>
      </div>
    </>
  )
}
