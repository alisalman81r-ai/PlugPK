'use client'

import { useEffect, useState } from 'react'

import { HelpCircle } from '@/components/ui/icons'
import { Faq, Hl, SectionHead, WRAP } from '@/components/v2/ui'
import { COMMUNITY_FAQS } from '@/lib/faqs'
import type { CommunityPost, EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'

import { CategoryTabs } from '@/components/community/CategoryTabs'
import { CommunityHero } from '@/components/community/CommunityHero'
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar'
import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { PostFeed } from '@/components/community/PostFeed'
import { useCommunity, type CommunityInitialData } from '@/hooks/useCommunity'

/*
  landing-v2's community page: the ink hero, the browse sheet lifted into it,
  the feed with its sidebar on chalk, then the FAQ.
*/

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
      <div className="bg-chalk">
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

        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCount={categoryCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={resultCount}
          totalCount={totalPosts}
        />

        <section
          id="feed"
          aria-label="Discussion feed"
          data-theme="light"
          className="pb-[clamp(56px,6vw,88px)] pt-[clamp(40px,4.5vw,64px)]"
        >
          <div
            className={cn(
              WRAP,
              'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-7',
            )}
          >
            <div className="min-w-0">
              {likeMessage ? (
                <p
                  role="status"
                  className="mb-4 rounded-2xl border border-[#FFE0A3] bg-[#FFF6E3] px-4 py-3 text-sm text-[#8A5300]"
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
            <aside aria-label="About the board" className="lg:sticky lg:top-[104px]">
              <CommunitySidebar clubs={clubs.slice(0, 4)} topPosts={topPosts} stats={stats} />
            </aside>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="community-faq"
        data-theme="light"
        className="bg-chalk pb-[clamp(56px,6vw,88px)] pt-[clamp(48px,6vw,88px)]"
      >
        <div className={WRAP}>
          <SectionHead
            className="mb-[clamp(32px,4vw,52px)]"
            eyebrow={
              <>
                <HelpCircle size={12} aria-hidden="true" />
                FAQ
              </>
            }
            title={
              <span id="community-faq">
                Common questions about <Hl>the community</Hl>
              </span>
            }
          />
          <Faq items={COMMUNITY_FAQS.map((item) => ({ q: item.question, a: item.answer }))} />
        </div>
      </section>
      <CreatePostForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  )
}
