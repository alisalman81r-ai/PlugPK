// src/components/business/BusinessReviews.tsx
'use client'

import * as React from 'react'

import { btnClass, CARD, Empty, EmptyCard, Ico } from '@/components/admin/network-kit'
import { Avatar } from '@/components/ui'
import type { BusinessReviewRow } from '@/lib/db/queries'
import { cn, formatRelativeTime } from '@/lib/utils'

import { LIFT, StarIco, Stars, useBizEntrance } from './host/biz-kit'

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

const DAY = 24 * 60 * 60 * 1000

export function BusinessReviews({ reviews, isLive, listingHref }: BusinessReviewsProps) {
  const root = React.useRef<HTMLDivElement>(null)
  useBizEntrance(root)
  const [stars, setStars] = React.useState<number | null>(null)
  const [query, setQuery] = React.useState('')

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
      <EmptyCard
        icon="inbox"
        title="No reviews yet"
        text={
          isLive
            ? 'Nobody has reviewed this listing. Reviews appear here as drivers leave them.'
            : 'Your listing is not live yet, so drivers cannot review it. Reviews appear here once it is approved and someone visits.'
        }
      >
        {isLive && listingHref ? (
          <a href={listingHref} className={cn(btnClass('line'), 'mt-5')}>
            <Ico name="ext" />
            View your public listing
          </a>
        ) : null}
      </EmptyCard>
    )
  }

  const happy = reviews.filter((review) => review.rating >= 4).length
  const latest = reviews.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b))
  const now = Date.now()
  const recent = reviews.filter((review) => now - new Date(review.date).getTime() < 30 * DAY).length

  const needle = query.trim().toLowerCase()
  const shown = reviews.filter(
    (review) =>
      (stars === null || review.rating === stars) &&
      (!needle || `${review.comment} ${review.userName}`.toLowerCase().includes(needle)),
  )

  return (
    <div ref={root} className="grid max-w-[1100px] gap-[18px]">
      {/* .rsum: the ratings at a glance. */}
      <section
        data-biz-in=""
        aria-label="Ratings at a glance"
        className={cn(
          CARD,
          'grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-8 p-6 max-[1100px]:grid-cols-[auto_minmax(0,1fr)] max-[640px]:grid-cols-1 max-[640px]:gap-5',
        )}
      >
        <div className="flex items-center gap-4">
          <b className="font-mono text-[60px] font-semibold leading-none tracking-[-0.03em] text-ink" data-biz-count={average} data-decimals="1">
            {average.toFixed(1)}
          </b>
          <div>
            <Stars rating={average} />
            <span className="mt-1 block text-[13px] text-muted">
              average from {total} review{total === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="grid gap-1.5">
          {spread.map((bucket) => (
            <button
              key={bucket.score}
              type="button"
              onClick={() => setStars(stars === bucket.score ? null : bucket.score)}
              aria-pressed={stars === bucket.score}
              aria-label={`${bucket.score} star reviews: ${bucket.count}`}
              disabled={bucket.count === 0}
              className="group grid grid-cols-[34px_minmax(0,1fr)_26px] items-center gap-2.5 rounded-lg border-0 bg-transparent p-0 text-[13px] disabled:cursor-default"
            >
              <span className="text-left font-mono text-muted group-aria-pressed:font-semibold group-aria-pressed:text-ink">{bucket.score}★</span>
              <i className="block h-2 overflow-hidden rounded bg-chalk">
                <b
                  data-biz-bar=""
                  className="block h-full rounded bg-ink transition-colors group-hover:bg-[#3a3d43] group-aria-pressed:bg-volt-ink"
                  style={{ width: `${(bucket.count / total) * 100}%` }}
                />
              </i>
              <span className="text-right font-mono text-muted">{bucket.count}</span>
            </button>
          ))}
        </div>

        <dl className="m-0 grid gap-0 max-[1100px]:col-span-full max-[1100px]:grid-cols-3 max-[640px]:col-span-1 max-[640px]:grid-cols-1">
          {[
            ['Four stars or more', `${Math.round((happy / total) * 100)}%`],
            ['In the last 30 days', String(recent)],
            ['Latest review', formatRelativeTime(latest.date)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 border-b border-ink/[.09] py-2 text-[13px] last:border-b-0 max-[1100px]:border-b-0 max-[640px]:border-b">
              <dt className="text-muted">{label}</dt>
              <dd className="m-0 font-mono font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* .tools: search and the star filter. */}
      <div data-biz-in="" className={cn(CARD, 'flex flex-wrap items-center gap-3 p-4')}>
        <label className="relative min-w-[240px] flex-1 max-[640px]:min-w-0 max-[640px]:basis-full">
          <Ico name="search" className="pointer-events-none absolute left-4 top-[15px] h-[18px] w-[18px] text-fog" />
          <span className="sr-only">Search reviews</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search review text or name"
            className="h-12 w-full rounded-[14px] border border-ink/[.09] bg-paper pl-[46px] pr-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-fog focus:border-ink focus:bg-white focus:shadow-focus"
          />
        </label>
        <div role="group" aria-label="Filter by rating" className="inline-flex flex-wrap gap-0.5 rounded-[14px] border border-ink/[.09] bg-chalk p-1">
          {[null, 5, 4, 3, 2, 1].map((score) => {
            const on = stars === score
            const count = score === null ? total : spread.find((bucket) => bucket.score === score)!.count
            return (
              <button
                key={score ?? 'all'}
                type="button"
                aria-pressed={on}
                onClick={() => setStars(score)}
                className={cn(
                  'inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[10px] border-0 px-3 text-sm font-medium transition-[background-color,color] duration-200',
                  on ? 'bg-ink text-white shadow-[0_6px_16px_-8px_rgba(11,12,14,.5)]' : 'bg-transparent text-muted hover:text-ink',
                )}
              >
                {score === null ? 'All' : (
                  <span className="inline-flex items-center gap-1">
                    {score}
                    <StarIco className="h-3.5 w-3.5" />
                  </span>
                )}
                <span
                  className={cn(
                    'min-w-[22px] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold leading-[1.3]',
                    on ? 'bg-volt text-ink' : 'bg-ink/[.07]',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Keyed by the rating filter, so a new filter staggers its cards in. */}
      <ReviewList key={stars ?? 'all'} reviews={shown} />

      <p className="m-0 mx-1 text-sm text-muted">
        Showing <b className="font-semibold text-ink">{shown.length}</b> of <b className="font-semibold text-ink">{total}</b> review{total === 1 ? '' : 's'}
        {listingHref ? (
          <>
            {' · '}
            <a href={listingHref} className="font-semibold text-ink underline-offset-2 hover:underline">
              See them on your listing
            </a>
          </>
        ) : null}
      </p>
    </div>
  )
}

function ReviewList({ reviews }: { reviews: BusinessReviewRow[] }) {
  const ref = React.useRef<HTMLUListElement>(null)
  useBizEntrance(ref)

  if (reviews.length === 0) {
    return (
      <div className={cn(CARD, 'border-dashed bg-white/70 shadow-none')}>
        <Empty icon="search" title="No review matches." text="Try another search, or pick every rating." />
      </div>
    )
  }

  return (
    <ul ref={ref} className="m-0 grid list-none gap-3.5 p-0">
      {reviews.map((review) => (
        <li key={review.id} data-biz-in="" className={cn(CARD, LIFT, 'px-6 py-5 max-[640px]:p-[18px]')}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-[26px] items-center gap-[5px] rounded-lg bg-[#FFF4D6] px-[9px] font-mono text-[13px] font-semibold text-[#8a5a00]">
              <StarIco className="h-3.5 w-3.5" />
              {review.rating}/5
            </span>
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar name={review.userName} src={review.userAvatar} size={28} />
              <b className="truncate font-display text-[19px] font-normal text-ink">{review.userName}</b>
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-muted [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-fog">
              <Ico name="clock" />
              {formatRelativeTime(review.date)}
            </span>
          </div>
          <p className="mb-0 mt-2.5 whitespace-pre-line text-[15px] leading-relaxed text-[#2c2f34]">{review.comment}</p>
        </li>
      ))}
    </ul>
  )
}
