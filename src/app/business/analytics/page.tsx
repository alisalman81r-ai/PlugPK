// src/app/business/analytics/page.tsx
'use client'

import { BusinessAnalytics } from '@/components/business/BusinessAnalytics'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

export default function BusinessAnalyticsPage() {
  const { analytics, business } = useBusinessDashboard()

  return (
    <BusinessDashboardLayout title="Analytics" subtitle="Track your listing performance">
      <BusinessAnalytics analytics={analytics} isPremium={business.isPremium} />
    </BusinessDashboardLayout>
  )
}
