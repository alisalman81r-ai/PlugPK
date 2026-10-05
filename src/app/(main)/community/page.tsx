// src/app/(main)/community/page.tsx
import type { Metadata } from 'next'

import { CommunityPageClient } from '@/components/community/CommunityPageClient'
import { readOrFallback } from '@/lib/db/availability'
import {
  getCommunityClubs,
  getCommunityFigures,
  getFeedPage,
  getTopPosts,
  type CommunityFigures,
  type FeedPage,
} from '@/lib/db/community-queries'
import type { CommunityPost, EVClub } from '@/lib/types'

/**
 * The board reads: orient, choose what to read, read it.
 *
 * Laid out on the map page's shape — one dark band, one measure down the page,
 * and the browse card lifted up into the band (see CommunityPageClient).
 *
 * ── What it loads ─────────────────────────────────────────────────────
 *
 * One page of post summaries, not the board. This used to be force-dynamic
 * and fetched every post with its full body on every visit to render six of
 * them. Now the server sends the first page, the browser asks for more from a
 * cursor, and filtering and search run in the database (loadPosts).
 *
 * ── Why it can be cached ──────────────────────────────────────────────
 *
 * Nothing here depends on who is looking: which hearts are filled is asked
 * after render (getMyLikedPostIds). Posting and commenting revalidate this
 * path; the interval only catches like counts, which move without one.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'EV Community',
  description:
    'Questions, trip reports and charging notes from EV drivers in Pakistan. Read without an account; sign in to post, comment and like.',
  alternates: { canonical: '/community' },
  openGraph: {
    title: 'Plug.pk EV Community',
    description: 'Questions, trip reports and charging notes from EV drivers in Pakistan.',
    url: '/community',
    type: 'website',
  },
}

const EMPTY_FIGURES: CommunityFigures = {
  discussions: 0,
  replies: 0,
  clubs: 0,
  cities: 0,
  clubMembers: 0,
  byCategory: { all: 0 },
}

export default async function CommunityPage() {
  const [page, figures, topPosts, clubs] = await Promise.all([
    readOrFallback<FeedPage>('/community feed', { posts: [], nextCursor: null, total: 0 }, () =>
      getFeedPage(),
    ),
    readOrFallback('/community figures', EMPTY_FIGURES, getCommunityFigures),
    readOrFallback('/community top posts', [] as CommunityPost[], () => getTopPosts(5)),
    readOrFallback('/community clubs', [] as EVClub[], () => getCommunityClubs()),
  ])

  const { byCategory, ...stats } = figures

  return (
    <CommunityPageClient
      initial={{
        posts: page.posts,
        nextCursor: page.nextCursor,
        categoryCount: byCategory,
        stats,
      }}
      topPosts={topPosts}
      clubs={clubs}
    />
  )
}
