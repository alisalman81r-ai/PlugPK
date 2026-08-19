// src/app/(main)/dashboard/routes/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Route } from 'lucide-react'
import Link from 'next/link'

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
  if (!profile) redirect('/login?redirect=/dashboard/routes')

  const shell = await getDashboardShell(profile)

  return (
    <DashboardLayout
      title="Saved Routes"
      subtitle="Journeys you have kept"
      user={shell.user}
      stats={shell.stats}
    >
      {/*
        Honest empty state rather than a list.

        Nothing stores a planned route: the route planner works out stops in the
        browser and the "save route" control never wrote anywhere. This page
        previously filled the gap with a fixture's routes, which is worse than
        showing none — it implied a feature that does not exist. When routes are
        stored, this becomes a list.
      */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Route size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <p className="text-ui-lg font-semibold text-slate-900">No saved routes</p>
        <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
          Routes are planned in the browser and are not stored to your account yet, so there is
          nothing to list here.
        </p>
        <Link
          href="/routes"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
        >
          Plan a route
        </Link>
      </div>
    </DashboardLayout>
  )
}
