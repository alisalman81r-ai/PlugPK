// src/components/community/PostFeed.tsx
'use client'

import {
  Car,
  Flame,
  Map,
  MessageCircle,
  Newspaper,
  SearchX,
  ShoppingCart,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
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
  /**
   * The most-liked post on the board, so the badge can name the one post it is
   * actually true of.
   *
   * The feed used to badge whatever landed at index 0 as "Featured", whichever
   * sort produced it — so under "Latest" the newest post was announced as
   * featured, and the post the hero was calling featured sat unlabelled further
   * down. The label now travels with the post rather than with the position.
   */
  featuredPostId?: string
  /** What was typed, so an empty result can say why it is empty. */
  searchQuery?: string
  onClearSearch?: () => void
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
  featuredPostId,
  searchQuery,
  onClearSearch,
}: PostFeedProps) {
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  // A new filter should always start from the top of the list.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedCategory, searchQuery, posts.length])

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
    /*
      Two different empties, and they need different offers. A search that
      matched nothing is a query to clear — telling somebody to "be the first
      to start a discussion" when there are eleven posts they simply mis-spelled
      past is wrong, and it hides the way out. An empty category really is an
      invitation to post.
    */
    const query = searchQuery?.trim() ?? ''

    if (query.length > 0) {
      return (
        <div className="py-20 text-center">
          <SearchX size={64} className="mx-auto text-slate-200" aria-hidden="true" />
          <p className="mt-6 font-display text-2xl font-bold text-slate-900">
            Nothing matches &ldquo;{query}&rdquo;
          </p>
          <p className="mt-2 text-ui text-slate-500">
            Try a shorter word, or clear the search to see the whole board.
          </p>
          {onClearSearch ? (
            <div className="mt-6">
              <Button variant="secondary" onClick={onClearSearch}>
                Clear search
              </Button>
            </div>
          ) : null}
        </div>
      )
    }

    const EmptyIcon =
      selectedCategory === 'all'
        ? Users
        : (EMPTY_ICON[POST_CATEGORY_META[selectedCategory].icon] ?? Users)

    return (
      <div className="py-20 text-center">
        <EmptyIcon size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mt-6 font-display text-2xl font-bold text-slate-900">
          {selectedCategory === 'all' ? 'No posts yet' : 'Nothing in this category yet'}
        </p>
        <p className="mt-2 text-ui text-slate-500">Be the first to start a discussion.</p>
        {onCreatePost ? (
          <div className="mt-6">
            <Button onClick={onCreatePost}>Start a discussion</Button>
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
          {post.id === featuredPostId ? (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-ui-xs font-bold uppercase tracking-[0.1em] text-amber-700">
              <Flame size={12} aria-hidden="true" />
              Most liked
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
          Load {Math.min(PAGE_SIZE, posts.length - visibleCount)} more
        </Button>
      ) : null}
    </div>
  )
}
