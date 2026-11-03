// src/components/community/PostCard.tsx
'use client'

import { Check, Clock, Heart, Images, MessageSquare, Share2, Zap } from '@/components/ui/icons'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { Tag } from '@/components/v2/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import type { CommunityPost, PostCategory } from '@/lib/types'
import { gsap, prefersReduced } from '@/lib/gsap'
import { cn, formatRelativeTime } from '@/lib/utils'

import { CATEGORY_AVATAR, CATEGORY_TAG } from './category-tone'

export interface PostCardProps {
  post: CommunityPost
  variant?: 'default' | 'featured' | 'compact'
  isLiked?: boolean
  likeCount?: number
  onLike?: (postId: string) => void
  /** A short message for the page's toast (share copied, or could not). */
  onToast?: (message: string) => void
  animationDelay?: number
  className?: string
}

/**
 * Ink tones for an initial, picked from the name so the same author always
 * looks the same wherever there is no category to colour by (comments, the
 * club member list, the post page's author card).
 */
const AVATAR_TONES = ['bg-ink', 'bg-ink-3', 'bg-volt-ink', 'bg-[#5B3FC4]', 'bg-[#157A45]']

/** Stable per-user colour so the same author always looks the same. */
export function avatarTone(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_TONES.length
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0]!
}

/** An author's initial in a disc, set in Power Grotesk (.post__av). */
export function Avatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pg-bold grid shrink-0 place-items-center rounded-full font-display leading-none text-white',
        size >= 48 ? 'text-xl' : size >= 40 ? 'text-lg' : 'text-sm',
        className ?? avatarTone(name),
      )}
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/** A category's .tag, in the community's tones. */
export function CategoryTag({ category, className }: { category: PostCategory; className?: string }) {
  const tone = CATEGORY_TAG[category]
  return (
    <Tag tone={tone.tone} className={cn(tone.className, className)}>
      {POST_CATEGORY_META[category].label}
    </Tag>
  )
}

/** The like / comments / share cluster (.post__acts). Each target is 44px. */
const ACT =
  'relative inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] text-muted transition-colors duration-[250ms] sm:px-2.5 [&_svg]:h-[19px] [&_svg]:w-[19px]'

export function PostCard({
  post,
  variant = 'default',
  isLiked = false,
  likeCount,
  onLike,
  onToast,
  animationDelay,
  className,
}: PostCardProps) {
  const href = `/community/post/${post.slug}`
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined
  const likes = likeCount ?? post.likeCount
  // Bound once: noUncheckedIndexedAccess types post.photos[0] as possibly
  // undefined, and narrowing a const carries into the JSX below.
  const coverPhoto = post.photos?.[0]
  const photoCount = post.photos?.length ?? 0
  const [copied, setCopied] = React.useState(false)

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    // page-community.js: a heart that fills pops from a third of its size.
    const heart = event.currentTarget.querySelector('svg')
    if (!isLiked && heart && !prefersReduced()) {
      gsap.fromTo(heart, { scale: 0.3 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' })
    }
    onLike?.(post.id)
  }

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const url = `${window.location.origin}${href}`
    try {
      // The share sheet on a touch device, the clipboard everywhere else.
      if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: post.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      onToast?.('Link to this post copied.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      onToast?.("Couldn't copy automatically. Open the post and copy the link from the address bar.")
    }
  }

  /* ── Compact (related posts) ─────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          'group/rel flex items-start gap-3 rounded-[14px] px-1.5 py-3 transition-colors duration-[250ms] hover:bg-chalk',
          className,
        )}
      >
        <Avatar name={post.userName} size={34} className={CATEGORY_AVATAR[post.category]} />
        <span className="grid min-w-0 flex-1 gap-1.5">
          <span className="line-clamp-2 text-sm font-semibold leading-[1.4] text-ink">{post.title}</span>
          <span className="flex items-center gap-3 font-mono text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1">
              <Heart size={12} aria-hidden="true" />
              {likes}
              <span className="sr-only"> likes</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={12} aria-hidden="true" />
              {post.commentCount}
              <span className="sr-only"> comments</span>
            </span>
          </span>
        </span>
      </Link>
    )
  }

  const featured = variant === 'featured'

  const head = (
    <span className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
      <Avatar name={post.userName} size={40} className={CATEGORY_AVATAR[post.category]} />
      <span className="grid min-w-0 leading-[1.25]">
        <b className="truncate text-[15px] font-semibold text-ink">{post.userName}</b>
        {post.userVehicle ? (
          <span className="truncate font-mono text-xs font-medium text-muted">
            in <span className="text-ink">{post.userVehicle}</span>
          </span>
        ) : null}
      </span>
      <CategoryTag category={post.category} className="order-3 ml-[52px] sm:order-none sm:ml-auto" />
    </span>
  )

  const foot = (
    <span className="mt-3.5 flex items-center justify-between gap-3 border-t border-dashed border-ink/10 pt-2.5">
      <span className="inline-flex items-center gap-[7px] font-mono text-[12.5px] font-medium text-muted" suppressHydrationWarning>
        <Clock size={15} aria-hidden="true" />
        <time dateTime={post.createdAt} suppressHydrationWarning>
          {formatRelativeTime(post.createdAt)}
        </time>
      </span>
      <span className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={isLiked}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} this post, ${likes} ${likes === 1 ? 'like' : 'likes'}`}
          className={cn(ACT, 'hover:bg-chalk hover:text-ink focus-visible:outline-none focus-visible:shadow-focus', isLiked && 'text-ink')}
        >
          <Heart aria-hidden="true" className={cn(isLiked && 'fill-ember text-ember')} />
          <span className="min-w-[1ch] font-mono font-semibold">{likes}</span>
        </button>
        <span className={cn(ACT, 'cursor-default')} aria-label={`${post.commentCount} comments`}>
          <MessageSquare aria-hidden="true" />
          <span className="min-w-[1ch] font-mono font-semibold">{post.commentCount}</span>
        </span>
        <button
          type="button"
          onClick={handleShare}
          aria-label={copied ? 'Link copied' : 'Copy link to post'}
          className={cn(ACT, 'hover:bg-chalk hover:text-ink focus-visible:outline-none focus-visible:shadow-focus')}
        >
          {copied ? <Check aria-hidden="true" className="text-[#157A45]" /> : <Share2 aria-hidden="true" />}
        </button>
      </span>
    </span>
  )

  const body = (
    <>
      <h3 className="mt-3 text-balance font-display text-[clamp(21px,1.7vw,25px)] leading-[1.15] text-ink sm:mt-4">
        {post.title}
      </h3>
      <p className="mt-2.5 line-clamp-3 text-[15px] leading-[1.62] text-muted">{post.content}</p>
    </>
  )

  return (
    <Link
      href={href}
      style={style}
      className={cn(
        'group/post grid rounded-[22px] border border-ink/10 bg-white px-4 pb-2.5 pt-[18px] shadow-e1 sm:rounded-[26px] sm:px-[26px] sm:pb-[18px] sm:pt-6',
        '[transition:transform_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:-translate-y-[3px] hover:border-ink/[0.16] hover:shadow-e2',
        'focus-visible:outline-none focus-visible:shadow-focus motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        featured && 'gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6 sm:pl-[18px] xl:grid-cols-[220px_minmax(0,1fr)]',
        className,
      )}
    >
      {featured ? (
        coverPhoto ? (
          <span className="relative block min-h-[160px] overflow-hidden rounded-[18px] bg-stone sm:min-h-[190px]">
            <Image
              src={coverPhoto}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 220px"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover/post:scale-[1.035]"
            />
          </span>
        ) : (
          /* .post__ph: an ink tile with a faint grid and a glowing volt bolt. */
          <span
            aria-hidden="true"
            className="relative isolate grid min-h-[120px] place-items-center overflow-hidden rounded-[18px] bg-ink sm:min-h-[190px]"
          >
            <span className="absolute inset-0 -z-[1] bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[length:22px_22px] [mask-image:radial-gradient(closest-side,#000,transparent)]" />
            <span className="absolute -z-[1] h-[180px] w-[180px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.3),transparent_70%)]" />
            <Zap
              size={54}
              className="fill-volt text-volt drop-shadow-[0_0_12px_rgba(212,255,58,.7)] transition-transform duration-[600ms] ease-spring group-hover/post:-rotate-6 group-hover/post:scale-[1.12]"
            />
          </span>
        )
      ) : null}

      <span className="grid min-w-0">
        {head}
        {body}

        {!featured && coverPhoto ? (
          // Empty alt: the heading above already names the post.
          <span className="relative mt-[18px] block aspect-[4/3] overflow-hidden rounded-[18px] bg-stone sm:aspect-[16/7]">
            <Image
              src={coverPhoto}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 860px"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover/post:scale-[1.035]"
            />
            {photoCount > 1 ? (
              <span className="absolute bottom-3 right-3 inline-flex h-[30px] items-center gap-1.5 rounded-full bg-ink/70 px-[11px] text-xs text-white backdrop-blur-md">
                <Images size={15} aria-hidden="true" />
                <span className="font-mono">{photoCount}</span>
                <span className="sr-only"> photos in this post</span>
              </span>
            ) : null}
          </span>
        ) : null}

        {foot}
      </span>
    </Link>
  )
}
