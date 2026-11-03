// src/app/(main)/community/clubs/[id]/page.tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { CityScene, citySky } from '@/components/community/CityLandmark'
import { ClubJoinButton } from '@/components/community/ClubJoinButton'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowLeft, ArrowRight, MapPin, MessageSquare, Users } from '@/components/ui/icons'
import { Eyebrow, HeroStats, Hl, Lift, PageHero } from '@/components/v2/ui'
import { cityPhoto } from '@/lib/city-photos'
import { getClubDetail } from '@/lib/db/community-queries'
import { getCurrentUser } from '@/lib/db/session-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

/**
 * One club's own page: what it is, who is in it, and Join / Leave — in the
 * community's landing-v2 language: the ink hero, then a sheet lifted into it
 * holding the cover, the join panel and the member list.
 *
 * Dynamic: it reads the session to show the reader's own membership, and the
 * member list changes with every join.
 */

const loadClub = cache((id: string, userId?: string) => getClubDetail(id, userId))

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const club = await loadClub(params.id)
  if (!club) return { title: 'Club not found' }
  return {
    title: `${club.name} — EV club in ${club.city}`,
    description: club.description || `The ${club.city} EV owners' club on plugpk.`,
    alternates: { canonical: `/community/clubs/${club.id}` },
  }
}

/** The club's name with its last word as the highlighted phrase. */
function nameTitle(name: string) {
  const at = name.trim().lastIndexOf(' ')
  if (at <= 0) return <Hl dark>{name}</Hl>
  return (
    <>
      {name.slice(0, at)} <Hl dark>{name.slice(at + 1)}</Hl>
    </>
  )
}

export default async function ClubPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  const club = await loadClub(params.id, user?.id)
  if (!club) notFound()

  const photo = club.coverPhoto ?? cityPhoto(club.city)
  const path = `/community/clubs/${club.id}`

  return (
    <div className="bg-chalk pb-[clamp(56px,6vw,96px)]">
      <PageHero
        eyebrow={
          <Link
            href="/community/clubs"
            className="group/back -my-3 inline-flex min-h-11 items-center gap-2 rounded-full transition-colors hover:text-white"
          >
            <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-300 group-hover/back:-translate-x-0.5" />
            All clubs
          </Link>
        }
        title={nameTitle(club.name)}
        sub={club.description || `The ${club.city} EV owners' club on plugpk.`}
      >
        <HeroStats
          items={[
            {
              value: (
                <span className="inline-flex items-center gap-2">
                  <Users size={16} className="text-volt" aria-hidden="true" />
                  <span data-count={club.memberCount}>{club.memberCount.toLocaleString('en-PK')}</span>
                </span>
              ),
              label: club.memberCount === 1 ? 'member' : 'members',
            },
            {
              value: (
                <span className="inline-flex items-center gap-2 font-sans text-[20px] sm:text-[26px]">
                  <MapPin size={16} className="text-volt" aria-hidden="true" />
                  {club.city}
                </span>
              ),
              label: 'city',
            },
          ]}
        />
      </PageHero>

      <Lift>
        {/* ── Cover ──────────────────────────────────────────── */}
        <div className={cn('relative m-2 h-48 overflow-hidden rounded-[18px] bg-gradient-to-b sm:m-3 sm:h-64 sm:rounded-[24px]', citySky(club.city))}>
          {photo ? (
            <Image src={photo} alt="" fill priority sizes="(max-width: 1320px) 100vw, 1320px" className="object-cover" />
          ) : (
            <CityScene city={club.city} className="absolute inset-0 h-full w-full" />
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent"
          />
          <span className="absolute left-4 top-4 inline-flex h-[30px] items-center gap-1.5 rounded-full bg-ink/70 px-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
            <MapPin size={13} aria-hidden="true" />
            {club.city}
          </span>
        </div>

        <div className="grid gap-6 px-[18px] pb-7 pt-4 sm:px-7 md:grid-cols-[minmax(0,1fr)_300px] md:items-start md:gap-8">
          {/* ── Members ──────────────────────────────────────── */}
          <section aria-labelledby="members-heading" className="order-2 min-w-0 md:order-1">
            <Eyebrow className="mb-2">
              <Users size={12} aria-hidden="true" />
              Members
            </Eyebrow>
            <h2 id="members-heading" className="font-display text-[26px] leading-[1.1] text-ink">
              Who&apos;s in it
              {club.memberCount > club.members.length ? (
                <span className="ml-2 font-mono text-sm font-medium text-muted [-webkit-text-stroke:0]">
                  newest {club.members.length} of {club.memberCount}
                </span>
              ) : null}
            </h2>

            {club.members.length === 0 ? (
              <div className="mt-5 grid justify-items-center gap-2 rounded-[22px] border border-dashed border-ink/20 bg-white px-6 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-chalk text-ink">
                  <Users size={22} aria-hidden="true" />
                </span>
                <p className="mt-1 font-semibold text-ink">No members yet</p>
                <p className="text-sm text-muted">Be the first EV owner in {club.city} to join.</p>
              </div>
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {club.members.map((member) => (
                  <li key={member.id} data-reveal="" className="flex items-center gap-3 rounded-[18px] border border-ink/10 bg-white p-3">
                    <Avatar name={member.displayName} src={member.avatar ?? undefined} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {member.displayName}
                        {user && member.id === user.id ? <span className="ml-1 text-muted">(you)</span> : null}
                      </p>
                      <p className="truncate font-mono text-xs text-muted">
                        {member.vehicle ? `${member.vehicle} · ` : ''}
                        <span suppressHydrationWarning>joined {formatRelativeTime(member.joinedAt).toLowerCase()}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Join panel ───────────────────────────────────── */}
          <aside aria-label="Membership" className="rounded-[22px] border border-ink/10 bg-white p-5 shadow-e1 order-1 md:order-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">Membership</p>
            <p className="mt-2 flex items-baseline gap-2">
              <b data-count={club.memberCount} className="font-mono text-[34px] font-semibold leading-none tabular-nums text-ink">
                {club.memberCount}
              </b>
              <span className="text-sm text-muted">{club.memberCount === 1 ? 'member' : 'members'} · free to join</span>
            </p>
            <ClubJoinButton
              clubId={club.id}
              initiallyJoined={club.isJoined ?? false}
              signedIn={Boolean(user)}
              signInRedirect={path}
              refreshAfter
              className="mt-4"
            />
            <Link
              href="/community"
              className="group/board mt-2 flex min-h-11 items-center justify-center gap-1.5 text-center text-sm font-semibold text-ink"
            >
              <MessageSquare size={14} aria-hidden="true" />
              Talk to EV owners on the board
              <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 group-hover/board:translate-x-[3px]" />
            </Link>
          </aside>
        </div>
      </Lift>
    </div>
  )
}
