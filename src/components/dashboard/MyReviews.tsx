// src/components/dashboard/MyReviews.tsx
'use client'

import { Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import type { MyReviewRow } from '@/lib/db/queries'
import { deleteMyReview } from '@/lib/db/review-actions'
import { formatRelativeTime } from '@/lib/utils'

/**
 * Reviews this account has written.
 *
 * The list was MOCK_USER_REVIEWS, and the station each one belonged to was
 * picked by array position — `MOCK_STATIONS[index % length]` — so the headings
 * were not merely someone else's, they were attached to whichever station
 * happened to sit at that index. Each row now carries the listing it was
 * actually written about.
 */

export interface MyReviewsProps {
  reviews: MyReviewRow[]
}

export function MyReviews({ reviews }: MyReviewsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setError(null)

    const result = await deleteMyReview(id)
    setDeleting(null)

    if (!result.ok) {
      setError(result.message ?? 'Could not delete that review.')
      return
    }
    router.refresh()
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Star size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <p className="text-ui-lg font-semibold text-slate-900">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
          Reviews you write on a station or a business listing appear here.
        </p>
        <Link
          href="/map"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
        >
          Find a station
        </Link>
      </div>
    )
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {review.listingId ? (
                  <Link
                    href={`/station/${review.listingId}`}
                    className="font-semibold text-slate-900 hover:text-plug-blue-600 hover:underline"
                  >
                    {review.listingName}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-900">{review.listingName}</p>
                )}
                <div className="mt-1.5">
                  <RatingStars rating={review.rating} size="sm" />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-ui-xs text-slate-400">{formatRelativeTime(review.date)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  disabled={deleting === review.id}
                  aria-label={`Delete your review of ${review.listingName}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-line text-ui-sm leading-relaxed text-slate-700">
              {review.comment}
            </p>

            {review.helpfulCount > 0 ? (
              <p className="mt-3 text-ui-xs text-slate-400">
                {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this
                helpful
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
