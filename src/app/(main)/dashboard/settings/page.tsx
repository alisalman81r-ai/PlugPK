// src/app/(main)/dashboard/settings/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AccountSettings } from '@/components/dashboard/AccountSettings'
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
  if (!profile) redirect('/login?redirect=/dashboard/settings')

  const shell = await getDashboardShell(profile)

  return (
    <DashboardLayout
      title="Account Settings"
      subtitle="Your details and password"
      user={shell.user}
      stats={shell.stats}
    >
      <AccountSettings
        user={{
          name: profile.name,
          email: profile.email,
          city: profile.city,
          vehicle: profile.vehicle,
          avatar: profile.avatar,
        }}
      />
    </DashboardLayout>
  )
}
