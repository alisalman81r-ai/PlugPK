// src/components/community/ClubsDirectory.tsx
import { MapPin, Users } from '@/components/ui/icons'
import Link from 'next/link'

import { Lift, LiftBody, LiftHead, Tag } from '@/components/v2/ui'
import { cityPhoto } from '@/lib/city-photos'
import { STAGGER } from '@/lib/motion'
import type { EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ClubCard } from './ClubCard'

/**
 * The clubs directory as landing-v2's lifted sheet (.lift): a header band that
 * says what is in it and how much, then the cards, then a way forward for a
 * reader whose city has no club yet (the board — /community/clubs/new never
 * existed).
 */

export interface ClubsDirectoryProps {
  clubs: EVClub[]
  /** Whether the reader is signed in; decides between Join and "Sign in to join". */
  signedIn?: boolean
  className?: string
}

export function ClubsDirectory({ clubs, signedIn = false, className }: ClubsDirectoryProps) {
  const cities = new Set(clubs.map((club) => club.city)).size

  return (
    <Lift className={className}>
      <section aria-labelledby="clubs-directory-heading" className="scroll-mt-28" id="clubs-directory">
        <LiftHead
          className="items-end"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Users size={12} aria-hidden="true" />
              EV clubs
            </span>
          }
          title={<span id="clubs-directory-heading">Find your club</span>}
          meta="Owner groups that meet, charge and road-trip together."
          actions={
            clubs.length > 0 ? (
              <Tag mono>
                <MapPin aria-hidden="true" />
                {cities} {cities === 1 ? 'city' : 'cities'}
              </Tag>
            ) : null
          }
        />

        <LiftBody className="sm:pb-8 sm:pt-7">
          {clubs.length === 0 ? (
            <div className="grid justify-items-center gap-3 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-chalk text-ink">
                <Users size={26} aria-hidden="true" />
              </span>
              <p className="mt-1 font-display text-2xl text-ink">No clubs listed yet</p>
              <p className="text-[15px] text-muted">As owners organise in each city, their clubs appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {clubs.map((club, index) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  /* The club's own photograph wins over its city's skyline. */
                  photo={club.coverPhoto ?? cityPhoto(club.city)}
                  signedIn={signedIn}
                  animationDelay={index * STAGGER.TIGHT}
                  className="animate-fade-up opacity-0 [animation-fill-mode:both]"
                />
              ))}
            </div>
          )}
        </LiftBody>

        <div className={cn('border-t border-ink/10 bg-chalk/60 px-[18px] py-5 text-center sm:px-7')}>
          <p className="text-[15px] text-muted">
            Nothing in your city?{' '}
            <Link
              href="/community"
              className="font-semibold text-ink underline decoration-volt-ink/40 underline-offset-4 hover:decoration-volt-ink"
            >
              Post on the board
            </Link>{' '}
            and find the other owners near you.
          </p>
        </div>
      </section>
    </Lift>
  )
}
