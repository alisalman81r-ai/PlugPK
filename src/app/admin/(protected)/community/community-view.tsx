// src/app/admin/(protected)/community/community-view.tsx
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MarkCommunityPostReviewed } from '@/components/admin/MarkCommunityPostReviewed'
import { NotReviewedBadge, ReviewQueueItem } from '@/components/admin/ReviewQueue'
import type { ListParams } from '@/components/admin/list-params'
import { EmptyCard, Ico, Page, PageHead, k, plural, rise, s } from '@/components/admin/people/kit'
import { deleteComment, deletePost } from '@/lib/db/actions'
import type { CommunityListing } from '@/lib/db/admin-queries'
import { formatRelativeTime } from '@/lib/utils'

const PATH = '/admin/community'

/**
 * Moderating the community (community.html): posts, and the comments under
 * them, each with its own delete. The header says what it counts: posts not
 * yet reviewed, and separately how many were written today (Pakistan time).
 */
export function CommunityView({
  listing,
  params,
  filter,
  page,
}: {
  listing: CommunityListing
  params: ListParams
  filter: 'all' | 'unreviewed'
  page: number
}) {
  const { rows, counts } = listing
  const tools = rise(1)

  const description = [
    plural(counts.all, 'post'),
    counts.unreviewed > 0 ? `${counts.unreviewed} not yet reviewed` : 'all reviewed',
    `${counts.postedToday} posted today`,
  ].join(' · ')

  return (
    <Page>
      <PageHead
        title="Community"
        help={
          <>
            <b>Discussions your users posted publicly</b>, newest first, with their comments. Use it to moderate: spot
            an unanswered question, or take down a post or a comment that should not be up. You are reading the same
            rows the public community pages show.
          </>
        }
        description={`${description}. Deleting a post removes its comments too.`}
      />

      <div className={k('card', 'tools', tools.className)} style={tools.style}>
        <div className={s.tools__row}>
          <AdminSearch placeholder="Search titles, posts, comments or authors" label="Search the community" />
          <AdminFilterChips
            variant="seg"
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
      </div>

      {rows.length === 0 ? (
        <EmptyCard
          icon={counts.all === 0 ? 'chat' : 'search'}
          title={counts.all === 0 ? 'No posts yet.' : filter === 'unreviewed' ? 'Every post has been reviewed.' : 'No post matches.'}
          text={counts.all === 0 ? 'Posts from the community board appear here.' : filter === 'unreviewed' ? 'Nothing is waiting on you.' : 'Try another search.'}
        />
      ) : (
        <div className={s.stack}>
          {rows.map((post, index) => {
            const r = rise(Math.min(index, 8))
            return (
              <ReviewQueueItem key={post.id} initiallyReviewed={!post.isNew} className={k('card', 'post2', r.className)}>
                <div style={{ minWidth: 0 }}>
                  <h2>
                    {post.title}
                    {post.isNew ? <NotReviewedBadge /> : null}
                  </h2>
                  <p className={s.clamp}>{post.content}</p>
                  <div className={s.meta}>
                    <Link href={`/admin/members/${post.userId}`}>{post.userName}</Link>
                    <span className={s.ctag}>{post.category.replace(/-/g, ' ')}</span>
                    <span>{plural(post.likeCount, 'like')}</span>
                    <span>{plural(post.commentCount, 'comment')}</span>
                    <span suppressHydrationWarning>Posted {formatRelativeTime(post.createdAt)}</span>
                  </div>

                  {/* Native disclosure: no client state, keyboard accessible,
                      and closed by default so a long thread does not bury the
                      next post. */}
                  {post.comments.length > 0 ? (
                    <details className={s.cmts}>
                      <summary>
                        <Ico n="chat" />
                        {plural(post.comments.length, 'comment')}
                        {post.commentCount > post.comments.length ? <small>(first {post.comments.length} shown)</small> : null}
                        <Ico n="down" className={s.chev} />
                      </summary>
                      <ul>
                        {post.comments.map((comment) => (
                          <li key={comment.id}>
                            <div style={{ minWidth: 0 }}>
                              <p>{comment.content}</p>
                              <div className={s.meta}>
                                <Link href={`/admin/members/${comment.userId}`}>{comment.userName}</Link>
                                <span suppressHydrationWarning>{formatRelativeTime(comment.createdAt)}</span>
                              </div>
                            </div>
                            <div className={s.acts}>
                              <DeleteButton
                                variant="icon"
                                label={`the comment by ${comment.userName}`}
                                action={async () => {
                                  'use server'
                                  return deleteComment(comment.id)
                                }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>

                <div className={s.acts}>
                  <MarkCommunityPostReviewed postId={post.id} reviewed={!post.isNew} />
                  <Link href={`/community/post/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Open "${post.title}" on the live site`}>
                    <Ico n="ext" />
                  </Link>
                  <DeleteButton
                    variant="icon"
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
              </ReviewQueueItem>
            )
          })}
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
    </Page>
  )
}
