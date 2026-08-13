// src/app/(main)/community/post/[slug]/page.tsx
import { Bookmark, ChevronLeft, Heart, Link as LinkIcon, Share2, Twitter } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentSection } from '@/components/community/CommentSection'
import { Avatar, PostCard } from '@/components/community/PostCard'
import { Button } from '@/components/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import { getPostBySlug, getPostSlugs, getPosts } from '@/lib/db/queries'
import { cn, formatDate } from '@/lib/utils'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    // `absolute` bypasses the root layout's '%s | Plug.pk' template, which
    // would otherwise render "... | Plug.pk Community | Plug.pk".
    title: { absolute: `${post.title} | Plug.pk Community` },
    description: post.content.slice(0, 160),
  }
}

export default async function CommunityPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const meta = POST_CATEGORY_META[post.category]
  const related = (await getPosts())
    .filter((item) => item.category === post.category && item.id !== post.id)
    .slice(0, 3)

  return (
    <div className="container-plug py-10">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-3">
        <Link
          href="/community"
          className="group/back flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
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
          <article className="mb-6 rounded-3xl border border-slate-200 bg-white p-8">
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

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
            <span className="flex items-center gap-2">
              <Heart size={28} className="text-slate-400" aria-hidden="true" />
              <span className="font-semibold text-slate-700">{post.likeCount} Likes</span>
            </span>

            <span className="flex gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Share2 size={16} aria-hidden="true" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <LinkIcon size={16} aria-hidden="true" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Twitter size={16} aria-hidden="true" />
              </span>
            </span>

            <span className="flex items-center gap-2 text-slate-500">
              <Bookmark size={18} aria-hidden="true" />
              <span className="text-sm font-medium">Save</span>
            </span>
          </div>

          <CommentSection
            comments={post.comments ?? []}
            postId={post.id}
            totalComments={post.commentCount}
          />
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
              About the Author
            </h2>

            <div className="mb-4 flex items-center gap-3">
              <Avatar name={post.userName} size={52} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-900">{post.userName}</span>
                {post.userVehicle ? (
                  <span className="block truncate text-sm text-slate-400">{post.userVehicle}</span>
                ) : null}
              </span>
            </div>

            <Button variant="secondary" fullWidth className="h-10">
              Follow
            </Button>
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
