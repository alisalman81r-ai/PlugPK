// src/components/community/ClubCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Check, MapPin, UserPlus, Users } from 'lucide-react'
import Image from 'next/image'

import { hoverTrigger } from '@/components/ui'
import type { EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CityLandmark, CityScene, cityLandmarkLabel, citySky } from './CityLandmark'

/**
 * One club.
 *
 * The cover is a photograph of the club's city where the project has one, and
 * that city drawn as a scene (CityScene) where it does not — see lib/city-photos
 * for how a photograph gets found, and how to add one.
 *
 * It used to be a flat gradient carrying a ghosted Users icon and a 48px
 * translucent initial: the shape a card has before its artwork loads. Eight of
 * them in a grid read as eight things still loading, and the only thing telling
 * you where the club was, was the caption underneath.
 *
 * The rest follows from that. The city moved onto the cover, where the drawing
 * already puts it, which frees the line under the title for the one figure that
 * decides whether a club is worth joining — how many people are in it, set in
 * the mono face the rest of the site uses for counted things. And joining ticks
 * that figure up by one, the way liking a post ticks its count: an optimistic
 * local count, so the button proves it did something without a round trip.
 */

export interface ClubCardProps {
  club: EVClub
  /**
   * The cover photograph, already resolved.
   *
   * Passed in rather than looked up here: finding it means reading the
   * filesystem (see lib/city-photos), which only a server component can do, and
   * this card is a client component because of its join button. The caller
   * resolves `club.coverPhoto` first, then the city's photo.
   *
   * Null or absent falls back to the city's drawn landmark, so a club in a city
   * with no photography still gets a cover rather than a grey box.
   */
  photo?: string | null
  variant?: 'default' | 'compact'
  animationDelay?: number
  className?: string
}

export function ClubCard({
  club,
  photo,
  variant = 'default',
  animationDelay,
  className,
}: ClubCardProps) {
  /*
    Read from the server, never from a click.

    This was React state that a click toggled, so the button reported a
    membership nobody had: nothing was written, and a reload put it straight
    back to "Join club". It looked like the feature worked, which is worse than
    it plainly not existing — the one bug a Join button must not have.

    Phase 1 removes the pretence. The button now renders the truth the database
    gave it and does nothing when pressed; the action that opens checkout
    arrives with Stripe in a later phase.
  */
  const isJoined = club.isJoined ?? false
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined

  /*
    The count as the query gave it. The local adjustment that used to sit here
    existed only to make the fake join look real; with nothing joining
    client-side there is nothing to adjust, and an unadjusted figure is one
    fewer place for the page to disagree with the database.
  */
  const memberCount = club.memberCount

  /* ── Compact ──────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <motion.div
        {...hoverTrigger}
        style={style}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3',
          className,
        )}
      >
        {/* The same drawing at thumbnail scale. At 44px the buildings are a
            mark rather than a scene, which is all this row has space for. */}
        <span
          aria-hidden="true"
          className={cn(
            'relative flex h-11 w-11 shrink-0 items-end overflow-hidden rounded-xl bg-gradient-to-b',
            citySky(club.city),
          )}
        >
          <CityLandmark city={club.city} className="h-8 w-full" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-ui-sm font-bold text-slate-900">{club.name}</span>
          <span className="block truncate text-ui-xs text-slate-400">
            {club.city} · <span className="font-mono">{memberCount}</span> members
          </span>
        </span>
      </motion.div>
    )
  }

  /* ── Default ──────────────────────────────────────────────────── */
  return (
    <motion.article
      {...hoverTrigger}
      style={style}
      className={cn(
        'group/club flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1',
        'transition-all duration-[250ms] hover:-translate-y-1 hover:border-plug-blue-200 hover:shadow-card-hover',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {/* ── Cover ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative h-[8.5rem] shrink-0 overflow-hidden bg-gradient-to-b',
          citySky(club.city),
        )}
      >
        {photo ? (
          /*
            The photograph, when the project has one.

            alt is empty: the chip below names the city and the heading names the
            club, so describing the picture too would make a screen reader read
            the same place three times. The gradient behind it is what shows
            while it loads, so there is no grey flash and no layout shift.

            `sizes` matches what the grid actually does — one column on a phone,
            two from sm, four from xl — so a 280px slot downloads a 384px
            variant rather than the 1200px original.
          */
          <Image
            src={photo}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover/club:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/club:scale-100"
          />
        ) : (
          <>
            {/* The city as a scene, at the cover's own 2:1 — sky, sun, hills,
                the landmark, then trees in front. It carries its own sky, so
                the wrapper's gradient only ever shows through the corners of a
                cover that is not exactly 2:1. */}
            <CityScene
              city={club.city}
              className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover/club:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/club:scale-100"
            />

            {/* Names the building for anyone who cannot see it — the one thing
                the drawing carries that the card's text does not. A photograph
                needs no equivalent: it shows the city, which the chip already
                says. */}
            <span className="sr-only">{cityLandmarkLabel(club.city)}</span>
          </>
        )}

        {/* The chip has no idea what is behind it — a photograph's pale sky, or
            a scene's, would leave white text on white. This scrim guarantees it
            a dark ground without dimming the whole picture, and it is needed
            over the drawn scenes just as much as over a photograph. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
        />

        {/* The city, on the cover that depicts it. It used to sit in the body
            competing with the member count for the same line. */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/25 px-2.5 py-1 text-ui-xs font-bold text-white backdrop-blur-sm">
          <MapPin size={11} aria-hidden="true" />
          {club.city}
        </span>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-ui-lg font-bold leading-snug tracking-tight text-slate-900">
          {club.name}
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-ui-sm text-slate-500">
          <Users size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="font-mono font-bold tabular-nums text-slate-900">{memberCount}</span>
          members
        </p>

        {club.description ? (
          <p className="mt-3 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">
            {club.description}
          </p>
        ) : null}

        {/* mt-auto rather than a fixed description height: the descriptions run
            to different lengths, and pinning the button to the bottom keeps the
            row of buttons level without capping what the copy can say. */}
        <button
          type="button"
          /*
            Deliberately inert in Phase 1. Wiring it to a server action that
            creates a membership would give away for free the thing the next
            phase exists to sell, so it waits for checkout rather than being
            hooked up to something that skips payment.
          */
          disabled
          aria-pressed={isJoined}
          title={isJoined ? undefined : 'Joining opens with card payment shortly.'}
          className={cn(
            'mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-ui font-bold transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isJoined
              ? 'border border-green-200 bg-green-50 text-green-700 focus-visible:ring-green-500'
              : 'bg-plug-blue-600 text-white focus-visible:ring-plug-blue-500',
            // No hover lift and a blocked cursor: a control that cannot be
            // pressed should not answer the pointer as though it can.
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isJoined ? (
            <>
              <Check size={16} aria-hidden="true" />
              Joined
            </>
          ) : (
            <>
              <UserPlus size={16} aria-hidden="true" />
              Join club
            </>
          )}
        </button>
      </div>
    </motion.article>
  )
}
