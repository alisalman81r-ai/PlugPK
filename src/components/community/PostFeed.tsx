// src/components/community/PostFeed.tsx
'use client'

import {
  Car,
  Flame,
  Loader2,
  Map as MapIcon,
  MessageCircle,
  Newspaper,
  SearchX,
  ShoppingCart,
  Users,
  Zap,
  type IconType,
} from '@/components/ui/icons'

import * as React from 'react'

import { Skeleton } from '@/components/ui'
import { Btn, Tag, btnClass } from '@/components/v2/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
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
  /** A short message for the page's toast (a share that copied, or could not). */
  onToast?: (message: string) => void
}

const EMPTY_ICON: Record<string, IconType> = {
  MessageCircle,
  Zap,
  Map: MapIcon,
  Car,
  ShoppingCart,
  Newspaper,
}

/*
  Posts wait out of sight until the entrance below has wired them, so the
  server-rendered cards do not flash before they rise in. The same guard as
  [data-reveal] in globals.css: only with script, only when motion is welcome.
*/
const PRE_HIDE =
  '@media (prefers-reduced-motion: no-preference){html.js [data-feed]:not([data-feed-on])>[data-post]{opacity:0}}'

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
  title: React.ReactNode
  body: React.ReactNode
  action?: React.ReactNode
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

/* ── Where each card sits, for the reorder ─────────────────────────── */

/** A card's place in the list, without any transform GSAP has on it. */
interface Spot {
  x: number
  y: number
  w: number
  node: HTMLElement
}

const num = (node: Element, prop: string) => Number(gsap.getProperty(node, prop)) || 0

function measure(list: HTMLElement): Map<string, Spot> {
  const box = list.getBoundingClientRect()
  const spots = new Map<string, Spot>()
  list.querySelectorAll<HTMLElement>(':scope > [data-post]').forEach((node) => {
    const r = node.getBoundingClientRect()
    spots.set(node.dataset.post ?? '', {
      x: r.left - box.left - num(node, 'x'),
      y: r.top - box.top - num(node, 'y'),
      w: r.width,
      node,
    })
  })
  return spots
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
  onToast,
}: PostFeedProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLDivElement>(null)
  const ctxRef = React.useRef<gsap.Context | null>(null)
  /** Where the cards were after the last commit: the "first" of the reorder. */
  const spots = React.useRef<Map<string, Spot>>(new Map())
  /** The ids on screen, in order; null until the first layout. */
  const shown = React.useRef<string[] | null>(null)
  const settle = React.useRef<gsap.core.Tween | null>(null)

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const ctx = gsap.context(() => {}, list)
    ctxRef.current = ctx
    // Fonts and late layout move the cards; keep "where they are" true.
    const remeasure = () => {
      spots.current = measure(list)
    }
    window.addEventListener('resize', remeasure)
    ScrollTrigger.addEventListener('refresh', remeasure)
    return () => {
      window.removeEventListener('resize', remeasure)
      ScrollTrigger.removeEventListener('refresh', remeasure)
      settle.current?.kill()
      ctx.revert()
      ctxRef.current = null
      // A remount (React's development double-invoke) enters afresh.
      shown.current = null
    }
  }, [])

  /*
    page-community.js, ported. On load the cards rise in as they scroll into
    view (ScrollTrigger.batch). When a sort, a category or a search changes the
    list, the design runs Flip.from: cards that stay glide to their new place,
    new ones rise in, gone ones shrink away. The board filters in the database
    here, so this is the same move done by hand between React commits: the
    cards' last positions against their new ones. "Load more" only appends, and
    what it appends enters like the first page did.
  */
  React.useLayoutEffect(() => {
    const list = listRef.current
    const ctx = ctxRef.current
    if (!list || !ctx) return

    const now = posts.map((post) => post.id)
    const before = shown.current
    const first = spots.current
    const last = measure(list)
    shown.current = now
    spots.current = last
    list.setAttribute('data-feed-on', '')
    if (prefersReduced()) return

    const nodeOf = (id: string) => last.get(id)?.node
    const nodes = now.map(nodeOf).filter((node): node is HTMLElement => Boolean(node))

    const enterOnScroll = (els: HTMLElement[]) => {
      if (!els.length) return
      ctx.add(() => {
        gsap.set(els, { autoAlpha: 0, y: 40 })
        ScrollTrigger.batch(els, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.07,
              clearProps: 'opacity,visibility,transform',
            }),
        })
      })
    }

    if (before === null) {
      enterOnScroll(nodes)
      return
    }
    if (before.length === now.length && before.every((id, i) => now[i] === id)) return

    const appended = before.length > 0 && before.length < now.length && before.every((id, i) => now[i] === id)
    if (appended) {
      enterOnScroll(now.slice(before.length).map(nodeOf).filter((node): node is HTMLElement => Boolean(node)))
      ScrollTrigger.refresh()
      return
    }

    /* Flip.from(state, { duration: .7, ease: "expo.out", absolute: true, scale: false, … }) */
    ctx.add(() => {
      settle.current?.kill()
      const entering: HTMLElement[] = []

      last.forEach((to, id) => {
        const from = first.get(id)
        const node = to.node
        // A card that has not risen in yet comes in as a new one would.
        if (!from || from.node !== node || num(node, 'opacity') < 1) {
          entering.push(node)
          return
        }
        const dx = from.x + num(node, 'x') - to.x
        const dy = from.y + num(node, 'y') - to.y
        gsap.killTweensOf(node)
        gsap.fromTo(node, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.7, ease: 'expo.out' })
      })

      /* onLeave: a gone card stays where it was, as a copy, and shrinks away. */
      const ghosts: HTMLElement[] = []
      const layer = ghostRef.current
      if (layer) {
        first.forEach((spot, id) => {
          if (last.get(id)?.node === spot.node) return
          const ghost = spot.node.cloneNode(true) as HTMLElement
          ghost.removeAttribute('data-post')
          ghost.setAttribute('aria-hidden', 'true')
          ghost.setAttribute('inert', '')
          Object.assign(ghost.style, {
            position: 'absolute',
            left: `${spot.x}px`,
            top: `${spot.y}px`,
            width: `${spot.w}px`,
            margin: '0',
          })
          layer.appendChild(ghost)
          ghosts.push(ghost)
        })
      }
      if (ghosts.length) {
        gsap.to(ghosts, {
          autoAlpha: 0,
          scale: 0.97,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => ghosts.forEach((ghost) => ghost.remove()),
        })
      }

      /* onEnter */
      if (entering.length) {
        gsap.killTweensOf(entering)
        gsap.fromTo(
          entering,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 },
        )
      }

      /* onComplete */
      settle.current = gsap.delayedCall(0.7, () => {
        gsap.set(nodes, { clearProps: 'opacity,visibility,transform' })
        ScrollTrigger.refresh()
      })
    })
  }, [posts])

  // Any other commit (a filter pressed, a like, the loading state) can move
  // the cards too; measure again so the next reorder starts from the truth.
  React.useLayoutEffect(() => {
    if (listRef.current && shown.current) spots.current = measure(listRef.current)
  })

  /*
    Two different empties with different offers. A search that matched
    nothing is a query to clear; an empty category is an invitation to post.
  */
  let empty: React.ReactNode = null
  if (isLoading && posts.length === 0) {
    empty = (
      <div className="grid gap-4">
        {Array.from({ length: 4 }, (_, index) => index).map((index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    )
  } else if (posts.length === 0) {
    const query = searchQuery?.trim() ?? ''
    if (query.length > 0) {
      empty = (
        <Empty
          icon={SearchX}
          title={<>Nothing matches &ldquo;{query}&rdquo;</>}
          body="Try a shorter word, or clear the search to see the whole board."
          action={
            onClearSearch ? (
              <Btn variant="ink" size="sm" magnetic={false} onClick={onClearSearch}>
                Clear search
              </Btn>
            ) : null
          }
        />
      )
    } else {
      const EmptyIcon =
        selectedCategory === 'all'
          ? Users
          : (EMPTY_ICON[POST_CATEGORY_META[selectedCategory].icon] ?? Users)
      empty = (
        <Empty
          icon={EmptyIcon}
          title={selectedCategory === 'all' ? 'No posts yet' : 'Nothing in this category yet'}
          body="Be the first to start a discussion."
          action={
            onCreatePost ? (
              <Btn variant="ink" size="sm" magnetic={false} onClick={onCreatePost}>
                Start a discussion
              </Btn>
            ) : null
          }
        />
      )
    }
  }

  return (
    <div aria-busy={isLoading || isLoadingMore}>
      <style dangerouslySetInnerHTML={{ __html: PRE_HIDE }} />

      {/* The list is always mounted, empty or not, so every change to it is a
          move from what was there before. */}
      <div className={cn('relative transition-opacity duration-150', isLoading && posts.length > 0 && 'opacity-60')}>
        <div ref={listRef} data-feed="" className="grid gap-4">
          {posts.map((post, index) => (
            <div key={post.id} data-post={post.id} className="min-w-0">
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
                onToast={onToast}
              />
            </div>
          ))}
        </div>
        {/* Cards on their way out are copied here, out of React's list. */}
        <div ref={ghostRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      </div>

      {empty}

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-center text-sm text-[#B42E05]">
          {error}
        </p>
      ) : null}

      {hasMore && onLoadMore && posts.length > 0 ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
          className={btnClass(
            'light',
            'lg',
            'mt-6 w-full border border-ink/10 shadow-e1 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-70',
          )}
        >
          {isLoadingMore ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isLoadingMore ? 'Loading…' : remaining > 0 ? `Load more (${remaining} left)` : 'Load more'}
        </button>
      ) : null}
    </div>
  )
}
