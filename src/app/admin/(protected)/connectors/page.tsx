// src/app/admin/(protected)/connectors/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { buildHref, flattenParams, pick } from '@/components/admin/list-params'
import { AddLink, Empty, SegLinks, Strip, StripCell, T, TOOLS, TOOLS_ROW, rise } from '@/components/admin/network-kit'
import { listConnectorsPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { getNetworkHealth } from '@/lib/db/network-health'
import { cn } from '@/lib/utils'

import { ConnectorRow } from './ConnectorRow'


export const dynamic = 'force-dynamic'

const PATH = '/admin/connectors'

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'in-use', label: 'In use' },
  { value: 'offline', label: 'Offline' },
] as const

export default async function AdminConnectorsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick(params.status, STATUSES.map((option) => option.value), 'all')
  const page = toPage(params.page)

  // The strip and the filter tallies read the same grouped counts the
  // dashboard does; the port totals come from the listing's own sums.
  const [listing, health] = await Promise.all([listConnectorsPage({ q, status, page }), getNetworkHealth()])
  const rows = listing.rows
  const { ports: totalPorts, free: freePorts, connectors: connectorCount } = listing.totals
  const byStatus: Record<string, number> = {
    all: connectorCount,
    available: health.connectors.available,
    'in-use': health.connectors.inUse,
    offline: health.connectors.offline,
  }
  const pct = totalPorts > 0 ? (freePorts / totalPorts) * 100 : null

  return (
    <>
      <AdminHeader
        title="Connectors"
        help={
          <>
            <b>The individual plugs on each station.</b> A station is a location; a
            connector is one physical socket with a type (CCS2, Type 2, CHAdeMO), a
            power rating and a port count. The free-ports figure drivers see is added
            up from these rows.
          </>
        }
        description={`${freePorts} of ${totalPorts} ports free across ${connectorCount} connectors.`}
        action={<AddLink href="/admin/connectors/new">Add connector</AddLink>}
      />

      <Strip label="Connector figures" cells={5}>
        <StripCell
          label="Connectors"
          value={connectorCount}
          count={connectorCount}
          sub={`across ${health.stations.total} station${health.stations.total === 1 ? '' : 's'}`}
        />
        <StripCell label="Available" dot="ok" value={byStatus.available} count={byStatus.available} sub="ready to charge" />
        <StripCell label="In use" dot="warn" value={byStatus['in-use']} count={byStatus['in-use']} sub="a car is plugged in" />
        <StripCell label="Offline" dot="bad" value={byStatus.offline} count={byStatus.offline} sub="nobody can charge" />
        <StripCell
          lit
          label="Ports free"
          value={`${freePorts} / ${totalPorts}`}
          sub={pct === null ? 'none recorded' : `${pct.toFixed(1)}% available`}
        />
      </Strip>

      <div {...rise(1)} className={TOOLS}>
        <div className={TOOLS_ROW}>
          <AdminSearch placeholder="Search station, city or connector type" label="Search connectors" />
          <SegLinks
            label="Filter by status"
            current={status}
            options={STATUSES.map((option) => ({
              value: option.value,
              label: option.label,
              count: byStatus[option.value],
              href: buildHref(PATH, params, { status: option.value }),
            }))}
          />
        </div>
      </div>

      <div {...rise(2)} className={T.wrap}>
        <table className={T.table}>
          <thead className={T.thead}>
            <tr>
              <th scope="col" className={T.th}>Station</th>
              <th scope="col" className={T.th}>Type</th>
              <th scope="col" className={T.th}>Power</th>
              <th scope="col" className={T.th}>Status</th>
              <th scope="col" className={T.th}>Ports free</th>
              <th scope="col" className={T.th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={T.tbody}>
            {rows.length === 0 ? (
              <tr className={T.tr}>
                <td colSpan={6} className={cn(T.td, T.full, 'max-[760px]:before:hidden')}>
                  <Empty
                    icon={connectorCount === 0 ? 'plug' : 'search'}
                    title={connectorCount === 0 ? 'No connectors yet.' : 'No connector matches.'}
                    text={connectorCount === 0 ? 'Add one to publish it to a station.' : 'Try another search, or clear the filter.'}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => <ConnectorRow key={row.connector.id} {...row} />)
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        path={PATH}
        params={params}
        page={page}
        pageSize={listing.pageSize}
        total={listing.total}
        noun={['connector', 'connectors']}
      />
    </>
  )
}
