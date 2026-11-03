// src/app/(main)/community/post/[slug]/page.tsx
import { ArrowLeft, Clock } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CATEGORY_AVATAR } from '@/components/community/category-tone'
import { CommentSection } from '@/components/community/CommentSection'
import { PostActions } from '@/components/community/PostActions'
import { Avatar, CategoryTag, PostCard } from '@/components/community/PostCard'
import { PageHero, WRAP } from '@/components/v2/ui'
import { SITE_CONFIG } from '@/lib/constants'
import { prebuiltParams } from '@/lib/db/build-params'
import { getPostPage, getPostSlugList, getRelatedPosts } from '@/lib/db/community-queries'
import { cn, formatDate } from '@/lib/utils'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return prebuiltParams('/community/post/[slug]', async () => {
    const slugs = await getPostSlugList()
    return slugs.map((slug) => ({ slug }))
  })
}

/** One line of the post, for search results and link previews. */
function describe(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim()
  return flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}…` : flat
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostPage(params.slug)
  if (!post) return { title: 'Post Not Found' }

  const path = `/community/post/${post.slug}`
  const description = describe(post.content)

  return {
    // `absolute` bypasses the root layout's '%s | plugpk' template, which
    // would otherwise render "... | plugpk Community | plugpk".
    title: { absolute: `${post.title} | plugpk Community` },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: post.title,
      description,
      siteName: SITE_CONFIG.name,
      publishedTime: post.createdAt,
      authors: [post.userName],
      ...(post.photos?.[0] ? { images: [{ url: post.photos[0] }] } : {}),
    },
  }
}

/** .sbox: a white card in the sidebar. */
const SBOX = 'rounded-[26px] border border-ink/10 bg-white px-5 pb-4 pt-5 shadow-e1'

/**
 * One discussion, in the community's landing-v2 language: the ink hero carries
 * the title and who wrote it; the post, its actions and the thread sit on a
 * white card lifted into the hero, with the author and related posts beside it.
 * A reader's title is not split for a volt phrase — the words are theirs.
 */
export default async function CommunityPostPage({ params }: PageProps) {
  const post = await getPostPage(params.slug)
  if (!post) notFound()

  // Three by category from the database, rather than loading the whole board.
  const related = await getRelatedPosts(post.id, post.category, 3)

  return (
    <div className="bg-chalk pb-[clamp(56px,6vw,96px)]">
      <PageHero
        eyebrow={
          <Link
            href="/community"
            aria-label="Back to the community"
            className="group/back -my-3 inline-flex min-h-11 items-center gap-2 rounded-full transition-colors hover:text-white"
            >
              <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-300 group-hover/back:-translate-x-0.5" />
              Community
            </Link>
        }
        title={<span className="block text-[clamp(32px,4.2vw,60px)] leading-[1.06]">{post.title}</span>}
      >
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          <span className="flex items-center gap-3 text-left">
            <Avatar name={post.userName} size={44} className={cn(CATEGORY_AVATAR[post.category], 'ring-2 ring-[rgba(255,255,255,.18)]')} />
            <span className="grid leading-[1.3]">
              <b className="text-[15px] font-semibold text-white">{post.userName}</b>
              {post.userVehicle ? (
                <span className="font-mono text-xs text-white/55">
                  in <span className="text-white/85">{post.userVehicle}</span>
                </span>
              ) : null}
            </span>
          </span>
          <span aria-hidden="true" className="hidden h-8 w-px bg-white/15 sm:block" />
          <span className="inline-flex items-center gap-2 font-mono text-[12.5px] text-white/60">
            <Clock size={14} aria-hidden="true" />
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </span>
          <CategoryTag category={post.category} />
        </div>
      </PageHero>

      {/* Lifted into the hero like the other pages' sheets: it rises in after the title (data-lift). */}
      <div
        data-theme="light"
        data-lift=""
        className={cn(
          WRAP,
          'relative z-[3] -mt-[84px] grid items-start gap-5 sm:-mt-28 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7',
        )}
      >
        <div className="grid min-w-0 gap-5">
          <article className="rounded-3xl border border-ink/10 bg-white px-5 pb-4 pt-6 shadow-e4 sm:rounded-[32px] sm:px-10 sm:pb-6 sm:pt-10">
            <div className="whitespace-pre-wrap text-pretty text-[16px] leading-[1.8] text-ink/85 sm:text-[17px]">
              {post.content}
            </div>

            {post.photos && post.photos.length > 0 ? (
              // Single photo spans the column; two or more sit in a pair grid.
              <div className={cn('mt-8 grid gap-3', post.photos.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                {post.photos.map((photo, index) => (
                  <span
                    key={photo}
                    className={cn(
                      'relative block overflow-hidden rounded-[18px] bg-stone',
                      post.photos!.length > 1 ? 'aspect-[4/3]' : 'aspect-[4/3] sm:aspect-[16/9]',
                    )}
                  >
                    <Image
                      src={photo}
                      alt={`${post.title} — photo ${index + 1}`}
                      fill
                      sizes={post.photos!.length > 1 ? '(max-width: 640px) 100vw, 440px' : '(max-width: 1024px) 100vw, 880px'}
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
            ) : null}

            <PostActions postId={post.id} title={post.title} likeCount={post.likeCount} />
          </article>

          <CommentSection
            comments={post.comments ?? []}
            postId={post.id}
            postTitle={post.title}
            totalComments={post.commentCount}
          />
        </div>

        <aside aria-label="About this post" className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-[104px] lg:grid-cols-1">
          {/* No Follow button: there are no follows in the schema. */}
          <div
            data-theme="dark"
            className="relative isolate overflow-hidden rounded-[26px] bg-ink p-6 text-white shadow-e4"
          >
            <div
              aria-hidden="true"
              className="absolute -right-[180px] -top-[220px] -z-[1] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-[1] bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.03)_22px_23px)]"
            />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white/55 [-webkit-text-stroke:0]">
              About the author
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={post.userName} size={52} className={cn(CATEGORY_AVATAR[post.category], 'ring-2 ring-[rgba(255,255,255,.18)]')} />
              <span className="grid min-w-0 leading-[1.3]">
                <b className="truncate font-display text-[22px] font-normal text-white">{post.userName}</b>
                {post.userVehicle ? (
                  <span className="truncate font-mono text-xs text-white/60">
                    drives <span className="text-volt">{post.userVehicle}</span>
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          {related.length > 0 ? (
            <div className={SBOX}>
              <h2 className="font-display text-xl leading-[1.1] text-ink">Related posts</h2>
              <div className="mt-2 grid divide-y divide-ink/10">
                {related.map((item) => (
                  <PostCard key={item.id} post={item} variant="compact" />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
