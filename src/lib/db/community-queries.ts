// src/lib/db/community-queries.ts
import 'server-only'

import type { Prisma } from '@prisma/client'

import type { Comment, CommunityPost, EVClub, PostCategory } from '@/lib/types'

import { prisma } from './client'
import { countActiveMembers, listActiveMembershipIds } from './membership'
import { toComment, toPost } from './serialize'

/**
 * The community's reads, sized to what each page actually shows.
 *
 * ── Why this is not queries.ts ────────────────────────────────────────
 *
 * The board and the post page used to call getPosts(), which returns every
 * post with its full body. /community rendered all of them to show six, and
 * the post page loaded the whole board to pick three related posts out of it.
 * Fine at twelve posts; a full table scan per visit once people actually use
 * the board. Everything here is bounded: a page of summaries behind a cursor,
 * a post with its first comments, three related posts by category.
 */

export const FEED_PAGE_SIZE = 10
export const COMMENT_PAGE_SIZE = 20

/** How much of a post's body a feed card carries. Cards clamp to three lines. */
const EXCERPT_LENGTH = 320

export type FeedSort = 'latest' | 'popular' | 'trending'

export interface FeedQuery {
  cursor?: string | null
  category?: PostCategory | 'all'
  sort?: FeedSort
  /** Free text, matched against title, body and author. */
  query?: string
  take?: number
}

export interface FeedPage {
  posts: CommunityPost[]
  /** The id to continue from, or null when this page reached the end. */
  nextCursor: string | null
  /** Posts matching the filters altogether, not just on this page. */
  total: number
}

/**
 * Columns a card needs. Photos are kept for the cover; comments are not.
 *
 * ── Counts are counted, not read ──────────────────────────────────────
 *
 * CommunityPost.likeCount and commentCount are stored columns, and the seeded
 * posts carry like counts (47, 32, …) with no PostLike row behind any of them
 * — figures nobody can source. So nothing displayed reads those columns:
 * `_count` counts the PostLike and Comment rows that actually exist, and
 * withRealCounts() puts those numbers in their place. The columns are still
 * kept in step by the actions, but they are bookkeeping, not what is shown.
 */
const COUNTS = { _count: { select: { likes: true, comments: true } } } as const

const SUMMARY_SELECT = {
  id: true,
  slug: true,
  userId: true,
  userName: true,
  userAvatar: true,
  userVehicle: true,
  title: true,
  content: true,
  category: true,
  photos: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
  adminViewedAt: true,
  ...COUNTS,
} satisfies Prisma.CommunityPostSelect

/** A post with its like and comment counts replaced by the real row counts. */
function withRealCounts(post: CommunityPost, counts: { likes: number; comments: number }): CommunityPost {
  return { ...post, likeCount: counts.likes, commentCount: counts.comments }
}

/**
 * A card's worth of post.
 *
 * The body is cut to an excerpt here, on the server, so the full text of every
 * post never crosses the wire to a page that clamps it to three lines. The
 * type stays CommunityPost so PostCard and the sidebar need no second shape;
 * `content` on a feed post is a summary, and the post page reads its own.
 */
function toSummary(row: Prisma.CommunityPostGetPayload<{ select: typeof SUMMARY_SELECT }>): CommunityPost {
  const post = withRealCounts(toPost(row), row._count)
  return post.content.length > EXCERPT_LENGTH
    ? { ...post, content: `${post.content.slice(0, EXCERPT_LENGTH).trimEnd()}…` }
    : post
}

function orderFor(sort: FeedSort): Prisma.CommunityPostOrderByWithRelationInput[] {
  // id last on every order: a cursor needs a total order, and two posts with
  // the same like count would otherwise swap between pages.
  switch (sort) {
    case 'popular':
      // By the real counts, not the stored columns — see COUNTS.
      return [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }]
    case 'trending':
      return [{ comments: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }]
    case 'latest':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }]
  }
}

function whereFor(category: PostCategory | 'all', query: string): Prisma.CommunityPostWhereInput {
  const text = query.trim().slice(0, 100)
  return {
    ...(category !== 'all' ? { category } : {}),
    ...(text
      ? {
          OR: [
            { title: { contains: text, mode: 'insensitive' } },
            { content: { contains: text, mode: 'insensitive' } },
            { userName: { contains: text, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

/** One page of the board, filtered and sorted in the database. */
export async function getFeedPage({
  cursor = null,
  category = 'all',
  sort = 'latest',
  query = '',
  take = FEED_PAGE_SIZE,
}: FeedQuery = {}): Promise<FeedPage> {
  const where = whereFor(category, query)
  const size = Math.min(Math.max(take, 1), 30)

  const [rows, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      orderBy: orderFor(sort),
      select: SUMMARY_SELECT,
      // One extra row says whether there is a next page without a second count.
      take: size + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.communityPost.count({ where }),
  ])

  const hasMore = rows.length > size
  const page = hasMore ? rows.slice(0, size) : rows
  return {
    posts: page.map(toSummary),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    total,
  }
}

/** The most-liked posts, for the sidebar's ranking. */
export async function getTopPosts(take = 5): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany({
    orderBy: orderFor('popular'),
    select: SUMMARY_SELECT,
    take,
  })
  return rows.map(toSummary)
}

/** The newest posts, for the home page's community card. */
export async function getLatestPosts(take = 2): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany({
    orderBy: orderFor('latest'),
    select: SUMMARY_SELECT,
    take,
  })
  return rows.map(toSummary)
}

/**
 * One post in full, with its first page of comments.
 *
 * Comments are oldest first, as a conversation reads, and capped: the rest
 * are fetched on demand by getComments when somebody asks for them.
 */
export async function getPostPage(slug: string): Promise<CommunityPost | null> {
  const row = await prisma.communityPost.findUnique({
    where: { slug },
    include: {
      comments: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: COMMENT_PAGE_SIZE,
      },
      ...COUNTS,
    },
  })
  return row ? withRealCounts(toPost(row), row._count) : null
}

/** The comments after `cursor`, oldest first. */
export async function getComments(
  postId: string,
  cursor: string | null,
  take = COMMENT_PAGE_SIZE,
): Promise<{ comments: Comment[]; nextCursor: string | null }> {
  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const hasMore = rows.length > take
  const page = hasMore ? rows.slice(0, take) : rows
  return {
    comments: page.map(toComment),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  }
}

/** Up to three other posts in the same category, newest first. */
export async function getRelatedPosts(
  postId: string,
  category: PostCategory,
  take = 3,
): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany({
    where: { category, id: { not: postId } },
    orderBy: orderFor('latest'),
    select: SUMMARY_SELECT,
    take,
  })
  return rows.map(toSummary)
}

/** Which of these posts the account has liked. */
export async function getLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (postIds.length === 0) return []
  const rows = await prisma.postLike.findMany({
    where: { userId, postId: { in: postIds.slice(0, 200) } },
    select: { postId: true },
  })
  return rows.map((row) => row.postId)
}

/**
 * The clubs, with members counted rather than remembered.
 *
 * ── Why the stored memberCount is ignored ─────────────────────────────
 *
 * Club.memberCount holds seeded "baseline" totals (234, 178, …) that schema
 * comments call historical. Nothing in the repository records where they came
 * from — no join table predates them, no import carries them — so on the
 * project's own rule they cannot be printed. queries.ts getClubs() still adds
 * them on; this does not.
 *
 * What is counted instead is active Membership rows, not ClubMember: per
 * membership.ts, Membership is the only table that decides who is in a club
 * (it knows whether the payment behind a join was confirmed), and ClubMember
 * is read by nothing. Today that count is honestly zero for every club, and
 * the pages say so rather than inventing a crowd.
 */
export async function getCommunityClubs(userId?: string): Promise<EVClub[]> {
  const [rows, memberCounts, joined] = await Promise.all([
    prisma.club.findMany({ orderBy: [{ name: 'asc' }] }),
    countActiveMembers('club'),
    listActiveMembershipIds(userId, 'club'),
  ])

  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      description: row.description,
      coverPhoto: row.coverPhoto ?? undefined,
      memberCount: memberCounts.get(row.id) ?? 0,
      isJoined: joined.has(row.id),
    }))
    .sort((a, b) => b.memberCount - a.memberCount)
}

export interface CommunityFigures {
  /** Posts on the board. */
  discussions: number
  /** Replies across every post. */
  replies: number
  /** Clubs in the directory. */
  clubs: number
  /** Cities with at least one club. */
  cities: number
  /** Active club members, counted — see getCommunityClubs. */
  clubMembers: number
  /** Posts per category, plus `all`. */
  byCategory: Record<string, number>
}

/** The figures the community pages print, all counted from rows. */
export async function getCommunityFigures(): Promise<CommunityFigures> {
  const [discussions, replies, clubs, memberCounts, groups] = await Promise.all([
    prisma.communityPost.count(),
    prisma.comment.count(),
    prisma.club.findMany({ select: { city: true } }),
    countActiveMembers('club'),
    prisma.communityPost.groupBy({ by: ['category'], _count: { _all: true } }),
  ])

  const byCategory: Record<string, number> = { all: discussions }
  for (const group of groups) byCategory[group.category] = group._count._all

  return {
    discussions,
    replies,
    clubs: clubs.length,
    cities: new Set(clubs.map((club) => club.city)).size,
    clubMembers: Array.from(memberCounts.values()).reduce((sum, n) => sum + n, 0),
    byCategory,
  }
}

/** For generateStaticParams. Slugs only. */
export async function getPostSlugList(): Promise<string[]> {
  const rows = await prisma.communityPost.findMany({ select: { slug: true } })
  return rows.map((row) => row.slug)
}
