// src/lib/db/community-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { COMMUNITY_LIMITS } from '@/lib/constants'
import type { Comment, PostCategory } from '@/lib/types'
import { checkText } from '@/lib/validate'

import { prisma } from './client'
import {
  getComments,
  getFeedPage,
  getLikedPostIds,
  type FeedPage,
  type FeedSort,
} from './community-queries'
import { checkLimits, retryMessage } from './rate-limit'
import { getSessionUserId } from './session'
import { getCurrentProfile } from './session-actions'

/**
 * Writing to the community, and the reads the board makes after first paint.
 *
 * ── One account, checked on the server ────────────────────────────────
 *
 * Every write reads the session itself rather than taking a user id from the
 * caller. A server action is a POST endpoint that anything reaching its id can
 * call, so an author passed in from the browser is an author anybody can claim
 * to be. The name and avatar stored on the row come from the database record
 * of whoever is signed in, never from the form.
 *
 * ── Limits ────────────────────────────────────────────────────────────
 *
 * Lengths come from COMMUNITY_LIMITS, which the composer reads too, and are
 * checked here with checkText because maxlength in the browser binds nobody
 * who calls the action directly. Posting, commenting and liking are rate
 * limited per account: generous for a person, useless for a script.
 *
 * ── Why the author's name is copied onto the row ──────────────────────
 *
 * CommunityPost and Comment carry userName and userAvatar as plain columns
 * beside userId, which is denormalisation and deliberate — it predates this
 * file. A post keeps the name it was written under, and the feed renders
 * without joining every row back to User. The cost is that renaming an
 * account does not rename its old posts.
 */

export interface CommunityResult {
  ok: boolean
  message?: string
  /** Set on a successful post, so the caller can navigate to it. */
  slug?: string
}

const CATEGORIES: readonly PostCategory[] = [
  'general',
  'charging-experience',
  'trip-report',
  'vehicle-review',
  'buying-advice',
  'ev-news',
]

const SORTS: readonly FeedSort[] = ['latest', 'popular', 'trending']

const HOUR = 60 * 60

/** Matches the slug shape used by cars and services. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

/**
 * A slug nothing else is using.
 *
 * Two posts titled "Charging on the motorway" are entirely likely, and the
 * column is unique, so the second insert would fail on a constraint the author
 * cannot see or fix. Suffixing is checked against the database rather than
 * assumed, and gives up after a few tries rather than looping.
 */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || 'post'

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const taken = await prisma.communityPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
  }

  // Random tail rather than a failure: the author's post matters more than a
  // tidy URL, and a collision on a UUID fragment is not going to happen.
  return `${base}-${randomUUID().slice(0, 8)}`
}

function revalidateCommunity(slug?: string) {
  revalidatePath('/')
  revalidatePath('/community')
  if (slug) revalidatePath(`/community/post/${slug}`)
}

/**
 * Publishes a post under the signed-in account.
 */
export async function createPost(form: FormData): Promise<CommunityResult> {
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, message: 'Sign in to post.' }

  const title = checkText(form.get('title'), 'a title', {
    max: COMMUNITY_LIMITS.title,
    required: true,
  })
  if (!title.ok) return title
  const content = checkText(form.get('content'), 'your post', {
    max: COMMUNITY_LIMITS.content,
    required: true,
  })
  if (!content.ok) return content

  const category = String(form.get('category') ?? '').trim()
  /*
    Checked against the list rather than cast. `category` is a plain string
    column, so an unrecognised value would be stored happily and then filter
    into nothing — a post that exists and can never be found.
  */
  if (!CATEGORIES.includes(category as PostCategory)) {
    return { ok: false, message: 'Choose a category.' }
  }

  // After validation, so a too-long title does not spend one of the five.
  const limit = await checkLimits([
    { key: `post:user:${profile.id}`, limit: 5, windowSeconds: HOUR },
  ])
  if (!limit.allowed) {
    return {
      ok: false,
      message: retryMessage(limit.retryAfterSeconds, 'You have posted several times this hour'),
    }
  }

  const slug = await uniqueSlug(title.value)

  await prisma.communityPost.create({
    data: {
      id: randomUUID(),
      slug,
      userId: profile.id,
      userName: profile.name,
      userAvatar: profile.avatar,
      userVehicle: profile.vehicle,
      title: title.value,
      content: content.value,
      category,
    },
  })

  revalidateCommunity(slug)
  return { ok: true, slug }
}

/**
 * Adds a comment, and keeps the post's counter honest.
 *
 * The insert and the increment run in one transaction. commentCount is a
 * stored column that the feed renders without counting rows, so a comment
 * saved while the increment failed would leave every list quietly one short.
 */
export async function createComment(postId: string, content: string): Promise<CommunityResult> {
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, message: 'Sign in to comment.' }

  const body = checkText(content, 'a comment', { max: COMMUNITY_LIMITS.comment, required: true })
  if (!body.ok) return body

  const post = await prisma.communityPost.findUnique({
    where: { id: String(postId) },
    select: { id: true, slug: true },
  })
  if (!post) return { ok: false, message: 'That post no longer exists.' }

  const limit = await checkLimits([
    { key: `comment:user:${profile.id}`, limit: 30, windowSeconds: HOUR },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many comments') }
  }

  await prisma.$transaction([
    prisma.comment.create({
      data: {
        id: randomUUID(),
        postId: post.id,
        userId: profile.id,
        userName: profile.name,
        userAvatar: profile.avatar,
        content: body.value,
      },
    }),
    prisma.communityPost.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    }),
  ])

  revalidateCommunity(post.slug)
  return { ok: true, slug: post.slug }
}

export interface LikeResult {
  ok: boolean
  message?: string
  /** Whether the account likes the post now. */
  liked?: boolean
  /** The stored count after the change, for the button to settle on. */
  likeCount?: number
}

/**
 * Likes a post, or takes the like back.
 *
 * Likes used to be a Set in React state: the heart filled, the count went up
 * by one, and a reload put both back. Now a like is a PostLike row keyed on
 * (post, user), so one account can like a post once, and likeCount moves in
 * the same transaction as the row so the stored figure the feed sorts on can
 * never drift from the rows behind it.
 *
 * The toggle is decided inside the transaction by trying the delete first:
 * a row removed means it was liked, nothing removed means it was not. Reading
 * first and writing second would let two quick taps both see "not liked" and
 * both try to insert.
 */
export async function togglePostLike(postId: string): Promise<LikeResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to like posts.' }

  const id = String(postId)
  const exists = await prisma.communityPost.findUnique({ where: { id }, select: { slug: true } })
  if (!exists) return { ok: false, message: 'That post no longer exists.' }

  const limit = await checkLimits([
    { key: `like:user:${userId}`, limit: 120, windowSeconds: HOUR },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many likes') }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const removed = await tx.postLike.deleteMany({ where: { postId: id, userId } })
      const liked = removed.count === 0
      if (liked) await tx.postLike.create({ data: { postId: id, userId } })

      // The column is kept moving for bookkeeping, but what goes back to the
      // page is the number of PostLike rows. Seeded posts carry stored counts
      // with no rows behind them, so the column cannot be what is shown.
      await tx.communityPost.update({
        where: { id },
        data: { likeCount: liked ? { increment: 1 } : { decrement: 1 } },
        select: { id: true },
      })
      const likeCount = await tx.postLike.count({ where: { postId: id } })
      return { liked, likeCount }
    })

    // The post page is statically rendered and prints the count; the board
    // regenerates on its own short interval, so it is left alone here.
    revalidatePath(`/community/post/${exists.slug}`)
    return { ok: true, ...result }
  } catch (error) {
    // A second tab inserting the same like between our delete and create.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'That like was already saved. Refresh to see it.' }
    }
    throw error
  }
}

/**
 * Which of these posts the signed-in account has liked.
 *
 * Asked from the browser after the page renders, so the board and the post
 * page can stay cached and shared — one cached page cannot know whose heart to
 * fill. Signed out, the answer is simply none.
 */
export async function getMyLikedPostIds(postIds: string[]): Promise<string[]> {
  const userId = await getSessionUserId()
  if (!userId || !Array.isArray(postIds)) return []
  return getLikedPostIds(userId, postIds.map(String))
}

export interface LoadPostsInput {
  cursor?: string | null
  category?: PostCategory | 'all'
  sort?: FeedSort
  query?: string
}

/**
 * A page of the board, for "Load more" and for changing filters.
 *
 * A read, but a server action all the same so the board does not need an API
 * route of its own. Every argument is re-checked: they arrive from the
 * network, whatever the type says.
 */
export async function loadPosts(input: LoadPostsInput): Promise<FeedPage> {
  const category =
    input.category && CATEGORIES.includes(input.category as PostCategory)
      ? (input.category as PostCategory)
      : 'all'
  const sort = input.sort && SORTS.includes(input.sort) ? input.sort : 'latest'
  const query = typeof input.query === 'string' ? input.query.slice(0, 100) : ''
  const cursor = typeof input.cursor === 'string' && input.cursor ? input.cursor : null

  try {
    return await getFeedPage({ cursor, category, sort, query })
  } catch (error) {
    // A cursor that points at a post deleted since the page loaded: start the
    // list again rather than failing the button.
    if (cursor && error instanceof Prisma.PrismaClientKnownRequestError) {
      return getFeedPage({ category, sort, query })
    }
    throw error
  }
}

/** The next page of comments on a post. */
export async function loadComments(
  postId: string,
  cursor: string | null,
): Promise<{ comments: Comment[]; nextCursor: string | null }> {
  return getComments(String(postId), typeof cursor === 'string' && cursor ? cursor : null)
}

// ─── Clubs ──────────────────────────────────────────────

export interface ClubResult {
  ok: boolean
  joined: boolean
  message?: string
}

/**
 * Joins a club — free, for any signed-in account.
 *
 * createMany with skipDuplicates against the (clubId, userId) unique index,
 * so a double click or two tabs leave one membership and never an error.
 */
export async function joinClub(clubId: string): Promise<ClubResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, joined: false, message: 'Sign in to join a club.' }
  if (typeof clubId !== 'string' || !clubId || clubId.length > 100) {
    return { ok: false, joined: false, message: 'That club could not be found.' }
  }

  const limit = await checkLimits([{ key: `club:user:${userId}`, limit: 30, windowSeconds: 60 * 60 }])
  if (!limit.allowed) return { ok: false, joined: false, message: retryMessage(limit.retryAfterSeconds) }

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } })
  if (!club) return { ok: false, joined: false, message: 'That club could not be found.' }

  await prisma.clubMember.createMany({
    data: [{ id: randomUUID(), clubId, userId }],
    skipDuplicates: true,
  })

  revalidatePath('/community/clubs')
  revalidatePath('/community')
  return { ok: true, joined: true }
}

/** Leaves a club. Leaving one you are not in is a no-op, not an error. */
export async function leaveClub(clubId: string): Promise<ClubResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, joined: false, message: 'Sign in to manage your clubs.' }
  if (typeof clubId !== 'string' || !clubId || clubId.length > 100) {
    return { ok: false, joined: false, message: 'That club could not be found.' }
  }

  const limit = await checkLimits([{ key: `club:user:${userId}`, limit: 30, windowSeconds: 60 * 60 }])
  if (!limit.allowed) return { ok: false, joined: true, message: retryMessage(limit.retryAfterSeconds) }

  await prisma.clubMember.deleteMany({ where: { clubId, userId } })

  revalidatePath('/community/clubs')
  revalidatePath('/community')
  return { ok: true, joined: false }
}
