// src/app/admin/(protected)/community/page.tsx
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MarkCommunityPostReviewed } from '@/components/admin/MarkCommunityPostReviewed'
import { deletePost } from '@/lib/db/actions'
import { getAdminCommunityPosts } from '@/lib/db/queries'
import { getAdminBadgeCounts } from '@/lib/db/admin-badges'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const entries = await getAdminCommunityPosts()
  const newPosts = (await getAdminBadgeCounts())['/admin/community'] ?? 0

  return (
    <>
      <AdminHeader
        title="Community"
          help={
            <>
              <b>Discussions your users posted publicly</b>, newest first, with their
              comment and like counts. Use it to moderate: spot an unanswered question,
              or take down a post that should not be up. You are reading the same rows
              the public community pages show.
            </>
          }
        description={`${entries.length} posts${newPosts > 0 ? ` · ${newPosts} new today` : ''}. Deleting one removes its comments too.`}
      />

      <div className="px-8 py-8">
        <div className="flex flex-col gap-3">
          {entries.map(({ post, isNew }) => {
            return (
            <article
              key={post.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="min-w-0 flex-1">
                <h2 className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                  {post.title}
                  {isNew ? (
                    <span className="rounded-full bg-plug-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      New
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">
                  {post.content}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-xs text-slate-400">
                  <span>{post.userName}</span>
                  <span className="capitalize">{post.category.replace(/-/g, ' ')}</span>
                  <span>{post.likeCount} likes</span>
                  <span>{post.commentCount} comments</span>
                  <span>Posted {formatRelativeTime(post.createdAt)}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <MarkCommunityPostReviewed postId={post.id} reviewed={!isNew} />
                <Link
                  href={`/community/post/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View "${post.title}" on the live site`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                >
                  <ExternalLink size={15} />
                </Link>
                <DeleteButton
                  label={post.title}
                  action={async () => {
                    'use server'
                    return deletePost(post.id)
                  }}
                />
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </>
  )
}
