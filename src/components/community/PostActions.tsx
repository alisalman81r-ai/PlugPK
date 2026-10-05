// src/components/community/PostActions.tsx
'use client'

import { Check, Heart, Share2 } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getMyLikedPostIds, togglePostLike } from '@/lib/db/community-actions'
import { cn } from '@/lib/utils'

import { signInHref } from './auth-links'

export interface PostActionsProps {
  postId: string
  title: string
  /** The stored count the page was rendered with. */
  likeCount: number
}

/**
 * Like and share, on the post page.
 *
 * This bar used to be five inert spans: a heart that showed a count and could
 * not be pressed, three share icons that went nowhere, and a "Save" with no
 * saved-posts feature behind it. Like is now real (a PostLike row), share
 * copies the link — or opens the phone's share sheet where there is one — and
 * Save is gone rather than pretending.
 */
export function PostActions({ postId, title, likeCount }: PostActionsProps) {
  const pathname = usePathname()
  const { user, loading } = useCurrentUser()
  const [liked, setLiked] = React.useState(false)
  const [count, setCount] = React.useState(likeCount)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => setCount(likeCount), [likeCount])

  // Whether this account already likes it. Asked after render so the page
  // itself stays one cached page for everybody.
  React.useEffect(() => {
    if (!user) return
    let live = true
    getMyLikedPostIds([postId])
      .then((ids) => {
        if (live) setLiked(ids.includes(postId))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [user, postId])

  const handleLike = async () => {
    if (busy) return
    if (!user) {
      setMessage('signin')
      return
    }

    const wasLiked = liked
    const before = count
    setBusy(true)
    setMessage(null)
    setLiked(!wasLiked)
    setCount(Math.max(0, before + (wasLiked ? -1 : 1)))

    try {
      const result = await togglePostLike(postId)
      if (!result.ok) throw new Error(result.message ?? 'Could not save that like.')
      setLiked(result.liked === true)
      if (typeof result.likeCount === 'number') setCount(result.likeCount)
    } catch (error) {
      // Roll back to what was true before the tap.
      setLiked(wasLiked)
      setCount(before)
      setMessage(error instanceof Error ? error.message : 'Could not save that like.')
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href.split('#')[0] ?? window.location.href
    // The share sheet where the device has one and it is a touch device;
    // a desktop "share" dialog is a detour when the link is what people want.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        // Dismissing the sheet is not a failure worth a fallback.
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setMessage('Could not copy the link. Copy it from the address bar.')
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={loading}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          className={cn(
            'flex h-11 items-center gap-2 rounded-xl px-3 font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 disabled:opacity-60',
            liked ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-white',
          )}
        >
          <Heart
            size={22}
            className={cn(liked ? 'fill-red-500 text-red-500' : 'text-slate-400')}
            aria-hidden="true"
          />
          <span>
            {count} {count === 1 ? 'Like' : 'Likes'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-plug-blue-200 hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          {copied ? (
            <Check size={16} className="text-emerald-600" aria-hidden="true" />
          ) : (
            <Share2 size={16} aria-hidden="true" />
          )}
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>

      <p aria-live="polite" className="text-sm">
        {message === 'signin' ? (
          <span className="mt-2 block text-slate-600">
            <Link href={signInHref(pathname)} className="font-semibold text-plug-blue-600 hover:underline">
              Sign in
            </Link>{' '}
            to like posts.
          </span>
        ) : message ? (
          <span className="mt-2 block text-red-600">{message}</span>
        ) : null}
      </p>
    </div>
  )
}
