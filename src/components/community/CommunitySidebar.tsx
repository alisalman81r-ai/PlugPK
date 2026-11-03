// src/components/community/CommunitySidebar.tsx
'use client'

import { ArrowRight, MapPin, MessageCircle, MessageSquare, TrendingUp, Users } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'
import { usePathname } from 'next/navigation'

import { btnClass } from '@/components/v2/ui'
import type { CommunityStats } from '@/hooks/useCommunity'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { CommunityPost, EVClub } from '@/lib/types'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'

import { signUpHref } from './auth-links'
import { CategoryTag } from './PostCard'

export interface CommunitySidebarProps {
  clubs: EVClub[]
  topPosts: CommunityPost[]
  /** Counted figures, the same ones the hero reads — never typed in here. */
  stats: CommunityStats
  className?: string
}

/** .sbox: a white card in the sidebar. */
const SBOX = 'rounded-[26px] border border-ink/10 bg-white px-5 pb-3 pt-5 shadow-e1'
const SBOX_T = 'm-0 flex items-center gap-[9px] font-display text-xl leading-[1.1] text-ink'

/** Clubs listed before "View all" (the design shows four and hides the rest). */
const CLUBS_SHOWN = 4

export function CommunitySidebar({ clubs, topPosts, stats, className }: CommunitySidebarProps) {
  const { user, loading: sessionLoading } = useCurrentUser()
  const pathname = usePathname()

  const figures = [
    { icon: MessageSquare, value: stats.discussions, label: 'Discussions' },
    { icon: MessageCircle, value: stats.replies, label: 'Replies' },
    { icon: Users, value: stats.clubs, label: stats.clubs === 1 ? 'Club' : 'Clubs' },
    { icon: MapPin, value: stats.cities, label: stats.cities === 1 ? 'City' : 'Cities' },
  ]

  const boardRef = React.useRef<HTMLDivElement>(null)
  const clubsRef = React.useRef<HTMLDivElement>(null)
  const [clubsOpen, setClubsOpen] = React.useState(false)
  const shownClubs = clubs.slice(0, CLUBS_SHOWN)
  const moreClubs = clubs.slice(CLUBS_SHOWN)

  /* page-community.js: the board's tiles count up once the board scrolls in. */
  React.useLayoutEffect(() => {
    const board = boardRef.current
    if (!board || prefersReduced()) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: board,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          board.querySelectorAll<HTMLElement>('[data-board-n]').forEach((n) => {
            const end = Number(n.dataset.boardN)
            if (Number.isNaN(end)) return
            const o = { v: 0 }
            gsap.to(o, {
              v: end,
              duration: 1.4,
              ease: 'power3.out',
              onUpdate: () => {
                n.textContent = o.v.toLocaleString('en-PK', { maximumFractionDigits: 0 })
              },
            })
          })
        },
      })
    }, board)
    return () => ctx.revert()
  }, [])

  /* #clubsAll: the rest of the clubs rise in under the first four. */
  React.useLayoutEffect(() => {
    if (!clubsOpen) return
    if (!prefersReduced() && clubsRef.current) {
      const more = clubsRef.current.querySelectorAll('[data-club-more]')
      if (more.length) gsap.from(more, { y: 14, autoAlpha: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 })
    }
    ScrollTrigger.refresh()
  }, [clubsOpen])

  // A link to #clubs opens the whole list, as the design's does.
  React.useEffect(() => {
    if (window.location.hash === '#clubs' && moreClubs.length > 0) setClubsOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={cn('grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-1', className)}>
      {/* ── The board so far (.board) ─────────────────────────── */}
      <div
        ref={boardRef}
        data-reveal=""
        data-theme="dark"
        className="relative isolate overflow-hidden rounded-[26px] bg-ink p-6 text-white sm:col-span-2 lg:col-span-1"
      >
        <div
          aria-hidden="true"
          className="absolute -right-[180px] -top-[220px] -z-[1] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[1] bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.03)_22px_23px)]"
        />
        <h2 className="m-0 font-display text-2xl leading-[1.1] text-white">The board so far</h2>
        {/* Counted from active memberships, not seeded baseline totals. */}
        <p className="mt-1.5 text-[13.5px] leading-[1.5] text-white/60">
          {stats.clubMembers === 0
            ? 'Every figure here is counted from the board itself.'
            : `${stats.clubMembers.toLocaleString('en-PK')} ${stats.clubMembers === 1 ? 'member' : 'members'} across the clubs.`}
        </p>

        <dl className="mt-[18px] grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {figures.map((figure) => {
            const Icon = figure.icon
            return (
              <div
                key={figure.label}
                className="grid justify-items-center gap-1 rounded-2xl border border-white/[0.09] bg-white/[0.05] px-2 pb-3.5 pt-4 transition-colors duration-300 hover:border-volt/35 hover:bg-white/[0.08]"
              >
                <Icon size={18} className="text-fog" aria-hidden="true" />
                {/* dt first, as a definition list requires; reversed so the number sits on top. */}
                <div className="flex flex-col-reverse items-center gap-1">
                  <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    {figure.label}
                  </dt>
                  <dd
                    data-board-n={figure.value}
                    className="font-mono text-[30px] font-semibold leading-[1.05] tabular-nums text-white"
                  >
                    {figure.value}
                  </dd>
                </div>
              </div>
            )
          })}
        </dl>

        {/* "Join" is an invitation to people who have not joined; nothing is
            rendered while the session is still being read. */}
        {sessionLoading ? (
          <span aria-hidden="true" className="mt-3.5 block h-12" />
        ) : user ? (
          <Link href="/community/clubs" className={btnClass('volt', 'md', 'mt-3.5 w-full')}>
            Browse clubs
          </Link>
        ) : (
          <Link href={signUpHref(pathname)} className={btnClass('volt', 'md', 'mt-3.5 w-full')}>
            Join
          </Link>
        )}
      </div>

      {/* ── Trending ─────────────────────────────────────────── */}
      <div data-reveal="" className={SBOX}>
        <h2 className={SBOX_T}>
          <TrendingUp size={20} className="text-volt-ink" aria-hidden="true" />
          Trending
        </h2>

        {topPosts.length === 0 ? (
          <p className="py-4 text-sm text-muted">No trending posts yet.</p>
        ) : (
          <ol className="m-0 mt-2.5 list-none p-0">
            {topPosts.map((post, index) => (
              <li key={post.id} className={cn(index > 0 && 'border-t border-ink/10')}>
                <Link
                  href={`/community/post/${post.slug}`}
                  className="group/tr grid grid-cols-[30px_1fr] gap-2.5 rounded-[14px] px-1.5 py-3 transition-colors duration-[250ms] hover:bg-chalk"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-[26px] leading-none text-transparent [transition:color_.3s,-webkit-text-stroke-color_.3s] [-webkit-text-stroke:1.2px_rgba(11,12,14,.3)] group-hover/tr:text-volt group-hover/tr:[-webkit-text-stroke-color:#0B0C0E]"
                  >
                    {index + 1}
                  </span>
                  <span className="grid min-w-0 gap-1.5">
                    <b className="line-clamp-2 text-sm font-semibold leading-[1.4] text-ink">{post.title}</b>
                    <span className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium text-muted">
                      <CategoryTag category={post.category} className="h-[22px] px-2 font-sans text-[11px]" />
                      {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Clubs ────────────────────────────────────────────── */}
      <div ref={clubsRef} id="clubs" data-reveal="" className={SBOX}>
        <div className="flex items-center justify-between gap-2.5">
          <h2 className={SBOX_T}>
            <Users size={20} className="text-volt-ink" aria-hidden="true" />
            EV Clubs
          </h2>
          {moreClubs.length > 0 ? (
            /* .sbox__all: opens the rest in place; the arrow turns to point down. */
            <button
              type="button"
              aria-expanded={clubsOpen}
              aria-controls="sidebar-clubs"
              onClick={() => setClubsOpen((open) => !open)}
              className="group/all inline-flex h-11 items-center gap-1.5 rounded-full pl-3 pr-1 text-[13px] font-semibold text-ink"
            >
              {clubsOpen ? 'Show fewer' : 'View all'}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className={cn(
                  'transition-transform duration-[350ms] ease-spring',
                  clubsOpen ? '-rotate-90' : 'group-hover/all:translate-x-[3px]',
                )}
              />
            </button>
          ) : (
            <Link
              href="/community/clubs"
              className="group/all inline-flex h-11 items-center gap-1.5 rounded-full pl-3 pr-1 text-[13px] font-semibold text-ink"
            >
              View all
              <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-[350ms] ease-spring group-hover/all:translate-x-[3px]" />
            </Link>
          )}
        </div>

        {clubs.length === 0 ? <p className="py-4 text-sm text-muted">No clubs are listed yet.</p> : null}
        <ul id="sidebar-clubs" className="m-0 mt-2 list-none p-0">
          {[...shownClubs, ...(clubsOpen ? moreClubs : [])].map((club, index) => (
            <li
              key={club.id}
              data-club-more={index >= CLUBS_SHOWN ? '' : undefined}
              className={cn(index > 0 && 'border-t border-ink/10')}
            >
              <Link
                href={`/community/clubs/${club.id}`}
                className="group/club grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-[14px] px-1.5 py-3 transition-colors duration-[250ms] hover:bg-chalk"
              >
                <span
                  aria-hidden="true"
                  className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-chalk text-ink transition-colors duration-[250ms] group-hover/club:bg-volt"
                >
                  <Users size={19} />
                </span>
                <span className="grid min-w-0 gap-px">
                  <b className="truncate text-sm font-semibold leading-[1.35] text-ink">{club.name}</b>
                  <span className="font-mono text-xs font-medium text-muted">{club.city}</span>
                  {club.description ? (
                    <small className="mt-[3px] line-clamp-2 text-[12.5px] leading-[1.45] text-muted">
                      {club.description}
                    </small>
                  ) : null}
                </span>
                <span className="grid justify-items-end leading-[1.2]">
                  <b className="font-mono text-base font-semibold text-ink">{club.memberCount}</b>
                  <span className="text-[11px] text-muted">{club.memberCount === 1 ? 'member' : 'members'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
