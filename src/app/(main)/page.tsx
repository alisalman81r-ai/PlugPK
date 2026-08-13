// src/app/(main)/page.tsx
import { AppBanner } from '@/components/home/AppBanner'
import { BusinessCTA } from '@/components/home/BusinessCTA'
import { CommunityPreview } from '@/components/home/CommunityPreview'
import { FeaturedStations } from '@/components/home/FeaturedStations'
import { FreeBanner } from '@/components/home/FreeBanner'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { RoutePlannerPromo } from '@/components/home/RoutePlannerPromo'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { Reveal } from '@/components/ui'
import { getPlatformStats, getStations } from '@/lib/db/queries'
import { getPortAvailability } from '@/lib/utils'

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

export default async function HomePage() {
  const [stats, stations] = await Promise.all([getPlatformStats(), getStations()])

  // Ranked, so "highest-rated" describes the selection rather than the
  // order rows happen to sit in.
  const topRated = [...stations].sort((a, b) => b.rating - a.rating).slice(0, 3)

  // The hero's bottom strip quotes real figures rather than claims, so they
  // are counted here alongside everything else the page already reads.
  const ports = stations.reduce(
    (totals, station) => {
      const s = getPortAvailability(station)
      return { available: totals.available + s.available, total: totals.total + s.total }
    },
    { available: 0, total: 0 },
  )
  const best = topRated[0]

  return (
    <>
      {/* The hero carries its own figures along the bottom, so there is no
          separate stats band — the two were showing the same station and city
          counts one below the other. Everything past the fold reveals on
          approach so the page reads as a sequence rather than a dump. */}
      <Hero
        stations={stats.stations}
        cities={stats.cities}
        portsFree={ports.available}
        portsTotal={ports.total}
        topRating={best?.rating ?? 0}
        topReviewCount={best?.reviewCount ?? 0}
      />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <RoutePlannerPromo />
      </Reveal>
      <Reveal>
        <FeaturedStations stations={topRated} />
      </Reveal>
      <Reveal>
        <FreeBanner />
      </Reveal>
      <Reveal>
        <ServicesPreview />
      </Reveal>
      <Reveal>
        <CommunityPreview />
      </Reveal>
      <Reveal>
        <BusinessCTA />
      </Reveal>
      <Reveal>
        <AppBanner />
      </Reveal>
    </>
  )
}
