// src/app/admin/(protected)/stations/page.tsx
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { StationTable } from '@/components/admin/StationTable'
import { deleteStation } from '@/lib/db/actions'
import { getStations } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function AdminStationsPage() {
  const stations = await getStations()

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

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <StationTable stations={stations} onDelete={removeStation} />
      </div>
    </>
  )
}
