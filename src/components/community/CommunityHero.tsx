// src/components/community/CommunityHero.tsx
'use client'

import { ArrowUpRight, MessageCircle, MessageSquare, PenSquare, Users, type IconType } from '@/components/ui/icons'
import * as React from 'react'

import { Btn, HeroStats, Hl } from '@/components/v2/ui'
import type { CommunityStats } from '@/hooks/useCommunity'

/**
 * The community's opening band — landing-v2's .phero: ink, a faint grid and a
 * volt glow, the title centred with its last phrase in volt, then the search
 * pill, the two actions and the counted figures. The browse sheet below is
 * lifted up into its bottom padding.
 *
 * Laid out by hand rather than through PageHero, because the design brings in
 * the sub, the search, the actions and the stats one after another
 * (pages.js: .phero__sub, .psearch, .phero__actions, .pstats, stagger .07) and
 * PageHero moves everything under its sub as one block. Each of the four
 * carries its own data-hero-item; MotionProvider runs the timeline.
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
    <section
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]"
      />
      <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        <h1 data-hero-title="" className="m-0 text-balance font-display text-[clamp(42px,5.6vw,88px)] leading-none">
          Ask the people who <Hl dark>already drive one</Hl>
        </h1>

        <p data-hero-item="" className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70">
          {stats.discussions === 0 ? (
            <>
              Nothing has been posted yet. Charging notes, trip reports and buying advice all start
              here — be the first.
            </>
          ) : (
            <>
              {stats.discussions} {stats.discussions === 1 ? 'discussion' : 'discussions'} and{' '}
              {stats.replies} {stats.replies === 1 ? 'reply' : 'replies'} on charging, trips and buying
              advice — plus {stats.clubs} owner {stats.clubs === 1 ? 'club' : 'clubs'} across{' '}
              {stats.cities} {stats.cities === 1 ? 'city' : 'cities'}.
            </>
          )}
        </p>

        <div data-hero-item="" className="mt-[34px] w-[min(660px,100%)]">
          {search}
        </div>

        <div data-hero-item="" className="mt-[34px] flex flex-wrap justify-center gap-3">
          {/* .magnetic in the design; the ghost one beside it is not. */}
          <Btn variant="volt" size="lg" onClick={onCreatePost}>
            <PenSquare aria-hidden="true" />
            Start a discussion
          </Btn>
          <Btn variant="ghostDark" size="lg" href="/community/clubs" magnetic={false}>
            Join the club
            {/* .btn .arr: slides 4px on hover, .35s on the spring */}
            <ArrowUpRight aria-hidden="true" className="transition-transform duration-[350ms] ease-spring group-hover/btn:translate-x-1" />
          </Btn>
        </div>

        {/* Posts, replies and clubs — not a member count: nothing in this band
            records a signup, and "5,000+ members" is the figure it used to lead with. */}
        <div data-hero-item="" className="grid w-full justify-items-center">
          <HeroStats
            items={[
              { value: <Figure icon={MessageCircle} value={stats.discussions} />, label: 'discussions' },
              { value: <Figure icon={MessageSquare} value={stats.replies} />, label: 'replies' },
              { value: <Figure icon={Users} value={stats.clubs} />, label: stats.clubs === 1 ? 'club' : 'clubs' },
            ]}
          />
        </div>
      </div>
    </section>
  )
}

/** The number alone in its span, so the counter (data-count) owns its text. */
function Figure({ icon: Icon, value }: { icon: IconType; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon size={16} className="text-volt" aria-hidden="true" />
      <span data-count={value}>{value.toLocaleString('en-PK')}</span>
    </span>
  )
}
