// src/components/dashboard/MyReviews.tsx
'use client'

import { Car, Pencil, Star, ThumbsUp, Trash2 } from 'lucide-react'
import * as React from 'react'

import { Button, RatingStars } from '@/components/ui'
import { MOCK_STATIONS } from '@/lib/mock-data'
import type { Review } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

export interface MyReviewsProps {
  reviews: Review[]
  onDelete: (reviewId: string) => void
}

/** Reviews carry no station reference yet, so titles come from position. */
function stationNameFor(index: number): string {
  return MOCK_STATIONS[index % MOCK_STATIONS.length]?.name ?? 'Charging Station'
}

export function MyReviews({ reviews, onDelete }: MyReviewsProps) {
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)

  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center">
        <Star size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No reviews yet</p>
        <p className="text-slate-500">Share your experiences at charging stations</p>
        <div className="mt-6">
          <Button href="/map">Find Stations to Review</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        {reviews.map((review, index) => (
          <article
            key={review.id}
            className="mb-4 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">{stationNameFor(index)}</h3>
                <p className="mt-1 text-sm text-slate-400">{formatRelativeTime(review.date)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Button variant="ghost" size="sm" leftIcon={<Pencil size={16} />}>
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(review.id)}
                  aria-label="Delete review"
                  className="flex h-9 items-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>

            <div className="my-3">
              <RatingStars rating={review.rating} size="md" showNumber />
            </div>

            <p className="text-sm leading-relaxed text-slate-700">{review.comment}</p>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <Car size={14} aria-hidden="true" />
              {review.userVehicle}
            </p>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <ThumbsUp size={14} className="text-slate-400" aria-hidden="true" />
              {review.helpfulCount} people found this helpful
            </p>
          </article>
        ))}
      </div>

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-review-title"
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-modal"
          >
            <h2 id="delete-review-title" className="mb-2 text-xl font-bold text-slate-900">
              Delete this review?
            </h2>
            <p className="mb-8 text-slate-500">
              Your review will be removed from the station page permanently.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(confirmDelete)
                  setConfirmDelete(null)
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
