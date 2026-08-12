// src/hooks/useCommunity.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { MOCK_CLUBS, MOCK_POSTS } from '@/lib/mock-data'
import type { CommunityPost, EVClub, PostCategory } from '@/lib/types'

export type CommunitySort = 'latest' | 'popular' | 'trending'

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
  }
}
