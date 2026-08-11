// src/components/business/BusinessReviews.tsx
'use client'

import { Building2, Car, Star, ThumbsUp } from 'lucide-react'
import * as React from 'react'

import { RatingBreakdown } from '@/components/station/RatingBreakdown'
import { Button, RatingStars } from '@/components/ui'
import type { Review } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

export interface BusinessReviewsProps {
  reviews: Review[]
  avgRating: number
  totalReviews: number
}

type FilterKey = 'all' | 'positive' | 'negative' | 'unanswered'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'positive', label: 'Positive (4-5★)' },
  { key: 'negative', label: 'Negative (1-3★)' },
  { key: 'unanswered', label: 'Unanswered' },
]

export function BusinessReviews({ reviews, avgRating, totalReviews }: BusinessReviewsProps) {
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null)
  const [replyText, setReplyText] = React.useState('')
  const [replies, setReplies] = React.useState<Record<string, string>>({})
  const [filter, setFilter] = React.useState<FilterKey>('all')

  const visible = React.useMemo(() => {
    switch (filter) {
      case 'positive':
        return reviews.filter((review) => review.rating >= 4)
      case 'negative':
        return reviews.filter((review) => review.rating <= 3)
      case 'unanswered':
        return reviews.filter((review) => !replies[review.id])
      case 'all':
      default:
        return reviews
    }
  }, [reviews, filter, replies])

  const postReply = (reviewId: string) => {
    if (replyText.trim().length === 0) return
    setReplies((current) => ({ ...current, [reviewId]: replyText.trim() }))
    setReplyText('')
    setReplyingTo(null)
  }

  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center">
        <Star size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No reviews yet</p>
        <p className="text-slate-500">
          Reviews from EV owners who visit your station will appear here
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <RatingBreakdown rating={avgRating} reviewCount={totalReviews} reviews={reviews} />
      </div>

      <div className="scrollbar-hide mb-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            aria-pressed={filter === option.key}
            className={cn(
              'h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all duration-150',
              filter === option.key
                ? 'bg-plug-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">
          No reviews match this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((review) => {
            const reply = replies[review.id]

            return (
              <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{review.userName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <Car size={12} aria-hidden="true" />
                      {review.userVehicle}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <RatingStars rating={review.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(review.date)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-700">{review.comment}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-plug-blue-600"
                  >
                    <ThumbsUp size={14} aria-hidden="true" />
                    Mark as helpful ({review.helpfulCount})
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-400 transition-colors hover:text-red-500"
                  >
                    Report review
                  </button>
                </div>

                {reply ? (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-plug-blue-700">
                      <Building2 size={12} aria-hidden="true" />
                      Mall Road Premium Hotel
                    </p>
                    <p className="text-sm text-slate-700">{reply}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyText(reply)
                        setReplyingTo(review.id)
                      }}
                      className="mt-2 text-xs font-medium text-plug-blue-600 hover:underline"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : null}

                {replyingTo === review.id ? (
                  <div className="mt-4">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Write a reply to this review..."
                      aria-label="Reply to review"
                      className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:bg-white"
                    />
                    <div className="mt-3 flex justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => postReply(review.id)}>
                        Post Reply
                      </Button>
                    </div>
                  </div>
                ) : !reply ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    Reply to this review
                  </Button>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
