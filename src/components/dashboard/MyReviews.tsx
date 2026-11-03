// src/components/dashboard/MyReviews.tsx
'use client'

import { Star, Trash2 } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import type { MyReviewRow } from '@/lib/db/queries'
import { deleteMyReview } from '@/lib/db/review-actions'
import { formatRelativeTime } from '@/lib/utils'

import { EmptyPanel, PANEL } from './dash-ui'

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
      <EmptyPanel
        icon={<Star aria-hidden="true" />}
        title="No reviews yet"
        body="Reviews you write on a station or a business listing appear here."
        href="/map"
        cta="Find a station"
      />
    )
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">{error}</p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className={PANEL}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {review.listingId ? (
                  <Link
                    href={`/station/${review.listingId}`}
                    className="font-display text-[22px] leading-tight text-ink hover:underline hover:decoration-volt hover:decoration-2 hover:underline-offset-4"
                  >
                    {review.listingName}
                  </Link>
                ) : (
                  <p className="font-display text-[22px] leading-tight text-ink">{review.listingName}</p>
                )}
                <div className="mt-1.5">
                  <RatingStars rating={review.rating} size="sm" />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs text-muted">{formatRelativeTime(review.date)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  disabled={deleting === review.id}
                  aria-busy={deleting === review.id || undefined}
                  aria-label={`Delete your review of ${review.listingName}`}
                  className="grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white text-muted transition-colors hover:border-[#FFCDBC] hover:bg-[#FFECE6] hover:text-[#B42E05] disabled:opacity-60"
                >
                  {deleting === review.id ? (
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">
              {review.comment}
            </p>

            {review.helpfulCount > 0 ? (
              <p className="mt-3 font-mono text-xs text-muted">
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
