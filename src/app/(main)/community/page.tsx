// src/app/community/page.tsx
'use client'

import { useState } from 'react'

import { FaqSection } from '@/components/shared/FaqSection'
import { COMMUNITY_FAQS } from '@/lib/faqs'

import { CategoryTabs } from '@/components/community/CategoryTabs'
import { CommunityHero } from '@/components/community/CommunityHero'
import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { PostFeed } from '@/components/community/PostFeed'
import { useCommunity } from '@/hooks/useCommunity'

export default function CommunityPage() {
  const {
    filteredPosts,
    posts,
    clubs,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    likedPosts,
    toggleLike,
    likeCountFor,
    categoryCount,
    featuredPost,
  } = useCommunity()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const topPosts = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5)

  return (
    <>
      <CommunityHero
        totalMembers={5000}
        totalPosts={1200}
        featuredPost={featuredPost}
        onCreatePost={() => setIsCreateOpen(true)}
      />

      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCount={categoryCount}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="container-plug py-10 pb-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <PostFeed
              posts={filteredPosts}
              isLoading={isLoading}
              likedPosts={likedPosts}
              onLike={toggleLike}
              likeCountFor={likeCountFor}
              selectedCategory={selectedCategory}
              onCreatePost={() => setIsCreateOpen(true)}
            />
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <CommunitySidebar clubs={clubs.slice(0, 4)} topPosts={topPosts} />
          </aside>
        </div>
      </div>

      <FaqSection items={COMMUNITY_FAQS} />

      <CreatePostForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  )
}
