// src/components/community/CommunityHero.tsx
'use client'

import { ArrowRight, Heart, MessageSquare, PenSquare } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import type { CommunityPost } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Avatar } from './PostCard'

export interface CommunityHeroProps {
  totalMembers: number
  totalPosts: number
  featuredPost: CommunityPost | null
  onCreatePost: () => void
}

export function CommunityHero({
  totalMembers,
  totalPosts,
  featuredPost,
  onCreatePost,
}: CommunityHeroProps) {
  const stats = [
    { value: `${totalMembers.toLocaleString('en-PK')}+`, label: 'Members' },
    { value: `${totalPosts.toLocaleString('en-PK')}+`, label: 'Discussions' },
    { value: '450+', label: 'Trip Reports' },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-16 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/[0.18] blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/[0.12] blur-[100px]"
      />

      <div className="container-plug relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-[3fr_2fr]">
          <div>
            <span className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/80">
              EV Community Pakistan
            </span>

            <h1 className="mb-5 text-4xl font-black text-white lg:text-display-md">
              Connect with Pakistan&apos;s
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                EV Community
              </span>
            </h1>

            <p className="mb-8 max-w-md text-lg text-white/60">
              Share experiences, get advice, plan trips, and connect with EV owners across Pakistan.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onCreatePost}
                className="flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-slate-900 transition-all duration-200 hover:bg-slate-50 hover:shadow-lg"
              >
                <PenSquare size={18} aria-hidden="true" />
                Start a Discussion
              </button>

              <Button href="/signup" variant="outline-white" className="h-12 rounded-xl px-6">
                Join Free
              </Button>
            </div>

            <dl className="mt-10 flex flex-wrap gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-2xl font-black text-white">{stat.value}</span>
                    <span className="mt-1 block text-xs uppercase tracking-wider text-white/40">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {featuredPost ? (
            <Link
              href={`/community/post/${featuredPost.slug}`}
              className="hidden animate-float rounded-3xl border border-white/[0.12] bg-white/[0.08] p-6 backdrop-blur-xl lg:block"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-widest text-white/40">
                  Featured Discussion
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white',
                    POST_CATEGORY_META[featuredPost.category].active,
                  )}
                >
                  {POST_CATEGORY_META[featuredPost.category].label}
                </span>
              </div>

              <h2 className="mb-4 line-clamp-2 text-lg font-bold text-white">
                {featuredPost.title}
              </h2>

              <p className="mb-6 line-clamp-3 text-sm text-white/60">{featuredPost.content}</p>

              <div className="flex items-center gap-3">
                <Avatar name={featuredPost.userName} size={36} />
                <span className="text-sm font-semibold text-white">{featuredPost.userName}</span>
                <span className="ml-auto text-xs text-white/40">
                  {formatRelativeTime(featuredPost.createdAt)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-5 border-t border-white/10 pt-4">
                <span className="flex items-center gap-1.5">
                  <Heart size={16} className="text-white/50" aria-hidden="true" />
                  <span className="text-sm text-white/60">{featuredPost.likeCount}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-white/50" aria-hidden="true" />
                  <span className="text-sm text-white/60">{featuredPost.commentCount}</span>
                </span>
                <span className="ml-auto flex items-center gap-1 text-sm text-white/60 hover:text-white">
                  Read More
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
