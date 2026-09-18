// src/app/admin/(protected)/stations/page.tsx
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { NetworkSummary } from '@/components/admin/NetworkSummary'
import { StationTable } from '@/components/admin/StationTable'
import { deleteStation } from '@/lib/db/actions'
import { getNetworkHealth } from '@/lib/db/network-health'
import { getStations } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function AdminStationsPage() {
  /*
    Both reads hit the same tables the public site reads. getStations() is the
    query /station/[slug] and the charger finder already use, and
    getNetworkHealth() is what the dashboard's Live Network panel reads — so
    this page is a third view of one network rather than a fourth copy of it.
  */
  const [stations, health] = await Promise.all([getStations(), getNetworkHealth()])

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
              <b>Every charging location on your public map.</b> Adding a row here puts
              it in front of drivers immediately, and deleting one removes it. Status
              controls whether people are told they can charge there; venue records what
              kind of place it sits at.
            </>
          }
        description={`${stations.length} published on the live site.`}
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

      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        {/* Same figures as the dashboard, from the same query. Counting them
            again here is how two screens come to report different totals for
            one network. */}
        <NetworkSummary health={health} />
        <StationTable stations={stations} onDelete={removeStation} />
      </div>
    </>
  )
}
