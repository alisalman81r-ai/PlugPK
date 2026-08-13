// src/app/admin/(protected)/community/page.tsx
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deletePost } from '@/lib/db/actions'
import { getPosts } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const posts = await getPosts()

  return (
    <>
      <AdminHeader
        title="Community"
        description={`${posts.length} posts. Deleting one removes its comments too.`}
      />

      <div className="px-8 py-8">
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">
                  {post.content}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-xs text-slate-400">
                  <span>{post.userName}</span>
                  <span className="capitalize">{post.category.replace(/-/g, ' ')}</span>
                  <span>{post.likeCount} likes</span>
                  <span>{post.commentCount} comments</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
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
          ))}
        </div>
      </div>
    </>
  )
}
