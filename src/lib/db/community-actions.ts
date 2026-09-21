// src/lib/db/community-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import type { PostCategory } from '@/lib/types'

import { prisma } from './client'
import { getCurrentProfile } from './session-actions'

/**
 * Writing to the community — the half that was missing.
 *
 * ── What this replaced ────────────────────────────────────────────────
 *
 * Nothing. There was no create-post action and no create-comment action at
 * all. CreatePostForm called an `onSubmit` callback that the community page
 * never passed, and CommentSection's submit handler cleared the textarea and
 * returned. So a signed-in member could fill either form, press the button,
 * watch it succeed, and lose what they wrote — the worst shape a form can
 * have, because it is indistinguishable from working until you reload.
 *
 * ── One account, checked on the server ────────────────────────────────
 *
 * Both actions read the session themselves rather than taking a user id from
 * the caller. A server action is a POST endpoint that anything reaching its
 * id can call, so an author passed in from the browser is an author anybody
 * can claim to be. The name and avatar stored on the row come from the
 * database record of whoever is signed in, never from the form.
 *
 * ── Why the author's name is copied onto the row ──────────────────────
 *
 * CommunityPost and Comment carry userName and userAvatar as plain columns
 * beside userId, which is denormalisation and deliberate — it predates this
 * file. A post keeps the name it was written under, and the feed renders
 * without joining every row back to User. The cost is that renaming an
 * account does not rename its old posts. That is the existing bargain here;
 * changing it is a migration, not a new action.
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

const TITLE_MAX = 140
const CONTENT_MAX = 10_000
const COMMENT_MAX = 2_000

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
 * assumed, and gives up after a few tries rather than looping — at that point
 * something is wrong that a longer loop will not solve.
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

  const title = String(form.get('title') ?? '').trim()
  const content = String(form.get('content') ?? '').trim()
  const category = String(form.get('category') ?? '').trim()

  if (!title) return { ok: false, message: 'Give your post a title.' }
  if (!content) return { ok: false, message: 'Write something first.' }
  if (title.length > TITLE_MAX) {
    return { ok: false, message: `Titles are capped at ${TITLE_MAX} characters.` }
  }
  if (content.length > CONTENT_MAX) {
    return { ok: false, message: 'That post is too long.' }
  }
  /*
    Checked against the list rather than cast. `category` is a plain string
    column, so an unrecognised value would be stored happily and then filter
    into nothing — a post that exists and can never be found.
  */
  if (!CATEGORIES.includes(category as PostCategory)) {
    return { ok: false, message: 'Choose a category.' }
  }

  const slug = await uniqueSlug(title)

  await prisma.communityPost.create({
    data: {
      id: randomUUID(),
      slug,
      userId: profile.id,
      userName: profile.name,
      userAvatar: profile.avatar,
      userVehicle: profile.vehicle,
      title,
      content,
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
 * saved while the increment failed would leave every list quietly one short —
 * and nothing would ever notice, because nothing recounts.
 */
export async function createComment(
  postId: string,
  content: string,
): Promise<CommunityResult> {
  const profile = await getCurrentProfile()
  if (!profile) return { ok: false, message: 'Sign in to comment.' }

  const body = content.trim()
  if (!body) return { ok: false, message: 'Write something first.' }
  if (body.length > COMMENT_MAX) return { ok: false, message: 'That comment is too long.' }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { slug: true },
  })
  if (!post) return { ok: false, message: 'That post no longer exists.' }

  await prisma.$transaction([
    prisma.comment.create({
      data: {
        id: randomUUID(),
        postId,
        userId: profile.id,
        userName: profile.name,
        userAvatar: profile.avatar,
        content: body,
      },
    }),
    prisma.communityPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ])

  revalidateCommunity(post.slug)
  return { ok: true, slug: post.slug }
}
