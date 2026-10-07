// src/app/(main)/community/clubs/[id]/page.tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { CityScene, citySky } from '@/components/community/CityLandmark'
import { ClubJoinButton } from '@/components/community/ClubJoinButton'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronLeft, MapPin, MessageSquare, Users } from '@/components/ui/icons'
import { cityPhoto } from '@/lib/city-photos'
import { getClubDetail } from '@/lib/db/community-queries'
import { getCurrentUser } from '@/lib/db/session-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

/**
 * One club's own page: what it is, who is in it, and Join / Leave.
 *
 * Before this the directory card was the whole of a club — joining changed a
 * number and led nowhere. Now the card links here, and a member lands on a
 * page that lists the group they joined.
 *
 * Dynamic: it reads the session to show the reader's own membership, and the
 * member list changes with every join.
 */

const STAGE = 'mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10'

const loadClub = cache((id: string, userId?: string) => getClubDetail(id, userId))

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const club = await loadClub(params.id)
  if (!club) return { title: 'Club not found' }
  return {
    title: `${club.name} — EV club in ${club.city}`,
    description: club.description || `The ${club.city} EV owners' club on Plug.pk.`,
    alternates: { canonical: `/community/clubs/${club.id}` },
  }
}

export default async function ClubPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  const club = await loadClub(params.id, user?.id)
  if (!club) notFound()

  const photo = club.coverPhoto ?? cityPhoto(club.city)
  const path = `/community/clubs/${club.id}`

  return (
    <div className="min-h-below-nav bg-slate-50 pb-20">
      {/* ── Band ───────────────────────────────────────────────── */}
      <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-28 pt-8 sm:rounded-b-[2.5rem] sm:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        </div>
        <div className={`relative ${STAGE}`}>
          <Link
            href="/community/clubs"
            className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            All clubs
          </Link>
        </div>
      </header>

      {/* ── The club card, lifted into the band ─────────────────── */}
      <div className={`relative z-10 -mt-20 sm:-mt-24 ${STAGE}`}>
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-e2">
          <div className={cn('relative h-44 overflow-hidden bg-gradient-to-b sm:h-56', citySky(club.city))}>
            {photo ? (
              <Image src={photo} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
            ) : (
              <CityScene city={club.city} className="absolute inset-0 h-full w-full" />
            )}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-ui-sm font-bold text-white backdrop-blur-sm">
              <MapPin size={13} aria-hidden="true" />
              {club.city}
            </span>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_16rem] md:items-start">
            <div>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-slate-900">
                {club.name}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-ui text-slate-500">
                <Users size={15} className="text-slate-400" aria-hidden="true" />
                <span className="font-mono font-bold tabular-nums text-slate-900">{club.memberCount}</span>
                {club.memberCount === 1 ? 'member' : 'members'}
              </p>
              {club.description ? (
                <p className="mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-slate-600">{club.description}</p>
              ) : null}
            </div>

            <div>
              <ClubJoinButton
                clubId={club.id}
                initiallyJoined={club.isJoined ?? false}
                signedIn={Boolean(user)}
                signInRedirect={path}
                refreshAfter
              />
              <Link
                href="/community"
                className="mt-4 flex items-center justify-center gap-1.5 text-ui-sm font-semibold text-plug-blue-600 hover:underline"
              >
                <MessageSquare size={14} aria-hidden="true" />
                Talk to EV owners on the community board
              </Link>
            </div>
          </div>
        </section>

        {/* ── Members ──────────────────────────────────────────── */}
        <section aria-labelledby="members-heading" className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="members-heading" className="text-lg font-bold text-slate-900">
            Members
            {club.memberCount > club.members.length ? (
              <span className="ml-2 text-ui-sm font-normal text-slate-500">
                newest {club.members.length} of {club.memberCount}
              </span>
            ) : null}
          </h2>

          {club.members.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <Users size={26} className="mx-auto text-slate-300" aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-900">No members yet</p>
              <p className="mt-1 text-ui-sm text-slate-500">Be the first EV owner in {club.city} to join.</p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {club.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <Avatar name={member.displayName} src={member.avatar ?? undefined} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-ui-sm font-semibold text-slate-900">
                      {member.displayName}
                      {user && member.id === user.id ? <span className="ml-1 text-slate-400">(you)</span> : null}
                    </p>
                    <p className="truncate text-ui-xs text-slate-500">
                      {member.vehicle ? `${member.vehicle} · ` : ''}
                      <span suppressHydrationWarning>joined {formatRelativeTime(member.joinedAt).toLowerCase()}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
