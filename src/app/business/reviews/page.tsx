// src/app/business/reviews/page.tsx
'use client'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessReviews } from '@/components/business/BusinessReviews'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

export default function BusinessReviewsPage() {
  const { businessReviews, business } = useBusinessDashboard()

  return (
    <BusinessDashboardLayout title="Reviews" subtitle="Manage customer feedback">
      <BusinessReviews
        reviews={businessReviews}
        avgRating={business.rating}
        totalReviews={business.reviewCount}
      />
    </BusinessDashboardLayout>
  )
}
