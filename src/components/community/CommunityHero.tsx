// src/components/community/CommunityHero.tsx
'use client'

import { ArrowUpRight, MessageCircle, MessageSquare, PenSquare, Users, type IconType } from '@/components/ui/icons'
import * as React from 'react'

import { Btn, HeroStats, Hl, PageHero } from '@/components/v2/ui'
import type { CommunityStats } from '@/hooks/useCommunity'

/**
 * The community's opening band — landing-v2's .phero: ink, a faint grid and a
 * volt glow, the title centred with its last phrase in volt, then the search
 * pill, the two actions and the counted figures. The browse sheet below is
 * lifted up into its bottom padding.
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
    <PageHero
      title={
        <>
          Ask the people who <Hl dark>already drive one</Hl>
        </>
      }
      sub={
        stats.discussions === 0 ? (
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
        )
      }
    >
      <div className="mt-[34px] w-[min(660px,100%)]">{search}</div>

      <div className="mt-[34px] flex flex-wrap justify-center gap-3">
        <Btn variant="volt" size="lg" onClick={onCreatePost}>
          <PenSquare aria-hidden="true" />
          Start a discussion
        </Btn>
        <Btn variant="ghostDark" size="lg" href="/community/clubs">
          Join the club
          <ArrowUpRight aria-hidden="true" className="transition-transform duration-300 ease-spring group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
        </Btn>
      </div>

      {/* Posts, replies and clubs — not a member count: nothing in this band
          records a signup, and "5,000+ members" is the figure it used to lead with. */}
      <HeroStats
        items={[
          { value: <Figure icon={MessageCircle} value={stats.discussions} />, label: 'discussions' },
          { value: <Figure icon={MessageSquare} value={stats.replies} />, label: 'replies' },
          { value: <Figure icon={Users} value={stats.clubs} />, label: stats.clubs === 1 ? 'club' : 'clubs' },
        ]}
      />
    </PageHero>
  )
}

function Figure({ icon: Icon, value }: { icon: IconType; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon size={16} className="text-volt" aria-hidden="true" />
      {value.toLocaleString('en-PK')}
    </span>
  )
}
