// src/components/station/ReviewsSection.tsx
'use client'

import { Car, MessageSquare, ThumbsUp } from '@/components/ui/icons'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import { btnClass } from '@/components/v2/ui'
import type { Review } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RatingBreakdown } from './RatingBreakdown'
import type { ReviewTarget } from '@/lib/db/review-actions'

import { WriteReviewForm } from './WriteReviewForm'

export interface ReviewsSectionProps {
  reviews: Review[]
  rating: number
  reviewCount: number
  stationId: string
  stationName: string
  /** The URL segment, so signing in to review comes back to this page. */
  stationSlug: string
  /**
   * True for the sample listings (see lib/sample-listings). Their reviews were
   * written with the sample data, not by drivers, and the section says so.
   */
  isExample?: boolean
  /** Which table this listing lives in; forwarded to the review form. */
  target?: ReviewTarget
}

type SortKey = 'recent' | 'helpful' | 'highest' | 'lowest'

/**
 * Ink tones, not hues — the same set the community feed uses.
 *
 * These were five saturated gradients running through purple, emerald, amber
 * and rose, none of which appear anywhere else in a product built on slate and
 * one blue. An avatar is an identity marker, so it keeps a fill; depth is what
 * separates one from the next now, rather than colour.
 */
const AVATAR_TONES = [
  'bg-plug-navy-800',
  'bg-plug-blue-800',
  'bg-slate-600',
  'bg-plug-cyan-800',
  'bg-plug-navy-900',
]

function toneForName(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_TONES.length
  return AVATAR_TONES[index] ?? AVATAR_TONES[0]!
}

function ReviewCard({ review, isLast }: { review: Review; isLast: boolean }) {
  const [isHelpful, setIsHelpful] = React.useState(false)

  return (
    <div className={cn(!isLast && 'border-b border-ink/10 pb-6')}>
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
            <span className="block font-semibold text-ink">{review.userName}</span>
            {/* Optional on the form, so often empty: no car icon over nothing. */}
            {review.userVehicle ? (
              <span className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <Car size={12} aria-hidden="true" />
                {review.userVehicle}
              </span>
            ) : null}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RatingStars rating={review.rating} size="sm" />
          <span className="font-mono text-[11px] text-muted">{formatRelativeTime(review.date)}</span>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-[1.7] text-ink/80">{review.comment}</p>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsHelpful((current) => !current)}
          aria-pressed={isHelpful}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm font-medium transition-colors duration-200',
            isHelpful ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-muted hover:border-ink/30 hover:text-ink',
          )}
        >
          <ThumbsUp
            size={16}
            className={cn(isHelpful ? 'fill-volt text-volt' : 'text-current')}
            aria-hidden="true"
          />
          Helpful ({review.helpfulCount + (isHelpful ? 1 : 0)})
        </button>

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
  stationSlug,
  isExample = false,
  target = 'station',
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">Reviews</p>
          <h2 className="font-display text-[clamp(26px,2.4vw,32px)] leading-[1.08] text-ink">Reviews and ratings</h2>
        </div>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          aria-label="Sort reviews"
          className="h-11 cursor-pointer rounded-full border-[1.5px] border-ink/10 bg-white pl-4 pr-3 text-sm font-medium text-ink outline-none transition-colors hover:border-ink/30 focus-visible:border-ink focus-visible:shadow-focus"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest First</option>
          <option value="lowest">Lowest First</option>
        </select>
      </div>

      {isExample && reviews.length > 0 ? (
        <p className="-mt-2 mb-8 rounded-[18px] border border-[#FFE0A3] bg-[#FFF6E3] px-4 py-3 text-sm text-[#8A5300]">
          This is an example listing. Its reviews are sample text, not visits by real drivers.
        </p>
      ) : null}

      {reviews.length > 0 ? (
        <div className="mb-8 rounded-[22px] border border-ink/10 bg-paper p-5 sm:p-6">
          <RatingBreakdown rating={rating} reviewCount={reviewCount} reviews={reviews} />
        </div>
      ) : null}

      <div className="mb-10 border-b border-ink/10 pb-10">
        <WriteReviewForm
          stationId={stationId}
          stationName={stationName}
          stationSlug={stationSlug}
          target={target}
        />
      </div>

      {reviews.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare size={40} className="mx-auto text-fog" aria-hidden="true" />
          <p className="mt-4 font-display text-2xl text-ink">No reviews yet</p>
          <p className="mt-2 text-muted">Be the first to share your experience</p>
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
            <button
              type="button"
              className={btnClass('ghost', 'md', 'mt-8 w-full')}
              onClick={() => setVisibleCount((count) => count + 3)}
            >
              Load more reviews
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
