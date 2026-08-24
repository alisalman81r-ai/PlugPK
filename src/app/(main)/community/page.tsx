// src/app/(main)/community/page.tsx
'use client'

import { useMemo, useState } from 'react'

import { FaqSection } from '@/components/shared/FaqSection'
import { COMMUNITY_FAQS } from '@/lib/faqs'

import { CategoryTabs } from '@/components/community/CategoryTabs'
import { CommunityHero } from '@/components/community/CommunityHero'
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar'
import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { PostFeed } from '@/components/community/PostFeed'
import { useCommunity } from '@/hooks/useCommunity'

/**
 * The board reads: orient, choose what to read, read it.
 *
 * It used to sit outside the shape the rest of the site had settled on. The
 * hero was a two-column block on the old navy-to-teal gradient with a floating
 * card duplicating the top post; below it a full-bleed sticky bar of tabs; below
 * that a 1280px column while /map and /routes both work to 1400px. Three
 * different treatments of the same three ideas.
 *
 * Now it is the map page's shape, for the same reasons: one dark band, one
 * measure down the page, and the card the reader needs first lifted up into the
 * band so it reads as the thing the page is for rather than the next section
 * down. The card here is the browse control — categories, sort, and the count
 * they produce — exactly where the map keeps its filter rail.
 */

/** One measure, matching /map and /routes, so the pages line up edge for edge. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * How far the browse card is pulled up into the dark band above it.
 *
 * Less than the map's -mt-32: this card is roughly half the height of a map
 * canvas, and a lift that clears its own height floats the whole thing inside
 * the band with nothing anchoring it to the page. The hero's bottom padding is
 * set against this, so 3rem of dark always shows between the figures and the
 * card's top edge — the same gap /map leaves.
 */
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export default function CommunityPage() {
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
  } = useCommunity()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  /**
   * The sidebar's trending list is the five most-liked posts on the board, not
   * the five most-liked in view. It is a way *out* of the current filter, so it
   * has to keep showing what the filter is hiding.
   */
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

        {/* ── Browse, lifted into the band ──────────────────────────
            The categories, the sort and the count they produce, in one card on
            the page's measure — the same object the map page calls its filter
            rail. */}
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

        {/* ── The feed ─────────────────────────────────────────────── */}
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

            {/* top-24 clears the fixed navbar; hidden below lg, where the same
                panels stacked would put four cards between the last post and
                the FAQ. */}
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
