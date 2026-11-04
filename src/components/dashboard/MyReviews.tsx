// src/components/dashboard/MyReviews.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import type { MyReviewRow } from '@/lib/db/queries'
import { deleteMyReview } from '@/lib/db/review-actions'
import { formatRelativeTime } from '@/lib/utils'

import { ISpin, IStar, ITrash } from './acct-icons'
import { abtn, EmptyPanel, ErrorNote, PANEL } from './dash-ui'

/**
 * Reviews this account has written. There is no design file for this page;
 * it speaks the account pages' language: an .aempty state, then one .apanel
 * per review with the listing, the stars, the words and a remove button.
 *
 * Each row carries the listing it was actually written about (the old list
 * picked a station by array position).
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
    const result = await deleteMyReview(id).catch(() => ({ ok: false, message: 'We could not reach the server. Try again.' }))
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
        icon={<IStar />}
        title="No reviews yet."
        body="Reviews you write on a station or a business listing appear here."
        href="/map"
        cta="Find a station"
      />
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {reviews.map((review) => (
        <article key={review.id} className={PANEL}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {review.listingId ? (
                <Link
                  href={`/station/${review.listingId}`}
                  className="font-display text-[26px] leading-[1.1] text-ink decoration-volt decoration-2 underline-offset-4 hover:underline"
                >
                  {review.listingName}
                </Link>
              ) : (
                <h2 className="m-0 font-display text-[26px] font-normal leading-[1.1] text-ink">{review.listingName}</h2>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <RatingStars rating={review.rating} size="sm" />
                <span className="font-mono text-xs text-muted" suppressHydrationWarning>
                  {formatRelativeTime(review.date)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleDelete(review.id)}
              disabled={deleting === review.id}
              aria-busy={deleting === review.id || undefined}
              aria-label={`Delete your review of ${review.listingName}`}
              className={abtn('plain', 'sm')}
            >
              {deleting === review.id ? <ISpin /> : <ITrash />}
              <span>Remove</span>
            </button>
          </div>

          <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.6] text-ink/80">{review.comment}</p>

          {review.helpfulCount > 0 ? (
            <p className="mt-3 font-mono text-xs text-muted">
              {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
