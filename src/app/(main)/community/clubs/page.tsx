// src/app/(main)/community/clubs/page.tsx
import { ArrowLeft, User, Users, type IconType } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ClubsDirectory } from '@/components/community/ClubsDirectory'
import { Btn, BtnArrow, HeroStats, Hl, PageHero } from '@/components/v2/ui'
import { getCurrentUser } from '@/lib/db/session-actions'
import { countClubPeople, getCommunityClubs } from '@/lib/db/community-queries'

export const metadata: Metadata = {
  title: 'EV Clubs Pakistan',
  description:
    'EV owner clubs by city across Pakistan, for meetups, charging advice and road trips.',
  alternates: { canonical: '/community/clubs' },
}

/**
 * Clubs come from the database, so the member counts move when somebody joins.
 *
 * ── Why this is not cached ────────────────────────────────────────────
 *
 * A cached page is one page shared by everybody, so it cannot say whether
 * *you* are a member — the Join button offered to sell a membership its owner
 * already had. Reading the session makes the route dynamic whether it is
 * declared or not; saying so here means it is not quietly reclassified by a
 * cookie read three files away.
 */
export const dynamic = 'force-dynamic'

export default async function CommunityClubsPage() {
  // One session read, handed down, rather than each club card asking for itself.
  const user = await getCurrentUser()
  // Members counted from active memberships, not the seeded baseline totals
  // Club.memberCount holds — see getCommunityClubs for why.
  const [clubs, members] = await Promise.all([getCommunityClubs(user?.id), countClubPeople()])

  const cities = new Set(clubs.map((club) => club.city)).size
  // `members` is different people, not the sum of the club counts: someone in
  // three clubs is one member here (countClubPeople).

  return (
    <div className="bg-chalk pb-[clamp(56px,6vw,96px)]">
      {/* The same ink hero as /community, with the directory lifted into it. */}
      <PageHero
        eyebrow={
          <Link
            href="/community"
            className="group/back -my-3 inline-flex min-h-11 items-center gap-2 rounded-full transition-colors hover:text-white"
          >
            <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-300 group-hover/back:-translate-x-0.5" />
            Community
          </Link>
        }
        title={
          <>
            EV clubs <Hl dark>across Pakistan</Hl>
          </>
        }
        sub={
          clubs.length === 0 ? (
            <>No clubs are listed yet. As owners organise in each city, their groups appear here.</>
          ) : (
            <>
              {clubs.length} owner {clubs.length === 1 ? 'group' : 'groups'} in {cities}{' '}
              {cities === 1 ? 'city' : 'cities'} — for meetups, charging advice and road trips with
              people driving the same car.
            </>
          )
        }
        actions={
          /*
            Signed out, this goes to /signup: joining a club needs an account
            before it needs a choice of club, and the directory is already the
            next thing on screen.
          */
          <Btn
            variant="volt"
            size="lg"
            href={user ? '#clubs-directory' : '/signup?redirect=%2Fcommunity%2Fclubs'}
          >
            {user ? 'Choose a club' : 'Sign up to join'}
            <BtnArrow />
          </Btn>
        }
      >
        {/* Two figures, not three: with one club per city a third would print
            the same number twice. Cities is in the sentence above. */}
        {clubs.length > 0 ? (
          <HeroStats
            items={[
              { value: <Figure icon={Users} value={clubs.length} />, label: clubs.length === 1 ? 'club' : 'clubs' },
              { value: <Figure icon={User} value={members} />, label: members === 1 ? 'member' : 'members' },
            ]}
          />
        ) : null}
      </PageHero>

      <ClubsDirectory clubs={clubs} signedIn={Boolean(user)} />
    </div>
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
