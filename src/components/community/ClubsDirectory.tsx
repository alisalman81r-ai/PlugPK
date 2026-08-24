// src/components/community/ClubsDirectory.tsx
import { MapPin, Users } from 'lucide-react'
import Link from 'next/link'

import { cityPhoto } from '@/lib/city-photos'
import type { EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ClubCard } from './ClubCard'

/**
 * The clubs directory, as one card rather than a loose grid.
 *
 * It used to be a centred SectionHeader over four columns of cards, floating on
 * the page with nothing holding it — which made a directory of eight clubs read
 * as a marketing section. Built like the planner's popular-routes card and the
 * board's browse card instead: a header band that says what is in the card and
 * how much of it, then the contents.
 *
 * The closing prompt used to link to /community/clubs/new, a route that does not
 * exist — so the one call to action on the page returned a 404. It goes to the
 * board now, which is where somebody starting a club would actually find the
 * other three people in their city.
 */

export interface ClubsDirectoryProps {
  clubs: EVClub[]
  className?: string
}

export function ClubsDirectory({ clubs, className }: ClubsDirectoryProps) {
  const cities = new Set(clubs.map((club) => club.city)).size


  return (
    <section
      aria-labelledby="clubs-directory-heading"
      className={cn(
        'overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-e4',
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
            <Users size={13} aria-hidden="true" />
            EV clubs
          </p>
          <h2
            id="clubs-directory-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            Find your club
          </h2>
          <p className="mt-1.5 text-ui text-slate-500">
            Owner groups that meet, charge and road-trip together.
          </p>
        </div>

        {clubs.length > 0 ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-ui-xs font-semibold text-slate-500">
            <MapPin size={12} aria-hidden="true" />
            {cities} {cities === 1 ? 'city' : 'cities'}
          </span>
        ) : null}
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        {clubs.length === 0 ? (
          <div className="py-14 text-center">
            <Users size={56} className="mx-auto text-slate-200" aria-hidden="true" />
            <p className="mt-5 font-display text-xl font-bold text-slate-900">No clubs listed yet</p>
            <p className="mt-2 text-ui text-slate-500">
              As owners organise in each city, their clubs appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {clubs.map((club, index) => (
              <ClubCard
                key={club.id}
                club={club}
                /*
                  Resolved here rather than in the card, because it reads the
                  filesystem and only a server component can. The club's own
                  photograph wins over the city's: a club that has uploaded one
                  should show itself, not its skyline.
                */
                photo={club.coverPhoto ?? cityPhoto(club.city)}
                animationDelay={index * 80}
                className="animate-fade-up opacity-0"
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 text-center sm:px-6 lg:px-8">
        <p className="text-ui text-slate-500">
          Nothing in your city?{' '}
          <Link
            href="/community"
            className="font-semibold text-plug-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            Post on the board
          </Link>{' '}
          and find the other owners near you.
        </p>
      </div>
    </section>
  )
}
