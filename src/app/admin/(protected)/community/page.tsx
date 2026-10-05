// src/app/admin/(protected)/community/page.tsx
import { ChevronDown, ExternalLink, MessageSquare } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MarkCommunityPostReviewed } from '@/components/admin/MarkCommunityPostReviewed'
import { NotReviewedBadge, ReviewQueueItem } from '@/components/admin/ReviewQueue'
import { flattenParams, pick } from '@/components/admin/list-params'
import { deleteComment, deletePost } from '@/lib/db/actions'
import { listCommunityPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { formatRelativeTime } from '@/lib/utils'

/**
 * Moderating the community: posts, and now the comments under them.
 *
 * deleteComment existed and nothing called it, so a bad comment could only be
 * removed by deleting the whole thread it sat in. Each post's comments now
 * open beneath it with their own delete.
 *
 * The header used to say "N new today" over a count of every post nobody had
 * marked reviewed, however old. It now says what it counts: posts not yet
 * reviewed, and separately how many were written today (Pakistan time).
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/community'

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const filter = pick(params.filter, ['all', 'unreviewed'] as const, 'all')
  const page = toPage(params.page)

  const listing = await listCommunityPage({ q, filter, page })
  const { rows, counts } = listing

  const description = [
    `${counts.all} post${counts.all === 1 ? '' : 's'}`,
    counts.unreviewed > 0 ? `${counts.unreviewed} not yet reviewed` : 'all reviewed',
    `${counts.postedToday} posted today`,
  ].join(' · ')

  return (
    <>
      <AdminHeader
        title="Community"
        help={
          <>
            <b>Discussions your users posted publicly</b>, newest first, with their
            comments. Use it to moderate: spot an unanswered question, or take down a
            post or a comment that should not be up. You are reading the same rows the
            public community pages show.
          </>
        }
        description={`${description}. Deleting a post removes its comments too.`}
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
          <AdminSearch placeholder="Search titles, posts, comments or authors" label="Search the community" />
          <AdminFilterChips
            label="Show"
            param="filter"
            current={filter}
            path={PATH}
            params={params}
            options={[
              { value: 'all', label: 'All posts', count: counts.all },
              { value: 'unreviewed', label: 'Not yet reviewed', count: counts.unreviewed },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <MessageSquare size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">
              {counts.all === 0 ? 'No posts yet' : 'Nothing matches that'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((post) => (
              <ReviewQueueItem key={post.id} initiallyReviewed={!post.isNew} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                      {post.title}
                      {post.isNew ? <NotReviewedBadge /> : null}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">{post.content}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-xs text-slate-400">
                      <Link href={`/admin/members/${post.userId}`} className="hover:text-plug-blue-600 hover:underline">
                        {post.userName}
                      </Link>
                      <span className="capitalize">{post.category.replace(/-/g, ' ')}</span>
                      <span>{post.likeCount} likes</span>
                      <span>{post.commentCount} comments</span>
                      <span suppressHydrationWarning>Posted {formatRelativeTime(post.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <MarkCommunityPostReviewed postId={post.id} reviewed={!post.isNew} />
                    <Link
                      href={`/community/post/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View "${post.title}" on the live site`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <DeleteButton
                      label={post.title}
                      consequence={
                        post.commentCount > 0
                          ? `its ${post.commentCount} comment${post.commentCount === 1 ? '' : 's'} and likes`
                          : 'its likes'
                      }
                      action={async () => {
                        'use server'
                        return deletePost(post.id)
                      }}
                    />
                  </div>
                </div>

                {/* Native disclosure: no client state, keyboard accessible,
                    and closed by default so a long thread does not bury the
                    next post. */}
                {post.comments.length > 0 ? (
                  <details className="group mt-4 rounded-xl border border-slate-100 bg-slate-50/60">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-ui-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
                      <ChevronDown
                        size={14}
                        className="-rotate-90 transition-transform group-open:rotate-0"
                        aria-hidden="true"
                      />
                      {post.comments.length} comment{post.comments.length === 1 ? '' : 's'}
                      {post.commentCount > post.comments.length ? (
                        <span className="font-normal text-slate-400"> (first {post.comments.length} shown)</span>
                      ) : null}
                    </summary>
                    <ul className="divide-y divide-slate-100 border-t border-slate-100">
                      {post.comments.map((comment) => (
                        <li key={comment.id} className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="whitespace-pre-wrap text-ui-sm text-slate-700">{comment.content}</p>
                            <p className="mt-1 text-ui-xs text-slate-400">
                              <Link
                                href={`/admin/members/${comment.userId}`}
                                className="hover:text-plug-blue-600 hover:underline"
                              >
                                {comment.userName}
                              </Link>{' '}
                              · <span suppressHydrationWarning>{formatRelativeTime(comment.createdAt)}</span>
                            </p>
                          </div>
                          <DeleteButton
                            label={`the comment by ${comment.userName}`}
                            action={async () => {
                              'use server'
                              return deleteComment(comment.id)
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </ReviewQueueItem>
            ))}
          </div>
        )}

        <AdminPagination
          path={PATH}
          params={params}
          page={page}
          pageSize={listing.pageSize}
          total={listing.total}
          noun={['post', 'posts']}
        />
      </div>
    </>
  )
}
