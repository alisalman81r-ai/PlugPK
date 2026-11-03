// src/components/community/PostFeed.tsx
'use client'

import {
  Car,
  Flame,
  Loader2,
  Map,
  MessageCircle,
  Newspaper,
  SearchX,
  ShoppingCart,
  Users,
  Zap,
  type IconType,
} from '@/components/ui/icons'

import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui'
import { Btn, Tag, btnClass } from '@/components/v2/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import { STAGGER } from '@/lib/motion'
import { cn } from '@/lib/utils'
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
   * The most-liked post on the board, so the badge names the one post it is
   * actually true of rather than whatever landed at index 0.
   */
  featuredPostId?: string
  /** What was typed, so an empty result can say why it is empty. */
  searchQuery?: string
  onClearSearch?: () => void
  /** Server pagination: "Load more" asks the server for the next page from a cursor. */
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  /** Matching posts not loaded yet, for the button's label. */
  remaining?: number
  error?: string | null
}

const EMPTY_ICON: Record<string, IconType> = {
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
    <div role="status" aria-label="Loading post" className="rounded-[26px] border border-ink/10 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton rounded="full" className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mb-2 h-6 w-4/5" />
      <Skeleton className="mb-4 h-6 w-3/5" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

/** .feed__empty: one white card, an icon, a bold line and a way out. */
function Empty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: IconType
  title: ReactNode
  body: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[26px] border border-ink/10 bg-white px-6 py-12 text-center shadow-e1">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-chalk text-ink">
        <Icon size={26} aria-hidden="true" />
      </span>
      <p className="m-0 mt-1 font-display text-2xl leading-[1.15] text-ink">{title}</p>
      <p className="m-0 max-w-[30rem] text-[15px] leading-[1.6] text-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
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
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  remaining = 0,
  error,
}: PostFeedProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }, (_, index) => index).map((index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    /*
      Two different empties with different offers. A search that matched
      nothing is a query to clear; an empty category is an invitation to post.
    */
    const query = searchQuery?.trim() ?? ''

    if (query.length > 0) {
      return (
        <Empty
          icon={SearchX}
          title={<>Nothing matches &ldquo;{query}&rdquo;</>}
          body="Try a shorter word, or clear the search to see the whole board."
          action={
            onClearSearch ? (
              <Btn variant="ink" size="sm" onClick={onClearSearch}>
                Clear search
              </Btn>
            ) : null
          }
        />
      )
    }

    const EmptyIcon =
      selectedCategory === 'all'
        ? Users
        : (EMPTY_ICON[POST_CATEGORY_META[selectedCategory].icon] ?? Users)

    return (
      <Empty
        icon={EmptyIcon}
        title={selectedCategory === 'all' ? 'No posts yet' : 'Nothing in this category yet'}
        body="Be the first to start a discussion."
        action={
          onCreatePost ? (
            <Btn variant="ink" size="sm" onClick={onCreatePost}>
              Start a discussion
            </Btn>
          ) : null
        }
      />
    )
  }

  return (
    <div
      className={cn('grid gap-4 transition-opacity duration-150', isLoading && 'opacity-60')}
      aria-busy={isLoading || isLoadingMore}
    >
      {posts.map((post, index) => (
        <div key={post.id} className="min-w-0">
          {post.id === featuredPostId ? (
            <Tag tone="amber" mono className="mb-2">
              <Flame aria-hidden="true" />
              Most liked
            </Tag>
          ) : null}

          <PostCard
            post={post}
            variant={index === 0 ? 'featured' : 'default'}
            isLiked={likedPosts.has(post.id)}
            likeCount={likeCountFor ? likeCountFor(post) : post.likeCount}
            onLike={onLike}
            // Only the first screenful staggers in. Cards appended by "Load
            // more" appear at once, below the button the reader just pressed.
            animationDelay={index < PAGE_SIZE ? index * STAGGER.TIGHT : undefined}
            className={index < PAGE_SIZE ? 'animate-fade-up [animation-fill-mode:both] motion-reduce:animate-none' : undefined}
          />
        </div>
      ))}

      {error ? (
        <p role="alert" className="rounded-2xl border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-center text-sm text-[#B42E05]">
          {error}
        </p>
      ) : null}

      {hasMore && onLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
          className={btnClass(
            'light',
            'lg',
            'mt-2 w-full border border-ink/10 shadow-e1 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-70',
          )}
        >
          {isLoadingMore ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isLoadingMore ? 'Loading…' : remaining > 0 ? `Load more (${remaining} left)` : 'Load more'}
        </button>
      ) : null}
    </div>
  )
}
