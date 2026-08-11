// src/app/business/dashboard/page.tsx
'use client'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessOverview } from '@/components/business/BusinessOverview'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

export default function BusinessDashboardPage() {
  const biz = useBusinessDashboard()

  return (
    <BusinessDashboardLayout title="Overview" subtitle={biz.business.name}>
      <BusinessOverview
        business={biz.business}
        analytics={biz.analytics}
        totalViews={biz.totalViews}
        totalClicks={biz.totalClicks}
        conversionRate={biz.conversionRate}
        viewsGrowth={biz.viewsGrowth}
        clicksGrowth={biz.clicksGrowth}
      />
    </BusinessDashboardLayout>
  )
}
