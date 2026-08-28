// src/components/community/CommunityHero.tsx
'use client'

import { MessageCircle, MessageSquare, PenSquare, Users, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { PillButton } from '@/components/ui'
import type { CommunityStats } from '@/hooks/useCommunity'

/**
 * The community's opening band.
 *
 * The same shape as the map, routes and services heroes — dark, centred,
 * rounded off at the bottom, with the next section lifted up into it. It used
 * to be the odd one out in two ways.
 *
 * First it painted itself with `bg-gradient-hero`, the flat navy-to-teal ramp
 * the other three heroes dropped: it put the headline on one colour and the
 * figures beneath it on a visibly different one, and anything white landing in
 * the middle of the ramp got the least contrast to work against. A dark ground
 * with discrete pools of light keeps every element on a predictable backdrop.
 *
 * Second, it was a two-column layout with a floating card on the right holding
 * the most-liked post — a post the feed one screen below already renders, and
 * badges as featured. The card is gone; the featured discussion lives in the
 * feed, once.
 *
 * Every figure here is counted from the data (see CommunityStats). The badge
 * used to read "5,000+ members" and "1,200+ discussions" over twelve posts.
 */

export interface CommunityHeroProps {
  /** Counted figures. Nothing in this band is typed in. */
  stats: CommunityStats
  onCreatePost: () => void
  /** The search field, passed in so this owns layout and not behaviour. */
  search: React.ReactNode
}

export function CommunityHero({ stats, onCreatePost, search }: CommunityHeroProps) {
  return (
    <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-32 pt-10 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-14">
      {/* The decoration clips itself so the band does not have to: the browse
          card below is lifted up into this padding and has to paint above it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        <div className="absolute -bottom-48 right-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
      </div>

      <div className="container-plug relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
            <MessageCircle size={12} aria-hidden="true" />
            EV community Pakistan
          </span>

          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            Ask the people who{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              already drive one
            </span>
          </h1>

          {/*
            The copy describes the board as it actually is. It used to promise a
            five-thousand-member community, which the first scroll disproved —
            and a small honest number reads as a real place, where a padded one
            reads as a launch page.
          */}
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
            {stats.discussions === 0 ? (
              <>
                Nothing has been posted yet. Charging notes, trip reports and buying advice all
                start here — be the first.
              </>
            ) : (
              <>
                {stats.discussions} {stats.discussions === 1 ? 'discussion' : 'discussions'} and{' '}
                {stats.replies} {stats.replies === 1 ? 'reply' : 'replies'} on charging, trips and
                buying advice — plus {stats.clubs} owner {stats.clubs === 1 ? 'club' : 'clubs'}{' '}
                across {stats.cities} {stats.cities === 1 ? 'city' : 'cities'}.
              </>
            )}
          </p>

          {/* ── Search ───────────────────────────────────────────── */}
          <div className="mx-auto mt-7 max-w-xl">{search}</div>

          {/*
            ── Actions ───────────────────────────────────────

            Two actions, both at 56px, because a hairline ghost button next to a
            filled one is not a second choice — it is a filled button and a piece
            of decoration. The clubs link used to be exactly that: a 1px white
            outline on a dark band, which is the lowest-contrast thing the band
            could have held.

            They differ in shape rather than in weight. The badge and its
            travelling arrow mark the one that leaves the page; the flat gradient
            pill marks the one that opens something here. That reads at a glance
            without either having to be the quiet one.
          */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCreatePost}
              className="inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-7 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <PenSquare size={17} aria-hidden="true" />
              Start a discussion
            </button>

            {/* PillButton's `light` tone — white pill, dark badge — because this
                band is dark. It is the same button the home page uses for "Plan a
                route", so the site has one prominent CTA shape rather than a new
                one per section. */}
            <PillButton href="/community/clubs" tone="light">
              Join the club
            </PillButton>
          </div>

          {/*
            The figures, on the line above the browse card.
            Divided rather than boxed: three bordered cards here would read as
            the top row of the card that overlaps them.
          */}
          <dl className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center divide-white/10 sm:divide-x">
            {/*
              Posts, replies and clubs — not a member count. Nothing in the data
              records a signup, and "5,000+ members" is exactly the figure this
              band used to lead with.
            */}
            <Stat icon={MessageCircle} value={stats.discussions} label="discussions" />
            <Stat icon={MessageSquare} value={stats.replies} label="replies" tone="cyan" />
            <Stat icon={Users} value={stats.clubs} label={stats.clubs === 1 ? 'club' : 'clubs'} />
          </dl>
        </div>
      </div>
    </header>
  )
}

/**
 * One figure in the band.
 *
 * Identical to the map and route heroes' Stat: mono numeral, hairline divider,
 * a label small enough that the number is what the eye lands on.
 */
function Stat({
  icon: Icon,
  value,
  label,
  tone = 'plain',
}: {
  icon?: LucideIcon
  value: number
  label: string
  tone?: 'plain' | 'cyan'
}) {
  return (
    <div className="px-5 py-1 text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-center justify-center gap-1.5">
          {Icon ? (
            <Icon
              size={14}
              aria-hidden={true}
              className={tone === 'cyan' ? 'text-plug-cyan-400' : 'text-white/40'}
            />
          ) : null}
          <span className="font-mono text-lg font-bold text-white">{value}</span>
        </span>
        <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/45">
          {label}
        </span>
      </dd>
    </div>
  )
}
