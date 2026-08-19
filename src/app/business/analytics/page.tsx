// src/app/business/analytics/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessAnalytics } from '@/components/business/BusinessAnalytics'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { getBusinessAnalytics, getBusinessesForUser } from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/db/session-actions'

export const dynamic = 'force-dynamic'

export default async function BusinessAnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/business/analytics')

  const businesses = await getBusinessesForUser(user.id)
  const primary = businesses[0]
  const analytics = primary ? await getBusinessAnalytics(primary.id) : null

  return (
    <BusinessDashboardLayout
      title="Analytics"
      subtitle="How your listing is doing"
      listing={
        primary
          ? {
              id: primary.id,
              name: primary.businessName,
              type: primary.businessType,
              city: primary.city,
              status: primary.status,
            }
          : undefined
      }
    >
      {primary && analytics ? (
        <BusinessAnalytics analytics={analytics} isLive={primary.status === 'approved'} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-ui-lg font-semibold text-slate-900">No listing yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            There is nothing to measure until you have a listing.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            List your business
          </Link>
        </div>
      )}
    </BusinessDashboardLayout>
  )
}
