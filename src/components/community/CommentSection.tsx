// src/components/community/CommentSection.tsx
'use client'

import { MessageSquare, ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createComment } from '@/lib/db/community-actions'
import type { Comment } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Avatar } from './PostCard'

export interface CommentSectionProps {
  comments: Comment[]
  postId: string
  totalComments: number
}

const PAGE_SIZE = 5

export function CommentSection({ comments, postId, totalComments }: CommentSectionProps) {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [newComment, setNewComment] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [likedComments, setLikedComments] = React.useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  const toggleLike = (commentId: string) => {
    setLikedComments((current) => {
      const next = new Set(current)
      if (next.has(commentId)) next.delete(commentId)
      else next.add(commentId)
      return next
    })
  }

  /*
    This used to clear the textarea and stop. Nothing was written, so a member
    could type a reply, press the button, watch it vanish and reasonably
    believe it had posted.

    router.refresh() rather than pushing the comment into local state: the
    server action revalidates the post page, so the refresh brings back the
    row as the database actually stored it. Optimistically rendering a comment
    that might not have saved is the same lie in a smaller font.
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
      router.refresh()
    } catch {
      setError('Could not post that. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const visible = comments.slice(0, visibleCount)

  return (
    <section>
      <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-slate-900">
        <MessageSquare size={20} className="text-plug-blue-600" aria-hidden="true" />
        {totalComments} Comments
      </h2>

      <div className="mb-8 flex gap-4">
        <Avatar name={user?.name ?? 'Guest'} size={40} />

        <div className="min-w-0 flex-1">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={user ? 'Share your thoughts...' : 'Sign in to join the conversation'}
            disabled={!user}
            aria-label="Write a comment"
            className="min-h-[80px] w-full rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:bg-white"
          />

          {error ? (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {isFocused && user ? (
            <div className="mt-3 flex justify-end gap-3">
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
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No comments yet. Be the first to reply.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {visible.map((comment) => {
              const isLiked = likedComments.has(comment.id)

              return (
                <div key={comment.id} className="flex gap-4">
                  <Avatar name={comment.userName} size={40} />

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{comment.userName}</span>
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-700">{comment.content}</p>

                    <div className="mt-3 flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => toggleLike(comment.id)}
                        aria-pressed={isLiked}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors duration-150',
                          isLiked ? 'text-plug-blue-600' : 'text-slate-400 hover:text-plug-blue-600',
                        )}
                      >
                        <ThumbsUp
                          size={14}
                          className={cn(isLiked && 'fill-plug-blue-100')}
                          aria-hidden="true"
                        />
                        <span className="text-xs">
                          {comment.likeCount + (isLiked ? 1 : 0)}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="text-xs text-slate-400 transition-colors hover:text-plug-blue-600"
                      >
                        Reply
                      </button>

                      <button
                        type="button"
                        className="text-xs text-slate-400 transition-colors hover:text-red-500"
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {comments.length > visibleCount ? (
            <div className="mt-6">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load more comments
              </Button>
            </div>
          ) : null}
        </>
      )}

      <input type="hidden" name="postId" value={postId} />
    </section>
  )
}
