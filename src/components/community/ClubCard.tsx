// src/components/community/ClubCard.tsx
'use client'

import { ArrowRight, MapPin, Users } from '@/components/ui/icons'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CityLandmark, CityScene, cityLandmarkLabel, citySky } from './CityLandmark'
import { ClubJoinButton } from './ClubJoinButton'

/**
 * One club, as a landing-v2 card: white, 28px corners, a hairline, lifting on
 * hover.
 *
 * The cover is a photograph of the club's city where the project has one, and
 * that city drawn as a scene (CityScene) where it does not — see lib/city-photos.
 * The city sits on the cover, which frees the line under the name for the one
 * figure that decides whether a club is worth joining: how many people are in
 * it, in mono. Joining ticks that figure up by one, optimistically.
 */

export interface ClubCardProps {
  club: EVClub
  /**
   * The cover photograph, already resolved by a server component (finding it
   * reads the filesystem). Null falls back to the city's drawn scene.
   */
  photo?: string | null
  variant?: 'default' | 'compact'
  /** Whether someone is signed in. Signed out, Join leads to sign-in and back. */
  signedIn?: boolean
  animationDelay?: number
  className?: string
}

export function ClubCard({
  club,
  photo,
  variant = 'default',
  signedIn = false,
  animationDelay,
  className,
}: ClubCardProps) {
  /*
    Joining is free and real: the button writes a ClubMember row through
    joinClub (community-actions.ts), answers at once and rolls back with a
    message if the server refuses.
  */
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined
  const [memberCount, setMemberCount] = React.useState(club.memberCount)
  // A fresh server render is the truth again.
  React.useEffect(() => setMemberCount(club.memberCount), [club.memberCount])
  const href = `/community/clubs/${club.id}`

  /* ── Compact ──────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <div
        style={style}
        className={cn('flex items-center gap-3 rounded-[18px] border border-ink/10 bg-white p-3', className)}
      >
        <span
          aria-hidden="true"
          className={cn('relative flex h-11 w-11 shrink-0 items-end overflow-hidden rounded-xl bg-gradient-to-b', citySky(club.city))}
        >
          <CityLandmark city={club.city} className="h-8 w-full" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{club.name}</span>
          <span className="block truncate text-xs text-muted">
            {club.city} · <span className="font-mono">{memberCount}</span> {memberCount === 1 ? 'member' : 'members'}
          </span>
        </span>
      </div>
    )
  }

  /* ── Default ──────────────────────────────────────────────────── */
  return (
    <article
      style={style}
      className={cn(
        'group/club flex h-full flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1',
        '[transition:transform_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:-translate-y-1 hover:border-ink/20 hover:shadow-e2',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {/* ── Cover ────────────────────────────────────────────────── */}
      <div className={cn('relative m-2 mb-0 h-[9.5rem] shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-b', citySky(club.city))}>
        {photo ? (
          // Empty alt: the chip names the city and the heading names the club.
          <Image
            src={photo}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover/club:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/club:scale-100"
          />
        ) : (
          <>
            <CityScene
              city={club.city}
              className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-out group-hover/club:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/club:scale-100"
            />
            {/* Names the building for anyone who cannot see the drawing. */}
            <span className="sr-only">{cityLandmarkLabel(club.city)}</span>
          </>
        )}

        {/* A scrim so the chip always has a dark ground, photo or drawing. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
        />

        <span className="absolute left-3 top-3 inline-flex h-[26px] items-center gap-1.5 rounded-full bg-ink/70 px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
          <MapPin size={11} aria-hidden="true" />
          {club.city}
        </span>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="font-display text-[22px] leading-[1.15] text-ink">
          <Link href={href} className="hover:underline hover:decoration-volt-ink hover:underline-offset-4">
            {club.name}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <Users size={14} className="shrink-0" aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-ink">{memberCount}</span>
          {memberCount === 1 ? 'member' : 'members'}
        </p>

        {club.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-[1.6] text-muted">{club.description}</p>
        ) : null}

        {/* mt-auto keeps the row of buttons level across cards of different length. */}
        <Link
          href={href}
          className="group/view mt-auto inline-flex h-11 items-center justify-center gap-1.5 pt-3 text-sm font-semibold text-ink"
        >
          View club and members
          <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-300 ease-spring group-hover/view:translate-x-[3px]" />
        </Link>
        <ClubJoinButton
          clubId={club.id}
          initiallyJoined={club.isJoined ?? false}
          signedIn={signedIn}
          signInRedirect="/community/clubs"
          onChange={(joined) => setMemberCount((count) => Math.max(0, count + (joined ? 1 : -1)))}
          className="mt-2"
        />
      </div>
    </article>
  )
}
