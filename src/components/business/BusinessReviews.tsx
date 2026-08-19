// src/components/business/BusinessReviews.tsx
'use client'

import { MessageSquare, Star } from 'lucide-react'
import * as React from 'react'

import { Avatar, RatingStars } from '@/components/ui'
import type { BusinessReviewRow } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

/**
 * Reviews left on the owner's listing.
 *
 * This page used to render MOCK_BUSINESS_REVIEWS against a 4.8 average and a
 * count of twelve — for a listing nobody could review, because businesses had
 * no reviews table and no public page to leave one on. Both now exist, so this
 * shows what was actually written, and an honest empty state when nothing has
 * been.
 */

export interface BusinessReviewsProps {
  reviews: BusinessReviewRow[]
  isLive: boolean
  listingHref: string | null
}

export function BusinessReviews({ reviews, isLive, listingHref }: BusinessReviewsProps) {
  const total = reviews.length
  const average =
    total === 0 ? 0 : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10

  // Five buckets, highest first, so the shape of the feedback is visible at a
  // glance rather than needing the whole list read.
  const spread = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => review.rating === score).length,
  }))

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <MessageSquare size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <p className="text-ui-lg font-semibold text-slate-900">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
          {isLive
            ? 'Nobody has reviewed this listing. Reviews appear here as drivers leave them.'
            : 'Your listing is not live yet, so drivers cannot review it. Reviews appear here once it is approved and someone visits.'}
        </p>
        {isLive && listingHref ? (
          <a
            href={listingHref}
            className="mt-6 inline-flex h-11 items-center rounded-xl border border-slate-200 px-6 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            View your public listing
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-4xl font-black text-slate-900">{average.toFixed(1)}</p>
            <div className="mt-1.5">
              <RatingStars rating={average} size="sm" />
            </div>
            <p className="mt-1 text-ui-sm text-slate-500">
              {total} review{total === 1 ? '' : 's'}
            </p>
          </div>

          <ul className="min-w-[220px] flex-1">
            {spread.map((bucket) => (
              <li key={bucket.score} className="flex items-center gap-3 py-0.5">
                <span className="inline-flex w-8 items-center gap-0.5 text-ui-sm text-slate-500">
                  {bucket.score}
                  <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${total === 0 ? 0 : (bucket.count / total) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right text-ui-sm tabular-nums text-slate-500">
                  {bucket.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={review.userName} src={review.userAvatar} size={32} />
                <p className="truncate font-semibold text-slate-900">{review.userName}</p>
              </span>
              <span className="text-ui-xs text-slate-400">{formatRelativeTime(review.date)}</span>
            </div>
            <div className="mt-1.5">
              <RatingStars rating={review.rating} size="sm" />
            </div>
            <p className="mt-3 whitespace-pre-line text-ui-sm leading-relaxed text-slate-700">
              {review.comment}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
