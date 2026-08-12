// src/components/station/ReviewsSection.tsx
'use client'

import { Car, MessageSquare, ShieldCheck, ThumbsUp } from 'lucide-react'
import * as React from 'react'

import { Button, RatingStars } from '@/components/ui'
import type { Review } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RatingBreakdown } from './RatingBreakdown'
import { WriteReviewForm } from './WriteReviewForm'

export interface ReviewsSectionProps {
  reviews: Review[]
  rating: number
  reviewCount: number
  stationId: string
  stationName: string
}

type SortKey = 'recent' | 'helpful' | 'highest' | 'lowest'

const AVATAR_TONES = [
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-purple-500 to-blue-500',
  'bg-gradient-to-br from-emerald-500 to-cyan-500',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-rose-500 to-purple-500',
]

function toneForName(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_TONES.length
  return AVATAR_TONES[index] ?? AVATAR_TONES[0]!
}

function ReviewCard({ review, isLast }: { review: Review; isLast: boolean }) {
  const [isHelpful, setIsHelpful] = React.useState(false)

  return (
    <div className={cn(!isLast && 'border-b border-slate-100 pb-6')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white',
              toneForName(review.userName),
            )}
          >
            {review.userName.charAt(0)}
          </span>

          <span>
            <span className="block text-ui font-bold text-slate-900">{review.userName}</span>
            <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
              <Car size={12} aria-hidden="true" />
              {review.userVehicle}
            </span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RatingStars rating={review.rating} size="sm" />
          <span className="text-xs text-slate-400">{formatRelativeTime(review.date)}</span>
        </div>
      </div>

      <p className="mt-4 text-ui leading-relaxed text-slate-700">{review.comment}</p>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsHelpful((current) => !current)}
          aria-pressed={isHelpful}
          className={cn(
            'flex items-center gap-2 text-sm transition-colors duration-150',
            isHelpful ? 'text-plug-blue-600' : 'text-slate-500 hover:text-plug-blue-600',
          )}
        >
          <ThumbsUp
            size={16}
            className={cn(isHelpful ? 'fill-blue-100 text-plug-blue-600' : 'text-slate-400')}
            aria-hidden="true"
          />
          Helpful ({review.helpfulCount + (isHelpful ? 1 : 0)})
        </button>

        {review.isVerified ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-plug-blue-600">
            <ShieldCheck size={14} aria-hidden="true" />
            Verified Visit
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function ReviewsSection({
  reviews,
  rating,
  reviewCount,
  stationId,
  stationName,
}: ReviewsSectionProps) {
  const [visibleCount, setVisibleCount] = React.useState(3)
  const [sortBy, setSortBy] = React.useState<SortKey>('recent')

  const sorted = React.useMemo(() => {
    const copy = [...reviews]
    switch (sortBy) {
      case 'helpful':
        return copy.sort((a, b) => b.helpfulCount - a.helpfulCount)
      case 'highest':
        return copy.sort((a, b) => b.rating - a.rating)
      case 'lowest':
        return copy.sort((a, b) => a.rating - b.rating)
      case 'recent':
      default:
        return copy.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    }
  }, [reviews, sortBy])

  const visible = sorted.slice(0, visibleCount)

  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Reviews &amp; Ratings</h2>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          aria-label="Sort reviews"
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest First</option>
          <option value="lowest">Lowest First</option>
        </select>
      </div>

      {reviews.length > 0 ? (
        <div className="mb-10 border-b border-slate-100 pb-10">
          <RatingBreakdown rating={rating} reviewCount={reviewCount} reviews={reviews} />
        </div>
      ) : null}

      <div className="mb-10 border-b border-slate-100 pb-10">
        <WriteReviewForm stationId={stationId} stationName={stationName} />
      </div>

      {reviews.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare size={48} className="mx-auto text-slate-200" aria-hidden="true" />
          <p className="mt-4 text-xl font-bold text-slate-900">No reviews yet</p>
          <p className="mt-2 text-slate-500">Be the first to share your experience</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {visible.map((review, index) => (
              <ReviewCard
                key={review.id}
                review={review}
                isLast={index === visible.length - 1}
              />
            ))}
          </div>

          {reviews.length > visibleCount ? (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              className="mt-8"
              onClick={() => setVisibleCount((count) => count + 3)}
            >
              Load more reviews
            </Button>
          ) : null}
        </>
      )}
    </section>
  )
}
