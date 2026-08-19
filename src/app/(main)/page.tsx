// src/app/(main)/page.tsx
import { AppBanner } from '@/components/home/AppBanner'
import { BusinessCTA } from '@/components/home/BusinessCTA'
import { CommunityPreview } from '@/components/home/CommunityPreview'
import { FreeBanner } from '@/components/home/FreeBanner'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { RoutePlannerPromo } from '@/components/home/RoutePlannerPromo'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { StatsBar } from '@/components/home/StatsBar'
import { Reveal } from '@/components/ui'
import { getPlatformStats } from '@/lib/db/queries'

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
  const stats = await getPlatformStats()

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
