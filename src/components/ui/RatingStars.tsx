// src/components/ui/RatingStars.tsx
'use client'

import { Star } from 'lucide-react'
import * as React from 'react'

import { cn, formatRating } from '@/lib/utils'

type StarSize = 'sm' | 'md' | 'lg'

const STAR_PX: Record<StarSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
}

const LABEL_CLASS: Record<StarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const FILLED = 'fill-amber-400 text-amber-400'
const EMPTY = 'text-slate-200'

export interface RatingStarsProps {
  rating: number
  reviewCount?: number
  size?: StarSize
  showNumber?: boolean
  showCount?: boolean
  interactive?: boolean
  onRate?: (rating: number) => void
  className?: string
}

export function RatingStars({
  rating,
  reviewCount,
  size = 'md',
  showNumber = false,
  showCount = false,
  interactive = false,
  onRate,
  className,
}: RatingStarsProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const px = STAR_PX[size]
  const clamped = Math.min(Math.max(rating, 0), 5)

  if (interactive) {
    const active = hovered ?? Math.round(clamped)

    return (
      <div className={cn('inline-flex flex-col gap-1.5', className)}>
        <span className={cn('font-medium text-slate-700', LABEL_CLASS[size])}>
          Rate this station
        </span>
        <div className="inline-flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRate?.(value)}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(null)}
              aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
              className="cursor-pointer rounded transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <Star size={px} className={value <= active ? FILLED : EMPTY} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Rounded to the nearest half so a partial star can be clipped with a static
  // `w-1/2` utility — an arbitrary percentage would require an inline style.
  const halfRounded = Math.round(clamped * 2) / 2
  const fullStars = Math.floor(halfRounded)
  const hasHalfStar = halfRounded % 1 !== 0

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${formatRating(clamped)} out of 5 stars`}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          if (index < fullStars) {
            return <Star key={index} size={px} className={cn('shrink-0', FILLED)} aria-hidden="true" />
          }

          if (index === fullStars && hasHalfStar) {
            return (
              <span key={index} className="relative inline-flex shrink-0">
                <Star size={px} className={EMPTY} aria-hidden="true" />
                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  <Star size={px} className={FILLED} aria-hidden="true" />
                </span>
              </span>
            )
          }

          return <Star key={index} size={px} className={cn('shrink-0', EMPTY)} aria-hidden="true" />
        })}
      </span>

      {showNumber ? (
        <span className={cn('font-semibold text-slate-900', LABEL_CLASS[size])}>
          {formatRating(clamped)}
        </span>
      ) : null}

      {showCount && reviewCount !== undefined ? (
        <span className={cn('text-slate-400', LABEL_CLASS[size])}>
          ({reviewCount.toLocaleString('en-PK')} review{reviewCount === 1 ? '' : 's'})
        </span>
      ) : null}
    </div>
  )
}
