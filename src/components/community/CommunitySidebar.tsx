// src/components/community/CommunitySidebar.tsx
import { MapPin, MessageCircle, MessageSquare, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'

import type { CommunityStats } from '@/hooks/useCommunity'
import { POST_CATEGORY_META } from '@/lib/constants'
import type { CommunityPost, EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface CommunitySidebarProps {
  clubs: EVClub[]
  topPosts: CommunityPost[]
  /**
   * Counted figures, passed in rather than written here.
   *
   * This panel used to hold its own const reading "5,000+ users / 1,200+ posts
   * / 450+ trips / 18 cities" — a second, separately-invented copy of the four
   * numbers the hero was also inventing, so the page could contradict itself as
   * well as the data. Both read the same counts now.
   */
  stats: CommunityStats
}

const CLUB_TONES = [
  'bg-blue-50 text-blue-600',
  'bg-green-50 text-green-600',
  'bg-purple-50 text-purple-600',
  'bg-amber-50 text-amber-600',
]

export function CommunitySidebar({ clubs, topPosts, stats }: CommunitySidebarProps) {
  const figures = [
    { icon: MessageSquare, value: stats.discussions, label: 'Discussions' },
    { icon: MessageCircle, value: stats.replies, label: 'Replies' },
    { icon: Users, value: stats.clubs, label: stats.clubs === 1 ? 'Club' : 'Clubs' },
    { icon: MapPin, value: stats.cities, label: stats.cities === 1 ? 'City' : 'Cities' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ── What the board actually holds ──────────── */}
      <div className="rounded-2xl bg-gradient-brand p-6 text-white">
        <h2 className="mb-1 font-display text-lg font-bold text-white">The board so far</h2>
        {/* white/75 rather than white/60: this panel sits on the brand
            gradient's lighter cyan end, where the old value fell under 4.5:1. */}
        <p className="mb-5 text-ui-sm text-white/75">
          {stats.clubMembers.toLocaleString('en-PK')} members across every club.
        </p>

        <dl className="grid grid-cols-2 gap-4">
          {figures.map((figure) => {
            const Icon = figure.icon

            return (
              <div key={figure.label} className="rounded-xl bg-white/[0.14] p-4 text-center">
                <Icon size={18} className="mx-auto mb-2 text-white" aria-hidden="true" />
                {/* dt first in the source, which is the order a definition list
                    requires; flex-col-reverse puts the number on top where the
                    eye wants it without lying about the structure. */}
                <div className="flex flex-col-reverse">
                  <dt className="mt-1 text-ui-xs uppercase tracking-[0.12em] text-white/75">
                    {figure.label}
                  </dt>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-white">
                    {figure.value}
                  </dd>
                </div>
              </div>
            )
          })}
        </dl>

        <Link
          href="/signup"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-white font-bold text-plug-blue-600 transition-colors duration-150 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-blue-600"
        >
          Join free
        </Link>
      </div>

      {/* ── Trending ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
          <TrendingUp size={18} className="text-plug-blue-600" aria-hidden="true" />
          Trending
        </h2>

        {topPosts.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No trending posts yet.</p>
        ) : (
          topPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/post/${post.slug}`}
              className={cn(
                '-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50',
                index < topPosts.length - 1 && 'border-b border-slate-50',
              )}
            >
              <span
                aria-hidden="true"
                className="w-7 shrink-0 font-mono text-2xl font-bold text-slate-200"
              >
                {index + 1}
              </span>

              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {post.title}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      POST_CATEGORY_META[post.category].badge,
                    )}
                  >
                    {POST_CATEGORY_META[post.category].label}
                  </span>
                  {post.commentCount} comments
                </span>
              </span>
            </Link>
          ))
        )}
      </div>

      {/* ── Clubs ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Users size={18} className="text-plug-blue-600" aria-hidden="true" />
            EV Clubs
          </h2>
          <Link href="/community/clubs" className="text-sm text-plug-blue-600 hover:underline">
            View all &rarr;
          </Link>
        </div>

        {clubs.map((club, index) => (
          <div
            key={club.id}
            className={cn(
              'flex items-center justify-between gap-3 py-3',
              index < clubs.length - 1 && 'border-b border-slate-50',
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  CLUB_TONES[index % CLUB_TONES.length],
                )}
              >
                <Users size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {club.name}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">{club.city}</span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold text-slate-900">{club.memberCount}</span>
              <span className="block text-xs text-slate-400">members</span>
            </span>
          </div>
        ))}
      </div>

      {/* ── Newsletter ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <Zap size={28} className="mb-3 text-plug-cyan-400" aria-hidden="true" />

        <h2 className="mb-2 text-lg font-bold text-white">EV Pakistan Weekly</h2>
        <p className="mb-5 text-sm text-white/60">
          Get the latest EV news and community highlights.
        </p>

        <form className="flex gap-2">
          <input
            type="email"
            name="email"
            placeholder="Your email"
            aria-label="Email address"
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-cyan-400 focus-visible:bg-white/[0.15]"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  )
}
