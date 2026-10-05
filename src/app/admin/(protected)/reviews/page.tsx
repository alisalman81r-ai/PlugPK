// src/app/admin/(protected)/reviews/page.tsx
import { ExternalLink, Star } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { flattenParams } from '@/components/admin/list-params'
import { deleteReview } from '@/lib/db/actions'
import { listReviewsPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { formatRelativeTime } from '@/lib/utils'

/**
 * Every driver review, newest first, with a way to take one down.
 *
 * There was no moderation screen for reviews at all: an abusive or fake one
 * could only be removed by deleting the account that wrote it. Ratings are
 * derived from these rows by the public pages, so deleting a review here is
 * the whole change — nothing is left to recompute.
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/reviews'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const listingFilter = /^(station|business):[\w-]{1,100}$/.test(params.listing ?? '') ? params.listing! : ''
  const page = toPage(params.page)

  const listing = await listReviewsPage({ q, listing: listingFilter, page })

  return (
    <>
      <AdminHeader
        title="Reviews"
        help={
          <>
            <b>Reviews drivers left on stations and partner businesses.</b> Each one is
            shown publicly on the listing it belongs to and counts toward its rating.
            Delete one that is abusive, fake or about the wrong place; the rating moves
            with it.
          </>
        }
        description={`${listing.total.toLocaleString('en-PK')} review${listing.total === 1 ? '' : 's'}${q || listingFilter ? ' match' : ' in total'}.`}
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
          <AdminSearch placeholder="Search review text, author or listing" label="Search reviews" />
          {/* A plain GET form: picking a listing is a URL change, and it works
              before any script has loaded. */}
          <form method="get" action={PATH} className="flex w-full min-w-0 items-center gap-2 lg:w-auto">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <label htmlFor="listing" className="sr-only">
              Filter by listing
            </label>
            <select
              id="listing"
              name="listing"
              defaultValue={listingFilter}
              className="h-10 min-w-0 flex-1 cursor-pointer rounded-lg lg:max-w-[18rem] lg:flex-none border border-slate-200 bg-slate-50 px-3 text-ui-sm font-medium text-slate-700 outline-none focus-visible:border-plug-blue-500"
            >
              <option value="">Every listing</option>
              {listing.listings.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} · {option.count}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Apply
            </button>
          </form>
        </div>

        {listing.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Star size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No reviews match</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {listing.rows.map((review) => (
              <li key={review.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-ui-xs font-bold text-amber-800"
                        aria-label={`${review.rating} out of 5`}
                      >
                        <Star size={12} aria-hidden="true" />
                        {review.rating}/5
                      </span>
                      {review.listing ? (
                        <span className="font-semibold text-slate-900">
                          {review.listing.name}
                          <span className="ml-1.5 text-ui-xs font-normal capitalize text-slate-400">
                            {review.listing.kind}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ui-sm text-slate-400">Listing no longer exists</span>
                      )}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-ui-sm leading-relaxed text-slate-700">{review.comment}</p>
                    <p className="mt-2 flex flex-wrap gap-x-3 text-ui-xs text-slate-400">
                      <Link href={`/admin/members/${review.userId}`} className="hover:text-plug-blue-600 hover:underline">
                        {review.userName}
                      </Link>
                      {review.userVehicle ? <span>{review.userVehicle}</span> : null}
                      <span suppressHydrationWarning>{formatRelativeTime(review.date)}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    {review.listing ? (
                      <Link
                        href={review.listing.publicHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${review.listing.name} on the live site`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                      >
                        <ExternalLink size={15} />
                      </Link>
                    ) : null}
                    <DeleteButton
                      label={`the review by ${review.userName}`}
                      action={async () => {
                        'use server'
                        return deleteReview(review.id)
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
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
      </div>
    </>
  )
}
