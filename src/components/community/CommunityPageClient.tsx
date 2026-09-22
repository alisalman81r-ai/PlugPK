'use client'

import { useMemo, useState } from 'react'

import { FaqSection } from '@/components/shared/FaqSection'
import { COMMUNITY_FAQS } from '@/lib/faqs'
import type { CommunityPost } from '@/lib/types'

import { CategoryTabs } from '@/components/community/CategoryTabs'
import { CommunityHero } from '@/components/community/CommunityHero'
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar'
import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { PostFeed } from '@/components/community/PostFeed'
import { useCommunity } from '@/hooks/useCommunity'

const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export function CommunityPageClient({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const {
    filteredPosts,
    posts,
    clubs,
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
    featuredPost,
    stats,
  } = useCommunity(initialPosts)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const topPosts = useMemo(
    () => [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5),
    [posts],
  )

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
              resultCount={filteredPosts.length}
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
            resultCount={filteredPosts.length}
            totalCount={posts.length}
          />
        </div>

        <div className={`${STAGE} pb-20 pt-10 lg:pt-12`}>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0">
              <PostFeed
                posts={filteredPosts}
                isLoading={isLoading}
                likedPosts={likedPosts}
                onLike={toggleLike}
                likeCountFor={likeCountFor}
                selectedCategory={selectedCategory}
                onCreatePost={() => setIsCreateOpen(true)}
                featuredPostId={featuredPost?.id}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
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
