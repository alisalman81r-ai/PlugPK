// src/app/(main)/community/post/[slug]/page.tsx
import { ChevronLeft } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentSection } from '@/components/community/CommentSection'
import { PostActions } from '@/components/community/PostActions'
import { Avatar, PostCard } from '@/components/community/PostCard'
import { POST_CATEGORY_META, SITE_CONFIG } from '@/lib/constants'
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
    // `absolute` bypasses the root layout's '%s | Plug.pk' template, which
    // would otherwise render "... | Plug.pk Community | Plug.pk".
    title: { absolute: `${post.title} | Plug.pk Community` },
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

export default async function CommunityPostPage({ params }: PageProps) {
  const post = await getPostPage(params.slug)
  if (!post) notFound()

  const meta = POST_CATEGORY_META[post.category]
  // Three by category from the database, rather than loading the whole board
  // to pick three out of it.
  const related = await getRelatedPosts(post.id, post.category, 3)

  return (
    <div className="container-plug py-10">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-3">
        <Link
          href="/community"
          className="group/back flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft
            size={16}
            className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
            aria-hidden="true"
          />
          Community
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          /
        </span>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.badge)}>
          {meta.label}
        </span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <article className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <span
              className={cn(
                'mb-4 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold',
                meta.badge,
              )}
            >
              {meta.label}
            </span>

            <h1 className="mb-6 text-3xl font-black leading-tight text-slate-900 lg:text-4xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={post.userName} size={48} />
              <span>
                <span className="block font-bold text-slate-900">{post.userName}</span>
                {post.userVehicle ? (
                  <span className="block text-sm text-slate-400">{post.userVehicle}</span>
                ) : null}
              </span>
              <span className="ml-auto text-sm text-slate-400">{formatDate(post.createdAt)}</span>
            </div>

            <hr className="my-6 border-slate-100" />

            <div className="whitespace-pre-wrap text-[16px] leading-[1.8] text-slate-700">
              {post.content}
            </div>

            {post.photos && post.photos.length > 0 ? (
              // Single photo spans the column; two or more sit in a pair grid.
              <div
                className={cn(
                  'mt-8 grid gap-3',
                  post.photos.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1',
                )}
              >
                {post.photos.map((photo, index) => (
                  <span
                    key={photo}
                    className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                  >
                    <Image
                      src={photo}
                      alt={`${post.title} — photo ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 380px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
            ) : null}
          </article>

          <PostActions postId={post.id} title={post.title} likeCount={post.likeCount} />

          <CommentSection
            comments={post.comments ?? []}
            postId={post.id}
            postTitle={post.title}
            totalComments={post.commentCount}
          />
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          {/* No Follow button: there are no follows in the schema, and it was a
              button that did nothing. */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
              About the Author
            </h2>

            <div className="flex items-center gap-3">
              <Avatar name={post.userName} size={52} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-900">{post.userName}</span>
                {post.userVehicle ? (
                  <span className="block truncate text-sm text-slate-400">{post.userVehicle}</span>
                ) : null}
              </span>
            </div>
          </div>

          {related.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold text-slate-900">Related Posts</h2>
              <div className="flex flex-col gap-3">
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
