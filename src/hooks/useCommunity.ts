// src/hooks/useCommunity.ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getMyLikedPostIds, loadPosts, togglePostLike } from '@/lib/db/community-actions'
import type { CommunityPost, PostCategory } from '@/lib/types'

export type CommunitySort = 'latest' | 'popular' | 'trending'

/**
 * The figures the community pages are allowed to print.
 *
 * Every one is counted from the data. The pages used to hardcode "5,000+
 * members", "1,200+ discussions" and "450+ trip reports" against twelve posts
 * and eight clubs, and later took club figures from the mock fixture. They now
 * come from community-queries getCommunityFigures(), counted on the server.
 *
 * clubMembers is active memberships, not the seeded Club.memberCount baseline,
 * which nothing in the repository can source — see getCommunityClubs().
 */
export interface CommunityStats {
  /** Posts on the board. */
  discussions: number
  /** Replies across every post. */
  replies: number
  /** Clubs in the directory. */
  clubs: number
  /** Cities with at least one club. */
  cities: number
  /** Active club members, counted. */
  clubMembers: number
}

export interface CommunityInitialData {
  posts: CommunityPost[]
  nextCursor: string | null
  /** Posts per category, plus `all`, counted in the database. */
  categoryCount: Record<string, number>
  stats: CommunityStats
}

export interface UseCommunityReturn {
  /** The posts loaded so far for the current filters, in the server's order. */
  posts: CommunityPost[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  loadError: string | null
  /** Posts matching the current filters altogether, not just those loaded. */
  resultCount: number
  selectedCategory: PostCategory | 'all'
  setSelectedCategory: (category: PostCategory | 'all') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: CommunitySort
  setSortBy: (sort: CommunitySort) => void
  likedPosts: Set<string>
  toggleLike: (postId: string) => void
  likeCountFor: (post: CommunityPost) => number
  /** Set when a like could not be saved, e.g. signed out. */
  likeMessage: string | null
  categoryCount: Record<string, number>
  totalPosts: number
  stats: CommunityStats
}

/** How long typing has to pause before the board asks the server. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * The board's state: a page of posts from the server, more on request.
 *
 * ── What this replaced ────────────────────────────────────────────────
 *
 * It took every post the server had and filtered and sorted them in memory,
 * and when the database was empty it substituted MOCK_POSTS — so a board with
 * nothing on it showed a dozen invented discussions. Likes were a Set in
 * state that a reload threw away.
 *
 * Now the server sends one page, filters and sorts in the database
 * (loadPosts), and "Load more" continues from a cursor. An empty board is an
 * empty board, and PostFeed says so. Likes are PostLike rows: the heart moves
 * the moment it is pressed and rolls back if the server refuses.
 */
export function useCommunity(initial: CommunityInitialData): UseCommunityReturn {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<CommunitySort>('latest')

  const [posts, setPosts] = useState<CommunityPost[]>(initial.posts)
  const [nextCursor, setNextCursor] = useState<string | null>(initial.nextCursor)
  const [resultCount, setResultCount] = useState<number>(initial.categoryCount.all ?? 0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  /** Counts the server confirmed (or this tab predicted) since the page loaded. */
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [likeMessage, setLikeMessage] = useState<string | null>(null)
  const pendingLikes = useRef<Set<string>>(new Set())

  /*
    The filters the posts on screen answer. The page handed down by the server
    answers the defaults, so the first render does not ask again. Keyed on what
    is shown rather than "has this run before", which React's development
    double-invoke would get wrong.
  */
  const request = useRef(0)
  const shownKey = useRef('all|latest|')

  useEffect(() => {
    const key = `${selectedCategory}|${sortBy}|${searchQuery.trim()}`
    const ticket = ++request.current
    if (key === shownKey.current) {
      setIsLoading(false)
      return
    }

    const delay = searchQuery.trim() ? SEARCH_DEBOUNCE_MS : 0
    setIsLoading(true)
    setLoadError(null)

    const timer = window.setTimeout(() => {
      loadPosts({ category: selectedCategory, sort: sortBy, query: searchQuery })
        .then((page) => {
          // A newer filter has been chosen since; this answer is stale.
          if (ticket !== request.current) return
          shownKey.current = key
          setPosts(page.posts)
          setNextCursor(page.nextCursor)
          setResultCount(page.total)
        })
        .catch(() => {
          if (ticket === request.current) setLoadError('Could not load posts. Try again.')
        })
        .finally(() => {
          if (ticket === request.current) setIsLoading(false)
        })
    }, delay)

    return () => window.clearTimeout(timer)
  }, [selectedCategory, sortBy, searchQuery])

  const loadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) return
    const ticket = request.current
    setIsLoadingMore(true)
    setLoadError(null)

    loadPosts({ cursor: nextCursor, category: selectedCategory, sort: sortBy, query: searchQuery })
      .then((page) => {
        if (ticket !== request.current) return
        setPosts((current) => {
          const seen = new Set(current.map((post) => post.id))
          return [...current, ...page.posts.filter((post) => !seen.has(post.id))]
        })
        setNextCursor(page.nextCursor)
        setResultCount(page.total)
      })
      .catch(() => setLoadError('Could not load more posts. Try again.'))
      .finally(() => setIsLoadingMore(false))
  }, [nextCursor, isLoadingMore, selectedCategory, sortBy, searchQuery])

  /*
    Which of the visible posts this account has liked.

    Asked after render rather than baked into the page, so /community can be
    cached for everyone. Only ids not asked about before are sent.
  */
  const askedLikes = useRef<Set<string>>(new Set())
  useEffect(() => {
    const ids = posts.map((post) => post.id).filter((id) => !askedLikes.current.has(id))
    if (ids.length === 0) return
    ids.forEach((id) => askedLikes.current.add(id))

    getMyLikedPostIds(ids)
      .then((liked) => {
        if (liked.length === 0) return
        setLikedPosts((current) => {
          const next = new Set(current)
          liked.forEach((id) => next.add(id))
          return next
        })
      })
      .catch(() => {
        // Unknown is the same as not liked; the button still works.
      })
  }, [posts])

  const likeCountFor = useCallback(
    (post: CommunityPost) => likeCounts[post.id] ?? post.likeCount,
    [likeCounts],
  )

  const toggleLike = useCallback(
    (postId: string) => {
      if (pendingLikes.current.has(postId)) return
      const post = posts.find((item) => item.id === postId)
      if (!post) return

      const wasLiked = likedPosts.has(postId)
      const before = likeCounts[postId] ?? post.likeCount

      // Optimistic: the heart and the count move now.
      pendingLikes.current.add(postId)
      setLikeMessage(null)
      setLikedPosts((current) => {
        const next = new Set(current)
        if (wasLiked) next.delete(postId)
        else next.add(postId)
        return next
      })
      setLikeCounts((current) => ({ ...current, [postId]: Math.max(0, before + (wasLiked ? -1 : 1)) }))

      const rollback = (message: string) => {
        setLikedPosts((current) => {
          const next = new Set(current)
          if (wasLiked) next.add(postId)
          else next.delete(postId)
          return next
        })
        setLikeCounts((current) => ({ ...current, [postId]: before }))
        setLikeMessage(message)
      }

      togglePostLike(postId)
        .then((result) => {
          if (!result.ok) return rollback(result.message ?? 'Could not save that like.')
          // Settle on what the server stored, which may include other people's.
          setLikedPosts((current) => {
            const next = new Set(current)
            if (result.liked) next.add(postId)
            else next.delete(postId)
            return next
          })
          if (typeof result.likeCount === 'number') {
            setLikeCounts((current) => ({ ...current, [postId]: result.likeCount as number }))
          }
        })
        .catch(() => rollback('Could not save that like. Try again.'))
        .finally(() => pendingLikes.current.delete(postId))
    },
    [posts, likedPosts, likeCounts],
  )

  const stats = initial.stats
  const categoryCount = useMemo(() => initial.categoryCount, [initial.categoryCount])

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore: nextCursor !== null,
    loadMore,
    loadError,
    resultCount,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    likedPosts,
    toggleLike,
    likeCountFor,
    likeMessage,
    categoryCount,
    totalPosts: initial.categoryCount.all ?? 0,
    stats,
  }
}
