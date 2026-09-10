// src/app/(main)/page.tsx
import { AppBanner } from '@/components/home/AppBanner'
import { PartnerCTA } from '@/components/home/PartnerCTA'
import { CommunityPreview } from '@/components/home/CommunityPreview'
import { FreeBanner } from '@/components/home/FreeBanner'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { RoutePlannerPromo } from '@/components/home/RoutePlannerPromo'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { StatsBar } from '@/components/home/StatsBar'
import { Reveal } from '@/components/ui'
import { readOrFallback } from '@/lib/db/availability'
import { getClubs, getCommunityCounts, getPlatformStats } from '@/lib/db/queries'
import type { EVClub } from '@/lib/types'

/**
 * Cached, not dynamic.
 *
 * This was force-dynamic so the live figures could move, which meant every
 * visit re-queried the database and re-rendered the whole page — the slowest
 * public route by a wide margin, and the one people land on first.
 *
 * It does not need to be. Every write that changes what this page shows
 * already calls revalidatePath('/'): the admin station, service and connector
 * actions, and registerUser. So the page can be served from cache and
 * regenerated the moment something actually changes, rather than rebuilt on
 * the chance that it might have.
 *
 * The interval below is a backstop, not the mechanism — it only matters if a
 * row is ever changed outside those actions, such as directly in the
 * database.
 */
export const revalidate = 300

/**
 * The figures and the club rail are supplementary; the page is not.
 *
 * Every one of these three reads is a counter or a rail sitting between
 * sections that need no database at all — the hero, how-it-works, the services
 * grid, the banners. Awaiting them bare meant a database that could not answer
 * took the whole landing page down to the error boundary, header and all, which
 * is what a visitor met on the first deploy: a slow wait, then "This page did
 * not load".
 *
 * Falling back renders the page without the numbers instead. See
 * lib/db/availability for what is treated as unavailable and what still throws.
 */
export default async function HomePage() {
  const [stats, clubs, communityCounts] = await Promise.all([
    readOrFallback('/ platform stats', { stations: 0, cities: 0, owners: 0 }, getPlatformStats),
    readOrFallback('/ clubs', [] as EVClub[], () => getClubs()),
    readOrFallback(
      '/ community counts',
      { discussions: 0, replies: 0, clubs: 0, cities: 0, clubMembers: 0 },
      getCommunityCounts,
    ),
  ])

  return (
    <>
      {/* The hero animates on load; everything past the fold reveals on
          approach so the page reads as a sequence rather than a dump.
          StatsBar is excluded — it runs its own count-up observer. */}
      <Hero cities={stats.cities} />
      <StatsBar stations={stats.stations} cities={stats.cities} owners={stats.owners} />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <RoutePlannerPromo />
      </Reveal>
      {/* The services grid sits where the featured-stations rail used to. */}
      <Reveal>
        <ServicesPreview />
      </Reveal>
      <Reveal>
        <FreeBanner />
      </Reveal>
      <Reveal>
        <CommunityPreview clubs={clubs.slice(0, 3)} counts={communityCounts} />
      </Reveal>
      <Reveal>
        <PartnerCTA />
      </Reveal>
      <Reveal>
        <AppBanner />
      </Reveal>
    </>
  )
}
