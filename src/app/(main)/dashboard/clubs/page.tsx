// src/app/(main)/dashboard/clubs/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { IUsers } from '@/components/dashboard/acct-icons'
import { ClubRow } from '@/components/dashboard/ClubRow'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { EmptyPanel, FHINT, PANEL, SecHead } from '@/components/dashboard/dash-ui'
import { getCommunityClubs, getMyClubs } from '@/lib/db/community-queries'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { formatRelativeTime } from '@/lib/utils'

/**
 * The clubs this account has joined, and the ones it can join
 * (account-clubs.html). Joining and leaving are real and free.
 * Gated on the server like the rest of the dashboard.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Clubs' }

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/clubs')

  const [shell, mine, all] = await Promise.all([getDashboardShell(profile), getMyClubs(profile.id), getCommunityClubs(profile.id)])
  const open = all.filter((club) => !club.isJoined)
  const cities = new Set(open.map((club) => club.city)).size

  return (
    <DashboardLayout
      title="My clubs."
      subtitle={mine.length === 0 ? 'You have not joined a club yet' : `${mine.length} club${mine.length === 1 ? '' : 's'} joined`}
      user={shell.user}
      stats={shell.stats}
    >
      <div className="flex flex-col gap-[18px]">
        {mine.length === 0 ? (
          <EmptyPanel
            icon={<IUsers />}
            title="No clubs yet."
            body="EV owners' clubs are free to join. Find the one in your city to see who else drives electric near you."
            href="/community/clubs"
            cta="Browse clubs"
          />
        ) : (
          <section className={PANEL}>
            <SecHead title="Your clubs" />
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 max-[1100px]:grid-cols-1">
              {mine.map((club) => (
                <ClubRow
                  key={club.id}
                  club={club}
                  joined
                  meta={
                    <>
                      <span aria-hidden="true">·</span>
                      <span suppressHydrationWarning>joined {formatRelativeTime(club.joinedAt).toLowerCase()}</span>
                    </>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {open.length > 0 ? (
          <section className={PANEL}>
            <SecHead
              title="Clubs you can join"
              aside={
                <span className={FHINT}>
                  {open.length} club{open.length === 1 ? '' : 's'} · {cities} cit{cities === 1 ? 'y' : 'ies'}
                </span>
              }
            />
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 max-[1100px]:grid-cols-1">
              {open.map((club) => (
                <ClubRow key={club.id} club={club} joined={false} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
