// src/components/station/RatingBreakdown.tsx
import { Star } from 'lucide-react'

import { RatingStars } from '@/components/ui'
import type { Review } from '@/lib/types'
import { formatRating } from '@/lib/utils'

export interface RatingBreakdownProps {
  rating: number
  reviewCount: number
  reviews: Review[]
}

export function RatingBreakdown({ rating, reviewCount, reviews }: RatingBreakdownProps) {
  // Distribution is derived from the reviews actually loaded, so the bars
  // describe the sample on screen rather than the full reviewCount.
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => Math.round(review.rating) === stars).length,
  }))

  const total = reviews.length

  return (
    <div className="flex flex-col items-start gap-8 sm:flex-row">
      <div className="mx-auto text-center sm:mx-0">
        <p className="text-7xl font-black leading-none tracking-[-0.04em] text-slate-900">
          {formatRating(rating)}
        </p>
        <div className="mb-1 mt-2 flex justify-center">
          <RatingStars rating={rating} size="lg" />
        </div>
        <p className="whitespace-nowrap text-sm text-slate-500">
          {reviewCount.toLocaleString('en-PK')} reviews
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col gap-2">
        {counts.map(({ stars, count }) => {
          const percent = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="flex w-8 shrink-0 items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="text-sm text-slate-600">{stars}</span>
              </span>

              <span
                role="img"
                aria-label={`${stars} star: ${count} of ${total} reviews`}
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
              >
                {/* Width is data-driven so it cannot be a static Tailwind class;
                    `origin-left animate-grow-x` animates it in without JS. */}
                <span
                  className="block h-full origin-left animate-grow-x rounded-full bg-amber-400"
                  style={{ width: `${percent}%` }}
                />
              </span>

              <span className="w-8 shrink-0 text-right text-sm text-slate-500">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
