// src/app/admin/(protected)/stations/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { StationTable } from '@/components/admin/StationTable'
import { STATUS_FILTERS, VENUE_FILTERS, type StatusFilter, type VenueFilter } from '@/components/admin/station-filters'
import { flattenParams, pick } from '@/components/admin/list-params'
import { AddLink, Strip, StripCell } from '@/components/admin/network-kit'
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
    The listing is one filtered page from the database; the strip is
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

  const { stations, connectors, ports } = health

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
        action={<AddLink href="/admin/stations/new">Add station</AddLink>}
      />

      {/* Same figures as the dashboard, from the same query. No utilisation,
          uptime or revenue: nothing records them. */}
      <Strip label="Network figures" cells={6}>
        <StripCell label="Stations" value={stations.total} count={stations.total} sub="on the live site" />
        <StripCell label="Online" dot="ok" value={stations.online} count={stations.online} sub="fully available" />
        <StripCell label="Limited" dot="blue" value={stations.limited} count={stations.limited} sub="partly usable" />
        <StripCell label="Offline" dot="bad" value={stations.offline} count={stations.offline} sub="nobody can charge" />
        <StripCell
          label="Connectors"
          value={connectors.total}
          count={connectors.total}
          sub={`${connectors.inUse} in use · ${connectors.offline} offline`}
        />
        <StripCell
          lit
          label="Ports free"
          value={`${ports.available} / ${ports.total}`}
          sub={ports.availablePct === null ? 'none recorded' : `${ports.availablePct.toFixed(1)}% available`}
        />
      </Strip>

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
    </>
  )
}
