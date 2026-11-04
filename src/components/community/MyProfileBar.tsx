// src/components/community/MyProfileBar.tsx
'use client'

import { ArrowRight, Heart, MessageCircle, PenSquare } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

type Me = {
  user: { name: string; avatar: string | null; vehicle: string | null }
  counts: { posts: number; replies: number; likes: number }
}

/**
 * The signed-in member's strip on /community: who they are, how much they have
 * posted and replied, and the way into their own profile page. The page around
 * it is cached for everyone, so the bar asks /api/community/me once it has
 * mounted and renders nothing for a guest — no account, no bar.
 */
export function MyProfileBar({ className }: { className?: string }) {
  const [me, setMe] = React.useState<Me | null>(null)

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/community/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setMe(data.user ? (data as Me) : null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  if (!me) return null
  const initial = me.user.name.trim().charAt(0).toUpperCase() || '?'
  const stats = [
    { icon: PenSquare, value: me.counts.posts, label: me.counts.posts === 1 ? 'post' : 'posts' },
    { icon: MessageCircle, value: me.counts.replies, label: me.counts.replies === 1 ? 'reply' : 'replies' },
    { icon: Heart, value: me.counts.likes, label: me.counts.likes === 1 ? 'like' : 'likes' },
  ]

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[24px] border border-ink/10 bg-white px-4 py-4 shadow-e1 motion-safe:animate-[fadeUp_.6s_cubic-bezier(.16,1,.3,1)_both] sm:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {me.user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- an uploaded avatar of unknown host
          <img src={me.user.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="pg-bold grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-volt">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-volt-ink">My profile</p>
          <p className="truncate text-[17px] font-semibold text-ink">{me.user.name}</p>
          {me.user.vehicle ? <p className="truncate text-[13px] text-muted">{me.user.vehicle}</p> : null}
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-2">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="inline-flex items-center gap-2 rounded-full bg-chalk px-3.5 py-2">
              <Icon size={15} aria-hidden="true" className="text-volt-ink" />
              <dd className="font-mono text-[15px] font-semibold tabular-nums text-ink">{s.value}</dd>
              <dt className="text-[13px] text-muted">{s.label}</dt>
            </div>
          )
        })}
      </dl>

      <Link
        href="/community/me"
        className="group/btn ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-white transition-colors duration-300 hover:bg-volt hover:text-ink"
      >
        View my posts and replies
        <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-[350ms] ease-spring group-hover/btn:translate-x-1" />
      </Link>
    </div>
  )
}
