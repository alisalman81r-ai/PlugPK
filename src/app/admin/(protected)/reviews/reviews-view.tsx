// src/app/admin/(protected)/reviews/reviews-view.tsx
import Link from 'next/link'

import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { ListParams } from '@/components/admin/list-params'
import { EmptyCard, Ico, Page, PageHead, k, plural, rise, s } from '@/components/admin/people/kit'
import { deleteReview } from '@/lib/db/actions'
import type { ReviewListing } from '@/lib/db/admin-queries'
import { formatRelativeTime } from '@/lib/utils'

import { ListingSelect } from './listing-select'

const PATH = '/admin/reviews'

/** Ratings at a glance, across every review (not the filtered page). */
export interface ReviewSummary {
  total: number
  average: number
  /** Index 0 is one star, 4 is five. */
  byStars: number[]
  /** Each listing's average, keyed like the listing filter (`station:<id>`). */
  byListing: { value: string; label: string; average: number; count: number }[]
}

function Stars({ n }: { n: number }) {
  return (
    <span className={s.stars} aria-label={`${n} out of 5`}>
      {'★'.repeat(n)}
      <i>{'★'.repeat(5 - n)}</i>
    </span>
  )
}

/** The reviews page (reviews.html): summary, toolbar, one card per review. */
export function ReviewsView({
  listing,
  summary,
  params,
  q,
  listingFilter,
  page,
}: {
  listing: ReviewListing
  summary: ReviewSummary
  params: ListParams
  q: string
  listingFilter: string
  page: number
}) {
  const sum = rise(1)
  const tools = rise(2)

  return (
    <Page>
      <PageHead
        title="Reviews"
        help={
          <>
            <b>Reviews drivers left on stations and partner businesses.</b> Each one is shown publicly on the listing it
            belongs to and counts toward its rating. Delete one that is abusive, fake or about the wrong place; the
            rating moves with it.
          </>
        }
        description={`${plural(listing.total, 'review')}${q || listingFilter ? ' match' : ' in total'}.`}
      />

      {summary.total > 0 ? (
        <section className={k('card', 'rsum', sum.className)} style={sum.style} aria-label="Ratings at a glance">
          <div className={s.rsum__big}>
            <b>{summary.average.toFixed(1)}</b>
            <div>
              <Stars n={Math.round(summary.average)} />
              <span className={s.sub}>average from {plural(summary.total, 'review')}</span>
            </div>
          </div>
          <div>
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary.byStars[star - 1] ?? 0
              return (
                <div key={star} className={s.rbar}>
                  <span>{star}★</span>
                  <i>
                    <b style={{ width: `${(n / summary.total) * 100}%` }} />
                  </i>
                  <span>{n}</span>
                </div>
              )
            })}
          </div>
          <div className={s.rsum__st} data-lenis-prevent="">
            {summary.byListing.map((entry) => (
              <Link key={entry.value} href={`${PATH}?listing=${encodeURIComponent(entry.value)}`} title={entry.label}>
                <span>{entry.label}</span>
                <b>{entry.average.toFixed(1)}</b>
                <small>{entry.count}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className={k('card', 'tools', tools.className)} style={tools.style}>
        <div className={s.tools__row}>
          <AdminSearch placeholder="Search review text, author or listing" label="Search reviews" />
          <ListingSelect value={listingFilter} q={q} options={listing.listings} />
        </div>
      </div>

      {listing.rows.length === 0 ? (
        <EmptyCard
          icon="search"
          title={summary.total === 0 ? 'No reviews yet.' : 'No review matches.'}
          text={summary.total === 0 ? 'Ratings drivers leave on a listing appear here.' : 'Try another search, or pick every listing.'}
        />
      ) : (
        <ul className={s.stack} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {listing.rows.map((review, index) => {
            const r = rise(Math.min(index, 8))
            return (
              <li key={review.id} className={k('card', 'rev', r.className)} style={r.style}>
                <div style={{ minWidth: 0 }}>
                  <div className={s.rev__top}>
                    <span className={s.rscore} aria-label={`${review.rating} out of 5`}>
                      <Ico n="star" />
                      {review.rating}/5
                    </span>
                    {review.listing ? (
                      <>
                        <b>{review.listing.name}</b>
                        <span className={s.ctag}>{review.listing.kind}</span>
                      </>
                    ) : (
                      <span className={s.gone}>Listing no longer exists</span>
                    )}
                  </div>
                  <p className={s.txt}>{review.comment}</p>
                  <div className={s.meta}>
                    <Link href={`/admin/members/${review.userId}`}>
                      <Ico n="user" />
                      {review.userName}
                    </Link>
                    {review.userVehicle ? (
                      <span>
                        <Ico n="car" />
                        {review.userVehicle}
                      </span>
                    ) : null}
                    <span suppressHydrationWarning>{formatRelativeTime(review.date)}</span>
                  </div>
                </div>

                <div className={s.acts}>
                  {review.listing ? (
                    <Link
                      href={review.listing.publicHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${review.listing.name} on the live site`}
                    >
                      <Ico n="ext" />
                    </Link>
                  ) : null}
                  <DeleteButton
                    variant="icon"
                    label={`the review by ${review.userName}`}
                    action={async () => {
                      'use server'
                      return deleteReview(review.id)
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AdminPagination
        path={PATH}
        params={params}
        page={page}
        pageSize={listing.pageSize}
        total={listing.total}
        noun={['review', 'reviews']}
      />
    </Page>
  )
}
