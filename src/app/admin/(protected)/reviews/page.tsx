// src/app/admin/(protected)/reviews/page.tsx
import { flattenParams } from '@/components/admin/list-params'
import { listReviewsPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { prisma } from '@/lib/db/client'

import { ReviewsView, type ReviewSummary } from './reviews-view'

/**
 * Every driver review, newest first, with a way to take one down.
 *
 * Ratings are derived from these rows by the public pages, so deleting a
 * review here is the whole change — nothing is left to recompute.
 *
 * The summary at the top (average, the spread of stars, each listing's
 * average) is read across every review, not the filtered page: it is the
 * design's "ratings at a glance", from three grouped counts.
 */

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const listingFilter = /^(station|business):[\w-]{1,100}$/.test(params.listing ?? '') ? params.listing! : ''
  const page = toPage(params.page)

  const [listing, stars, byStation, byBusiness] = await Promise.all([
    listReviewsPage({ q, listing: listingFilter, page }),
    prisma.review.groupBy({ by: ['rating'], _count: { _all: true } }),
    prisma.review.groupBy({ by: ['stationId'], where: { stationId: { not: null } }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ['businessId'], where: { businessId: { not: null } }, _avg: { rating: true }, _count: { _all: true } }),
  ])

  const byStars = [1, 2, 3, 4, 5].map((star) => stars.find((row) => row.rating === star)?._count._all ?? 0)
  const total = stars.reduce((n, row) => n + row._count._all, 0)
  const sumRatings = stars.reduce((n, row) => n + row.rating * row._count._all, 0)
  const label = new Map(listing.listings.map((option) => [option.value, option.label.replace(/ \((station|business)\)$/, '')]))
  const summary: ReviewSummary = {
    total,
    average: total ? sumRatings / total : 0,
    byStars,
    byListing: [
      ...byStation.map((row) => ({ value: `station:${row.stationId}`, average: row._avg.rating ?? 0, count: row._count._all })),
      ...byBusiness.map((row) => ({ value: `business:${row.businessId}`, average: row._avg.rating ?? 0, count: row._count._all })),
    ]
      .map((row) => ({ ...row, label: label.get(row.value) ?? 'Unknown listing' }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }

  return <ReviewsView listing={listing} summary={summary} params={params} q={q} listingFilter={listingFilter} page={page} />
}
