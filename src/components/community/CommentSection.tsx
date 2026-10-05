// src/components/community/CommentSection.tsx
'use client'

import { MessageSquare } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { COMMUNITY_LIMITS, SITE_CONFIG } from '@/lib/constants'
import { createComment, loadComments } from '@/lib/db/community-actions'
import type { Comment } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

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
    <section>
      <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-slate-900">
        <MessageSquare size={20} className="text-plug-blue-600" aria-hidden="true" />
        {totalComments + pending.length} {totalComments + pending.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      <div className="mb-8 flex gap-4">
        <Avatar name={user?.name ?? 'Guest'} size={40} />

        <div className="min-w-0 flex-1">
          {sessionLoading ? (
            <div className="min-h-[80px] w-full rounded-2xl border-[1.5px] border-slate-200 bg-slate-50" />
          ) : user ? (
            <>
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                onFocus={() => setIsFocused(true)}
                maxLength={COMMUNITY_LIMITS.comment}
                placeholder="Share your thoughts..."
                aria-label="Write a comment"
                className="min-h-[80px] w-full rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:bg-white"
              />

              {error ? (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              {hasMore && pending.length > 0 ? (
                <p role="status" className="mt-2 text-sm text-emerald-700">
                  Your comment is posted at the end of the thread.
                </p>
              ) : null}

              {isFocused ? (
                <div className="mt-3 flex items-center justify-end gap-3">
                  <span className="mr-auto text-xs text-slate-400">
                    {newComment.length}/{COMMUNITY_LIMITS.comment}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewComment('')
                      setIsFocused(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    isLoading={isSubmitting}
                    disabled={newComment.trim().length === 0}
                    onClick={handleSubmit}
                  >
                    Post Comment
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            /*
              Signed out: a way in, rather than a greyed-out box that said
              "Sign in to join the conversation" and offered nothing to press.
              Both links come back to this post.
            */
            <div className="flex min-h-[80px] flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-[1.5px] border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <span>Sign in to join the conversation.</span>
              <span className="flex gap-2">
                <Link
                  href={signInHref(pathname)}
                  className="inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-4 font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  Sign in
                </Link>
                <Link
                  href={signUpHref(pathname)}
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  Create account
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No comments yet. Be the first to reply.
        </p>
      ) : (
        <>
          {/*
            No like or reply controls on a comment. Both used to be drawn: the
            like was a counter in React state that a reload undid, and Reply
            did nothing — there is no table for comment likes and no threading
            in the schema. A control that pretends is worse than none.
          */}
          <div className="flex flex-col gap-6">
            {visible.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <Avatar name={comment.userName} size={40} />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{comment.userName}</span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {comment.content}
                  </p>

                  {comment.id.startsWith('posted-') ? null : (
                    <a
                      href={reportHref(postTitle, pageUrl, comment)}
                      className="-mx-2 mt-1 inline-flex h-11 items-center rounded-lg px-2 text-xs text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                    >
                      Report
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {moreError ? (
            <p role="alert" className="mt-4 text-center text-sm text-red-600">
              {moreError}
            </p>
          ) : null}

          {hasMore ? (
            <div className="mt-6">
              <Button variant="ghost" fullWidth isLoading={isLoadingMore} onClick={handleLoadMore}>
                Load more comments ({totalComments - loaded.length} left)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
