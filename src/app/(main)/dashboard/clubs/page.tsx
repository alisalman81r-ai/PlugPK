// src/app/(main)/dashboard/clubs/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CityLandmark, citySky } from '@/components/community/CityLandmark'
import { ClubJoinButton } from '@/components/community/ClubJoinButton'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MapPin, Users } from '@/components/ui/icons'
import { getMyClubs } from '@/lib/db/community-queries'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

/**
 * The clubs this account has joined, with a way into each and a way out.
 * Gated on the server like the rest of the dashboard.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Clubs' }

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/clubs')

  const [shell, clubs] = await Promise.all([getDashboardShell(profile), getMyClubs(profile.id)])

  return (
    <DashboardLayout
      title="My Clubs"
      subtitle={clubs.length === 0 ? 'You have not joined a club yet' : `${clubs.length} club${clubs.length === 1 ? '' : 's'} joined`}
      user={shell.user}
      stats={shell.stats}
    >
      {clubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Users size={28} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-semibold text-slate-900">No clubs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            EV owners&apos; clubs are free to join. Find the one in your city to see who else drives electric near you.
          </p>
          <Link
            href="/community/clubs"
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-5 text-ui font-bold text-white transition-colors hover:bg-plug-cyan-500 hover:text-plug-blue-600"
          >
            Browse clubs
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {clubs.map((club) => (
            <li key={club.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Link
                href={`/community/clubs/${club.id}`}
                className={cn('relative flex h-20 items-end overflow-hidden bg-gradient-to-b', citySky(club.city))}
                aria-label={`Open ${club.name}`}
              >
                <CityLandmark city={club.city} className="h-16 w-full" />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link href={`/community/clubs/${club.id}`} className="font-bold text-slate-900 hover:text-plug-blue-600 hover:underline">
                  {club.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} aria-hidden="true" /> {club.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} aria-hidden="true" />
                    <span className="font-mono font-bold text-slate-900">{club.memberCount}</span>
                    {club.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span suppressHydrationWarning>joined {formatRelativeTime(club.joinedAt).toLowerCase()}</span>
                </p>
                <ClubJoinButton
                  clubId={club.id}
                  initiallyJoined
                  signedIn
                  signInRedirect="/dashboard/clubs"
                  refreshAfter
                  className="mt-auto pt-4"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  )
}
