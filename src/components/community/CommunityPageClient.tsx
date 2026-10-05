'use client'

import { useEffect, useState } from 'react'

import { FaqSection } from '@/components/shared/FaqSection'
import { COMMUNITY_FAQS } from '@/lib/faqs'
import type { CommunityPost, EVClub } from '@/lib/types'

import { CategoryTabs } from '@/components/community/CategoryTabs'
import { CommunityHero } from '@/components/community/CommunityHero'
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar'
import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { PostFeed } from '@/components/community/PostFeed'
import { useCommunity, type CommunityInitialData } from '@/hooks/useCommunity'

const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export interface CommunityPageClientProps {
  initial: CommunityInitialData
  /** The most-liked posts on the whole board, for the sidebar and the badge. */
  topPosts: CommunityPost[]
  clubs: EVClub[]
}

export function CommunityPageClient({ initial, topPosts, clubs }: CommunityPageClientProps) {
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
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
    totalPosts,
    stats,
  } = useCommunity(initial)

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  /*
    Back from signing in with ?compose=1: reopen the composer, which restores
    the draft it kept. Read from window rather than useSearchParams so the page
    can stay statically rendered, then dropped from the address bar so a
    reload does not reopen it.
  */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('compose') !== '1') return
    setIsCreateOpen(true)
    params.delete('compose')
    const rest = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`)
  }, [])

  return (
    <>
      <div className="min-h-below-nav bg-slate-50">
        <CommunityHero
          stats={stats}
          onCreatePost={() => setIsCreateOpen(true)}
          search={
            <CommunitySearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              resultCount={resultCount}
            />
          }
        />

        <div className={`relative z-10 ${CARD_LIFT} ${STAGE}`}>
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryCount={categoryCount}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={resultCount}
            totalCount={totalPosts}
          />
        </div>

        <div className={`${STAGE} pb-20 pt-10 lg:pt-12`}>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0">
              {likeMessage ? (
                <p
                  role="status"
                  className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-ui-sm text-amber-800"
                >
                  {likeMessage}
                </p>
              ) : null}
              <PostFeed
                posts={posts}
                isLoading={isLoading}
                likedPosts={likedPosts}
                onLike={toggleLike}
                likeCountFor={likeCountFor}
                selectedCategory={selectedCategory}
                onCreatePost={() => setIsCreateOpen(true)}
                // Nothing is "most liked" on a board where nothing is liked.
                featuredPostId={topPosts[0] && topPosts[0].likeCount > 0 ? topPosts[0].id : undefined}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore}
                remaining={Math.max(0, resultCount - posts.length)}
                error={loadError}
              />
            </div>
            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <CommunitySidebar clubs={clubs.slice(0, 4)} topPosts={topPosts} stats={stats} />
            </aside>
          </div>
        </div>
      </div>

      <FaqSection items={COMMUNITY_FAQS} title="Common questions about the community" />
      <CreatePostForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  )
}
