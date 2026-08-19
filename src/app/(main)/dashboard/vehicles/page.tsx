// src/app/(main)/dashboard/vehicles/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VehicleManager } from '@/components/dashboard/VehicleManager'
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

  const shell = await getDashboardShell(profile)

  return (
    <DashboardLayout
      title="My Vehicle"
      subtitle="What you drive"
      user={shell.user}
      stats={shell.stats}
    >
      <VehicleManager vehicle={profile.vehicle} />
    </DashboardLayout>
  )
}
