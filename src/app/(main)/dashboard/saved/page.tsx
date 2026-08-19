// src/app/(main)/dashboard/saved/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedStations } from '@/components/dashboard/SavedStations'
import { getDashboardShell, getSavedStationsForUser } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/saved')

  const shell = await getDashboardShell(profile)

  const saved = await getSavedStationsForUser(profile.id)

  return (
    <DashboardLayout
      title="Saved Stations"
      subtitle={`${saved.length} station${saved.length === 1 ? '' : 's'} saved`}
      user={shell.user}
      stats={shell.stats}
    >
      <SavedStations stations={saved} />
    </DashboardLayout>
  )
}
