// src/components/community/CommentSection.tsx
'use client'

import { Flag, Loader2, MessageSquare } from '@/components/ui/icons'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { Btn, INPUT, btnClass } from '@/components/v2/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { COMMUNITY_LIMITS, SITE_CONFIG } from '@/lib/constants'
import { createComment, loadComments } from '@/lib/db/community-actions'
import type { Comment } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

import { signInHref, signUpHref } from './auth-links'
import { Avatar } from './PostCard'

export interface CommentSectionProps {
  /** The first page of comments, oldest first, as the server rendered them. */
  comments: Comment[]
  postId: string
  /** Used in the subject line of a report, so the moderator knows which thread. */
  postTitle: string
  totalComments: number
}

/**
 * A report is an email, because there is no moderation queue to post it to.
 *
 * The Report button used to do nothing at all. hello@plug.pk is the address
 * the site already publishes (SITE_CONFIG.email, the footer, the legal pages),
 * and the link fills in which post and which comment, so the operator does not
 * have to ask.
 */
function reportHref(postTitle: string, url: string, comment: Comment): string {
  const subject = `Report: ${postTitle}`
  const body = `${url}\n\nComment by ${comment.userName} (${comment.id}):\n"${comment.content.slice(0, 300)}"\n\nWhat is wrong with it:\n`
  return `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function CommentSection({ comments, postId, postTitle, totalComments }: CommentSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: sessionLoading } = useCurrentUser()
  const [newComment, setNewComment] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  /*
    Older pages fetched on request. The server sends the first page only —
    it used to send every comment on the post and page through them here.
  */
  const [more, setMore] = React.useState<Comment[]>([])
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [moreError, setMoreError] = React.useState<string | null>(null)

  // Comments this visitor posted that the server has confirmed but the page
  // has not re-rendered with yet. Dropped once the refreshed list has them.
  const [posted, setPosted] = React.useState<Comment[]>([])

  const [pageUrl, setPageUrl] = React.useState('')
  React.useEffect(() => setPageUrl(window.location.href), [])

  const loaded = React.useMemo(() => {
    const seen = new Set(comments.map((comment) => comment.id))
    return [...comments, ...more.filter((comment) => !seen.has(comment.id))]
  }, [comments, more])

  const hasMore = loaded.length < totalComments

  const handleLoadMore = async () => {
    const last = loaded[loaded.length - 1]
    if (!last) return
    setIsLoadingMore(true)
    setMoreError(null)
    try {
      const page = await loadComments(postId, last.id)
      setMore((current) => [...current, ...page.comments])
    } catch {
      setMoreError('Could not load more comments. Try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  /*
    router.refresh() after the save rather than trusting local state alone:
    the server action revalidates the post page, so the refresh brings back
    the row as the database actually stored it.
  */
  const handleSubmit = async () => {
    const body = newComment.trim()
    if (body.length === 0) return

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createComment(postId, body)
      if (!result.ok) {
        setError(result.message ?? 'Could not post that.')
        return
      }
      setNewComment('')
      setIsFocused(false)
      // Saved — so it is shown now, not after the full page refresh (seconds
      // on the live site), which made it look as if nothing had posted.
      setPosted((list) => [
        ...list,
        {
          id: `posted-${Date.now()}`,
          postId,
          userId: '',
          userName: user?.name ?? 'You',
          content: body,
          likeCount: 0,
          createdAt: new Date().toISOString(),
        },
      ])
      router.refresh()
    } catch {
      setError('Could not post that. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pending = posted.filter(
    (mine) => !loaded.some((c) => c.content === mine.content && c.userName === mine.userName),
  )
  // A comment just posted belongs at the end of the thread; only show it
  // there once the thread is fully loaded, otherwise it would sit between
  // pages. Until then it is shown under the box that wrote it.
  const visible = hasMore ? loaded : [...loaded, ...pending]

  return (
    <section
      aria-labelledby="comments-heading"
      className="rounded-3xl border border-ink/10 bg-white px-5 py-6 shadow-e1 sm:rounded-[32px] sm:px-10 sm:py-9"
    >
      <h2 id="comments-heading" className="flex items-center gap-3 font-display text-[26px] leading-[1.1] text-ink">
        <MessageSquare size={22} className="text-volt-ink" aria-hidden="true" />
        <span>
          <span className="font-mono text-[24px] font-semibold [-webkit-text-stroke:0]">{totalComments + pending.length}</span>{' '}
          {totalComments + pending.length === 1 ? 'comment' : 'comments'}
        </span>
      </h2>

      <div className="mt-6 flex gap-3 sm:gap-4">
        <Avatar name={user?.name ?? 'Guest'} size={40} />

        <div className="min-w-0 flex-1">
          {sessionLoading ? (
            <div className="min-h-[96px] w-full rounded-[18px] border-[1.5px] border-ink/10 bg-chalk" />
          ) : user ? (
            <>
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                onFocus={() => setIsFocused(true)}
                maxLength={COMMUNITY_LIMITS.comment}
                placeholder="Share your thoughts..."
                aria-label="Write a comment"
                className={cn(INPUT, 'h-auto min-h-[96px] resize-y rounded-[18px] bg-chalk py-3.5 text-[15px] leading-[1.6] focus:bg-white')}
              />

              {error ? (
                <p role="alert" className="mt-2 text-sm text-[#B42E05]">
                  {error}
                </p>
              ) : null}

              {hasMore && pending.length > 0 ? (
                <p role="status" className="mt-2 text-sm text-[#157A45]">
                  Your comment is posted at the end of the thread.
                </p>
              ) : null}

              {isFocused ? (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2.5">
                  <span className="mr-auto font-mono text-xs text-muted">
                    {newComment.length}/{COMMUNITY_LIMITS.comment}
                  </span>
                  <Btn
                    magnetic={false}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewComment('')
                      setIsFocused(false)
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    magnetic={false}
                    size="sm"
                    disabled={newComment.trim().length === 0 || isSubmitting}
                    aria-busy={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                    {isSubmitting ? 'Posting…' : 'Post comment'}
                  </Btn>
                </div>
              ) : null}
            </>
          ) : (
            /*
              Signed out: a way in, rather than a greyed-out box that offered
              nothing to press. Both links come back to this post.
            */
            <div className="flex min-h-[96px] flex-wrap items-center gap-x-3 gap-y-3 rounded-[18px] border-[1.5px] border-dashed border-ink/15 bg-chalk p-4 text-[15px] text-muted">
              <span className="mr-auto">Sign in to join the conversation.</span>
              <span className="flex flex-wrap gap-2">
                <Btn magnetic={false} href={signInHref(pathname)} size="sm">
                  Sign in
                </Btn>
                <Btn magnetic={false} href={signUpHref(pathname)} variant="ghost" size="sm">
                  Create account
                </Btn>
              </span>
            </div>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-[18px] bg-chalk py-8 text-center text-[15px] text-muted">
          No comments yet. Be the first to reply.
        </p>
      ) : (
        <>
          {/*
            No like or reply controls on a comment: there is no table for
            comment likes and no threading in the schema. A control that
            pretends is worse than none.
          */}
          <ol className="m-0 mt-7 grid list-none gap-0 p-0">
            {visible.map((comment) => (
              <li key={comment.id} data-reveal="" className="flex gap-3 border-t border-ink/10 py-5 sm:gap-4">
                <Avatar name={comment.userName} size={40} />

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-[15px] font-semibold text-ink">{comment.userName}</span>
                    <span className="font-mono text-xs text-muted" suppressHydrationWarning>
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-ink/85">{comment.content}</p>

                  {comment.id.startsWith('posted-') ? null : (
                    <a
                      href={reportHref(postTitle, pageUrl, comment)}
                      className="-mx-2 -mb-2 mt-0.5 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-muted transition-colors hover:text-[#B42E05] focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      <Flag size={12} aria-hidden="true" />
                      Report
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {moreError ? (
            <p role="alert" className="mt-4 text-center text-sm text-[#B42E05]">
              {moreError}
            </p>
          ) : null}

          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              aria-busy={isLoadingMore}
              className={btnClass('ghost', 'md', 'mt-4 w-full disabled:opacity-70')}
            >
              {isLoadingMore ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isLoadingMore ? 'Loading…' : `Load more comments (${totalComments - loaded.length} left)`}
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
