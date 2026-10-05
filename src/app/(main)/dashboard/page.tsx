// src/app/(main)/dashboard/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { getDashboardShell, getPostsByUser, getReviewsByUser, getSavedStationsForUser } from '@/lib/db/queries'
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

  const [shell, saved, reviews, posts] = await Promise.all([
    getDashboardShell(profile),
    getSavedStationsForUser(profile.id),
    getReviewsByUser(profile.id),
    getPostsByUser(profile.id),
  ])

  /*
    "Welcome back" on the first ever visit — straight from sign-up or
    onboarding — read as if the site had mistaken them for someone else. An
    account made in the last ten minutes, or one that has not saved, reviewed
    or posted anything yet and is under a day old, is greeted as new.
  */
  const ageMs = Date.now() - new Date(profile.createdAt).getTime()
  const hasActivity = saved.length > 0 || reviews.length > 0 || posts.length > 0
  const isNew = ageMs < 10 * 60 * 1000 || (!hasActivity && ageMs < 24 * 60 * 60 * 1000)

  return (
    <DashboardLayout
      title="Overview"
      subtitle={`${isNew ? 'Welcome' : 'Welcome back'}, ${profile.name}`}
      user={shell.user}
      stats={shell.stats}
    >
      <DashboardOverview
        user={{ ...shell.user, vehicle: profile.vehicle ?? undefined }}
        stats={shell.stats}
        savedStations={saved}
        reviews={reviews}
        posts={posts}
      />
    </DashboardLayout>
  )
}
