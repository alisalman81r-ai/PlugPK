// src/app/business/profile/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessProfileEditor } from '@/components/business/BusinessProfileEditor'
import { getBusinessesForUser } from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/db/session-actions'

/**
 * Editing the owner's real listing.
 *
 * Gated on the server like the rest of the portal, and reading the row that
 * belongs to the signed-in account rather than a fixture.
 */

export const dynamic = 'force-dynamic'

export default async function BusinessProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/business/profile')

  const businesses = await getBusinessesForUser(user.id)
  const primary = businesses[0]

  return (
    <BusinessDashboardLayout
      title="Business profile"
      subtitle="What drivers see on your listing"
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
      {primary ? (
        <BusinessProfileEditor business={primary} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-ui-lg font-semibold text-slate-900">Nothing to edit yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            This account has no listing. Submit one and it will appear here.
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
