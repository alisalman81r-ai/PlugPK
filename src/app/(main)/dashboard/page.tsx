// src/app/(main)/dashboard/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { getDashboardShell, getReviewsByUser, getSavedStationsForUser } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard')

  const shell = await getDashboardShell(profile)

  const [saved, reviews] = await Promise.all([
    getSavedStationsForUser(profile.id),
    getReviewsByUser(profile.id),
  ])

  return (
    <DashboardLayout
      title="Overview"
      subtitle={`Welcome back, ${profile.name}`}
      user={shell.user}
      stats={shell.stats}
    >
      <DashboardOverview
        user={{ ...shell.user, vehicle: profile.vehicle ?? undefined }}
        stats={shell.stats}
        savedStations={saved}
        reviews={reviews}
      />
    </DashboardLayout>
  )
}
