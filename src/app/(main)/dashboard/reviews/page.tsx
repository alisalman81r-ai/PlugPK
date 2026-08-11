// src/app/(main)/dashboard/reviews/page.tsx
'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MyReviews } from '@/components/dashboard/MyReviews'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardReviewsPage() {
  const { userReviews, deleteReview } = useDashboard()

  return (
    <DashboardLayout
      title="My Reviews"
      subtitle={`${userReviews.length} review${userReviews.length === 1 ? '' : 's'} written`}
    >
      <MyReviews reviews={userReviews} onDelete={deleteReview} />
    </DashboardLayout>
  )
}
