// src/app/(main)/community/clubs/page.tsx
import { ChevronLeft, MapPin, Users, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ClubsDirectory } from '@/components/community/ClubsDirectory'
import { PillButton } from '@/components/ui'
import { getClubs } from '@/lib/db/queries'

export const metadata: Metadata = {
  title: 'EV Clubs Pakistan',
  description:
    'Find and join EV clubs in your city. Connect with electric vehicle owners across Pakistan.',
}

/**
 * Clubs come from the database now rather than the fixture, so the member
 * counts move when somebody joins instead of being the same eight numbers for
 * everyone forever.
 */
export const revalidate = 300

/**
 * One measure, matching /community, /map and /routes.
 *
 * This page was on `container-plug` (1280px) while its own parent route works to
 * 1400px, so walking from the board to the clubs directory narrowed the page for
 * no reason a reader could see.
 */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/** How far the directory card is pulled up into the dark band above it. */
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export default async function CommunityClubsPage() {
  const clubs = await getClubs()

  /**
   * Counted at render time, like every other figure in this band.
   *
   * The page used to print no figures at all, which was at least honest — but
   * it also meant the one thing a directory should tell you before you scroll,
   * how much is in it, was missing.
   */
  const cities = new Set(clubs.map((club) => club.city)).size
  const members = clubs.reduce((total, club) => total + club.memberCount, 0)

  return (
    <div className="min-h-below-nav bg-slate-50">
      {/*
        The same band as /community, /map and /routes: slate-950 with discrete
        pools of light, rounded off at the bottom, with the next card lifted up
        into it. This was `bg-gradient-hero` — the flat navy-to-teal ramp the
        other heroes dropped, because it put the heading on one colour and
        everything below it on a visibly different one.
      */}
      <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-32 pt-8 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
          <div className="absolute -bottom-48 right-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
        </div>

        <div className={`relative ${STAGE}`}>
          <Link
            href="/community"
            className="group/back inline-flex items-center gap-1.5 rounded-full text-ui-sm font-semibold text-white/70 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950"
          >
            <ChevronLeft
              size={16}
              className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
              aria-hidden="true"
            />
            Community
          </Link>

          <div className="mx-auto mt-8 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
              <Users size={12} aria-hidden="true" />
              Owner clubs
            </span>

            <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
              EV clubs{' '}
              <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
                across Pakistan
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
              {clubs.length === 0 ? (
                <>
                  No clubs are listed yet. As owners organise in each city, their groups appear
                  here.
                </>
              ) : (
                <>
                  {clubs.length} owner {clubs.length === 1 ? 'group' : 'groups'} in{' '}
                  {cities} {cities === 1 ? 'city' : 'cities'} — for meetups, charging advice and
                  road trips with people driving the same car.
                </>
              )}
            </p>

            {/*
              The one thing to do on this page, at the size that says so.
              PillButton's `light` tone — white pill, dark badge, the travelling
              arrow — because this band is dark; it is the same button the home
              page uses for "Plan a route", and reusing it means the site has one
              prominent CTA shape rather than a new one per section.

              It points at /signup rather than at the directory below: the
              directory is already the next thing on screen, and joining a club
              needs an account before it needs a choice of club. Labelled for
              that step rather than "Join the club" — which is the button that
              brought the reader here, and two identical labels leading to two
              different places is how a funnel stops reading as one.
            */}
            <div className="mt-8 flex justify-center">
              <PillButton href="/signup" tone="light">
                Sign up to join
              </PillButton>
            </div>

            {/*
              Two figures, not three. Cities is already in the sentence above and
              on the directory card's badge, and with one club per city a third
              stat would have printed the same 8 twice — which reads as a bug in
              the counting rather than a fact about the clubs.
            */}
            {clubs.length > 0 ? (
              <dl className="mx-auto mt-7 flex max-w-lg flex-wrap items-center justify-center divide-white/10 sm:divide-x">
                <Stat
                  icon={Users}
                  value={clubs.length}
                  label={clubs.length === 1 ? 'club' : 'clubs'}
                />
                <Stat icon={MapPin} value={members} label="members between them" tone="cyan" />
              </dl>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── The directory, lifted into the band ───────────────────── */}
      <div className={`relative z-10 ${CARD_LIFT} ${STAGE} pb-20`}>
        <ClubsDirectory clubs={clubs} />
      </div>
    </div>
  )
}

/**
 * One figure in the band.
 *
 * The same Stat as the map, routes and community heroes — mono numeral, hairline
 * divider, label small enough that the number is what the eye lands on.
 */
function Stat({
  icon: Icon,
  value,
  label,
  tone = 'plain',
}: {
  icon?: LucideIcon
  value: number
  label: string
  tone?: 'plain' | 'cyan'
}) {
  return (
    <div className="px-5 py-1 text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-center justify-center gap-1.5">
          {Icon ? (
            <Icon
              size={14}
              aria-hidden={true}
              className={tone === 'cyan' ? 'text-plug-cyan-400' : 'text-white/40'}
            />
          ) : null}
          <span className="font-mono text-lg font-bold text-white">
            {value.toLocaleString('en-PK')}
          </span>
        </span>
        <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/45">
          {label}
        </span>
      </dd>
    </div>
  )
}
