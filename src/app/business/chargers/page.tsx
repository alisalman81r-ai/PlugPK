// src/app/business/chargers/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ChargerManager } from '@/components/business/ChargerManager'
import { getBusinessesForUser } from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/db/session-actions'

/**
 * The chargers on the owner's listing — the real ones, read from the row that
 * the map also reads.
 */

export const dynamic = 'force-dynamic'

export default async function BusinessChargersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/business/chargers')

  const businesses = await getBusinessesForUser(user.id)
  const primary = businesses[0]

  return (
    <BusinessDashboardLayout
      title="Chargers"
      subtitle="What is installed at your location"
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
        <ChargerManager
          businessId={primary.id}
          chargers={primary.chargers}
          isLive={primary.status === 'approved'}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-ui-lg font-semibold text-slate-900">No listing yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            Chargers belong to a listing. Submit one first.
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
