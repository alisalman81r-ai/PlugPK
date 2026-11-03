// src/components/community/PostActions.tsx
'use client'

import { Check, Heart, Share2 } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getMyLikedPostIds, togglePostLike } from '@/lib/db/community-actions'
import { gsap, prefersReduced } from '@/lib/gsap'
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

  const handleLike = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return
    // The community feed's heart pop: filling, it springs up from a third of its size.
    const heart = event.currentTarget.querySelector('svg')
    if (user && !liked && heart && !prefersReduced()) {
      gsap.fromTo(heart, { scale: 0.3 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' })
    }
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
    <div className="mt-8 border-t border-dashed border-ink/10 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={loading}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          className={cn(
            'inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60',
            liked ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink hover:border-ink/30',
          )}
        >
          <Heart size={19} className={cn(liked ? 'fill-ember text-ember' : 'text-muted')} aria-hidden="true" />
          <span>
            <span className="font-mono">{count}</span> {count === 1 ? 'like' : 'likes'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-ink transition-colors duration-200 hover:bg-chalk focus-visible:outline-none focus-visible:shadow-focus"
        >
          {copied ? (
            <Check size={18} className="text-[#157A45]" aria-hidden="true" />
          ) : (
            <Share2 size={18} aria-hidden="true" />
          )}
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>

      <p aria-live="polite" className="text-sm">
        {message === 'signin' ? (
          <span className="mt-2 block text-muted">
            <Link href={signInHref(pathname)} className="font-semibold text-ink underline decoration-volt-ink/40 underline-offset-4 hover:decoration-volt-ink">
              Sign in
            </Link>{' '}
            to like posts.
          </span>
        ) : message ? (
          <span className="mt-2 block text-[#B42E05]">{message}</span>
        ) : null}
      </p>
    </div>
  )
}
