// src/app/(main)/dashboard/reviews/page.tsx
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MyReviews } from '@/components/dashboard/MyReviews'
import { getDashboardShell, getReviewsByUser } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/reviews')

  const shell = await getDashboardShell(profile)

  const reviews = await getReviewsByUser(profile.id)

  return (
    <DashboardLayout
      title="My Reviews"
      subtitle={`${reviews.length} review${reviews.length === 1 ? '' : 's'} written`}
      user={shell.user}
      stats={shell.stats}
    >
      <MyReviews reviews={reviews} />
    </DashboardLayout>
  )
}
