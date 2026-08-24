// src/hooks/useCommunity.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { MOCK_CLUBS, MOCK_POSTS } from '@/lib/mock-data'
import type { CommunityPost, EVClub, PostCategory } from '@/lib/types'

export type CommunitySort = 'latest' | 'popular' | 'trending'

/**
 * The figures the community pages are allowed to print.
 *
 * Every one is counted from the data, the way the map and routes heroes count
 * theirs. The pages used to hardcode "5,000+ members", "1,200+ discussions"
 * and "450+ trip reports" in two places each — the hero and the sidebar —
 * against twelve posts and eight clubs. A visitor who scrolled past the badge
 * could see the claim was false, which is worse than a small honest number, and
 * a typed-in figure is wrong again the first time somebody posts.
 *
 * No member count, deliberately: nothing in the data records a signup, so the
 * only honest figures are the posts, the replies and the clubs themselves.
 */
export interface CommunityStats {
  /** Posts in the feed. */
  discussions: number
  /** Replies across every post. */
  replies: number
  /** Clubs in the directory. */
  clubs: number
  /** Cities with at least one club. */
  cities: number
  /** Members across every club, as the clubs themselves report it. */
  clubMembers: number
}

export interface UseCommunityReturn {
  posts: CommunityPost[]
  filteredPosts: CommunityPost[]
  clubs: EVClub[]
  isLoading: boolean
  selectedCategory: PostCategory | 'all'
  setSelectedCategory: (category: PostCategory | 'all') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: CommunitySort
  setSortBy: (sort: CommunitySort) => void
  likedPosts: Set<string>
  toggleLike: (postId: string) => void
  likeCountFor: (post: CommunityPost) => number
  categoryCount: Record<string, number>
  totalPosts: number
  featuredPost: CommunityPost | null
  stats: CommunityStats
}

export function useCommunity(): UseCommunityReturn {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<CommunitySort>('latest')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  /**
   * Local, synchronous filtering — nothing to wait on. This used to flash a
   * 300ms skeleton on every keystroke, which reads as lag. The flag stays in
   * the return type so a real fetch can set it later without touching any
   * consuming component.
   */
  const isLoading = false

  const posts = MOCK_POSTS

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts((current) => {
      const next = new Set(current)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  /** Optimistic count — the stored value plus this session's like. */
  const likeCountFor = useCallback(
    (post: CommunityPost) => post.likeCount + (likedPosts.has(post.id) ? 1 : 0),
    [likedPosts],
  )

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: posts.length }
    for (const post of posts) {
      counts[post.category] = (counts[post.category] ?? 0) + 1
    }
    return counts
  }, [posts])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matched = posts.filter((post) => {
      if (selectedCategory !== 'all' && post.category !== selectedCategory) return false

      if (query.length > 0) {
        const haystack = [post.title, post.content, post.userName].join(' ').toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })

    const sorted = [...matched]
    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => b.likeCount - a.likeCount)
      case 'trending':
        return sorted.sort((a, b) => b.commentCount - a.commentCount)
      case 'latest':
      default:
        return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    }
  }, [posts, selectedCategory, searchQuery, sortBy])

  const stats = useMemo<CommunityStats>(
    () => ({
      discussions: posts.length,
      replies: posts.reduce((total, post) => total + post.commentCount, 0),
      clubs: MOCK_CLUBS.length,
      cities: new Set(MOCK_CLUBS.map((club) => club.city)).size,
      clubMembers: MOCK_CLUBS.reduce((total, club) => total + club.memberCount, 0),
    }),
    [posts],
  )

  /** Most-liked post overall, independent of the current filters. */
  const featuredPost = useMemo(() => {
    if (posts.length === 0) return null
    return [...posts].sort((a, b) => b.likeCount - a.likeCount)[0] ?? null
  }, [posts])

  return {
    posts,
    filteredPosts,
    clubs: MOCK_CLUBS,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    likedPosts,
    toggleLike,
    likeCountFor,
    categoryCount,
    totalPosts: posts.length,
    featuredPost,
    stats,
  }
}
