// src/app/business/services/profile/page.tsx
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ServiceProfileEditor } from '@/components/business/services/ServiceProfileEditor'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import { requireServicePortal } from '@/lib/db/service-owner-queries'
import type { ServiceCategory } from '@/lib/types'

/**
 * Editing a service listing — the services side's Profile page. Gated on the
 * server like the rest of the portal, and only ever the account's own listing.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Service profile' }

export default async function ServiceProfilePage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireServicePortal('/business/services/profile', searchParams.listing)
  const { service, services } = portal

  return (
    <BusinessDashboardLayout
      title="Service profile"
      subtitle="What drivers see on your listing"
      mode="services"
      canSwitch={portal.hasChargers}
      listing={{
        id: service.id,
        name: service.name,
        type: SERVICE_CATEGORY_META[service.category as ServiceCategory]?.label ?? service.category,
        city: service.city,
        status: service.status,
      }}
      listings={services.map((item) => ({ id: item.id, name: item.name, status: item.status }))}
      publicHref={service.status === 'approved' ? `/services/${service.category}/${service.slug}` : undefined}
    >
      <ServiceProfileEditor key={service.id} service={service} />
    </BusinessDashboardLayout>
  )
}
