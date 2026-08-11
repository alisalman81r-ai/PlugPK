// src/components/community/PostFeed.tsx
'use client'

import { Car, Map, MessageCircle, Newspaper, Pin, ShoppingCart, Users, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { Button, Skeleton } from '@/components/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import type { CommunityPost, PostCategory } from '@/lib/types'
import { PostCard } from './PostCard'

export interface PostFeedProps {
  posts: CommunityPost[]
  isLoading: boolean
  likedPosts: Set<string>
  onLike: (postId: string) => void
  selectedCategory: PostCategory | 'all'
  likeCountFor?: (post: CommunityPost) => number
  onCreatePost?: () => void
}

const EMPTY_ICON: Record<string, LucideIcon> = {
  MessageCircle,
  Zap,
  Map,
  Car,
  ShoppingCart,
  Newspaper,
}

const PAGE_SIZE = 6

function PostSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading post"
      className="rounded-2xl border border-slate-100 bg-white p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton rounded="full" className="h-11 w-11" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mb-2 h-5 w-4/5" />
      <Skeleton className="mb-4 h-5 w-3/5" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-5 h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function PostFeed({
  posts,
  isLoading,
  likedPosts,
  onLike,
  selectedCategory,
  likeCountFor,
  onCreatePost,
}: PostFeedProps) {
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  // A new filter should always start from the top of the list.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedCategory, posts.length])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }, (_, index) => index).map((index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    const EmptyIcon =
      selectedCategory === 'all'
        ? Users
        : (EMPTY_ICON[POST_CATEGORY_META[selectedCategory].icon] ?? Users)

    return (
      <div className="py-20 text-center">
        <EmptyIcon size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mt-6 text-2xl font-bold text-slate-900">No posts yet</p>
        <p className="mt-2 text-slate-500">Be the first to start a discussion</p>
        {onCreatePost ? (
          <div className="mt-6">
            <Button onClick={onCreatePost}>Start a Discussion</Button>
          </div>
        ) : null}
      </div>
    )
  }

  const visible = posts.slice(0, visibleCount)
  const hasMore = posts.length > visibleCount

  return (
    <div className="flex flex-col gap-5">
      {visible.map((post, index) => (
        <div key={post.id}>
          {index === 0 ? (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Pin size={12} aria-hidden="true" />
              Featured
            </span>
          ) : null}

          <PostCard
            post={post}
            variant={index === 0 ? 'featured' : 'default'}
            isLiked={likedPosts.has(post.id)}
            likeCount={likeCountFor ? likeCountFor(post) : post.likeCount}
            onLike={onLike}
            animationDelay={index * 60}
            className="animate-fade-up opacity-0"
          />
        </div>
      ))}

      {hasMore ? (
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Load more posts
        </Button>
      ) : null}
    </div>
  )
}
