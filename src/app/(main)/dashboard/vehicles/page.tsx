// src/app/(main)/dashboard/vehicles/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VehicleManager } from '@/components/dashboard/VehicleManager'
import { getGarage, getGarageCatalogue } from '@/lib/db/garage'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/vehicles')

  // Everything at once: one round trip's wait, not three in a row.
  const catalogue = getGarageCatalogue()
  const [shellData, cars, garage] = await Promise.all([
    getDashboardShell(profile),
    catalogue,
    getGarage(profile.id, profile.vehicle, catalogue),
  ])

  return (
    <DashboardLayout
      title="My Vehicles"
      subtitle="What you drive"
      user={shellData.user}
      stats={shellData.stats}
    >
      <VehicleManager garage={garage} cars={cars} />
    </DashboardLayout>
  )
}
