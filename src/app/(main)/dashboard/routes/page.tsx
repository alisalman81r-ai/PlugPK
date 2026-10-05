// src/app/(main)/dashboard/routes/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedRoutesList } from '@/components/dashboard/SavedRoutesList'
import { prisma } from '@/lib/db/client'

import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Saved Routes' }

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/routes')

  const [shell, rows] = await Promise.all([
    getDashboardShell(profile),
    prisma.savedRoute.findMany({ where: { userId: profile.id }, orderBy: { createdAt: 'desc' } }),
  ])
  const routes = rows.map(({ userId: _owner, createdAt, ...row }) => ({ ...row, createdAt: createdAt.toISOString() }))

  return (
    <DashboardLayout
      title="Saved Routes"
      subtitle="Journeys you have kept"
      user={shell.user}
      stats={shell.stats}
    >
      <SavedRoutesList routes={routes} />
    </DashboardLayout>
  )
}
