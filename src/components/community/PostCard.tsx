// src/components/community/PostCard.tsx
'use client'

import { Car, Clock, Heart, Images, MessageSquare, Share2, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { POST_CATEGORY_META } from '@/lib/constants'
import type { CommunityPost } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

export interface PostCardProps {
  post: CommunityPost
  variant?: 'default' | 'featured' | 'compact'
  isLiked?: boolean
  likeCount?: number
  onLike?: (postId: string) => void
  animationDelay?: number
  className?: string
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-rose-500',
]

/** Stable per-user colour so the same author always looks the same. */
export function avatarGradient(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_GRADIENTS.length
  }
  return AVATAR_GRADIENTS[hash] ?? AVATAR_GRADIENTS[0]!
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white',
        avatarGradient(name),
        size >= 48 ? 'text-xl' : size >= 40 ? 'text-lg' : 'text-sm',
      )}
      style={{ width: size, height: size }}
    >
      {name.charAt(0)}
    </span>
  )
}

export function PostCard({
  post,
  variant = 'default',
  isLiked = false,
  likeCount,
  onLike,
  animationDelay,
  className,
}: PostCardProps) {
  const meta = POST_CATEGORY_META[post.category]
  const href = `/community/post/${post.slug}`
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined
  const likes = likeCount ?? post.likeCount
  // Bound once: noUncheckedIndexedAccess types post.photos[0] as possibly
  // undefined, and narrowing a const carries into the JSX below.
  const coverPhoto = post.photos?.[0]
  const photoCount = post.photos?.length ?? 0

  const handleLike = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onLike?.(post.id)
  }

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`)
    } catch {
      // Clipboard can be blocked; nothing else to fall back to.
    }
  }

  const categoryBadge = (
    <span
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
        meta.badge,
      )}
    >
      {meta.label}
    </span>
  )

  const engagement = (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={handleLike}
        aria-pressed={isLiked}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
        className="flex items-center gap-1.5 transition-colors duration-150"
      >
        <Heart
          size={16}
          className={cn(
            isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400',
          )}
          aria-hidden="true"
        />
        <span className={cn('text-sm', isLiked ? 'font-semibold text-red-500' : 'text-slate-400')}>
          {likes}
        </span>
      </button>

      <span className="flex items-center gap-1.5">
        <MessageSquare size={16} className="text-slate-400" aria-hidden="true" />
        <span className="text-sm text-slate-400">{post.commentCount}</span>
      </span>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Copy link to post"
        className="text-slate-400 transition-colors duration-150 hover:text-plug-blue-600"
      >
        <Share2 size={16} />
      </button>
    </div>
  )

  /* ── Compact ─────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:border-blue-200 hover:shadow-card',
          className,
        )}
      >
        <Avatar name={post.userName} size={32} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-semibold text-slate-900">{post.title}</span>
          <span className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Heart size={11} aria-hidden="true" />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={11} aria-hidden="true" />
              {post.commentCount}
            </span>
          </span>
        </span>
      </Link>
    )
  }

  /* ── Featured ────────────────────────────────────────────────── */
  if (variant === 'featured') {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          'group/post flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-card-hover lg:flex-row',
          className,
        )}
      >
        {coverPhoto ? (
          <span className="relative block h-40 shrink-0 overflow-hidden rounded-xl bg-blue-50 lg:h-auto lg:w-[200px]">
            <Image
              src={coverPhoto}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 200px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 lg:h-auto lg:w-[200px]"
          >
            <Zap size={48} className="text-blue-200" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={post.userName} />
              <span>
                <span className="block text-sm font-bold text-slate-900">{post.userName}</span>
                {post.userVehicle ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Car size={11} aria-hidden="true" />
                    {post.userVehicle}
                  </span>
                ) : null}
              </span>
            </div>
            {categoryBadge}
          </div>

          <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-snug text-slate-900 group-hover/post:text-plug-blue-600">
            {post.title}
          </h3>

          <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-slate-500">{post.content}</p>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={13} aria-hidden="true" />
              {formatRelativeTime(post.createdAt)}
            </span>
            {engagement}
          </div>
        </div>
      </Link>
    )
  }

  /* ── Default ─────────────────────────────────────────────────── */
  return (
    <Link
      href={href}
      style={style}
      className={cn(
        'group/post block rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={post.userName} />
          <span>
            <span className="block text-sm font-bold text-slate-900">{post.userName}</span>
            {post.userVehicle ? (
              <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Car size={11} aria-hidden="true" />
                {post.userVehicle}
              </span>
            ) : null}
          </span>
        </div>
        {categoryBadge}
      </div>

      <h3 className="mb-2 line-clamp-2 text-[17px] font-bold leading-snug text-slate-900 group-hover/post:text-plug-blue-600">
        {post.title}
      </h3>

      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-slate-500">{post.content}</p>

      {coverPhoto ? (
        // Empty alt: the heading above already names the post, so announcing
        // the image again would just repeat it.
        <span className="relative mb-5 block h-[180px] overflow-hidden rounded-xl bg-blue-50">
          <Image
            src={coverPhoto}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover/post:scale-[1.03]"
          />
          {photoCount > 1 ? (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Images size={11} aria-hidden="true" />
              {photoCount}
            </span>
          ) : null}
        </span>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={13} aria-hidden="true" />
          {formatRelativeTime(post.createdAt)}
        </span>
        {engagement}
      </div>
    </Link>
  )
}
