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
import { StatsBar } from '@/components/home/StatsBar'
import { Reveal } from '@/components/ui'
import { getPlatformStats } from '@/lib/db/queries'

/**
 * Reads live counts, so the page cannot be baked at build time — adding a
 * station in the admin or a visitor signing up has to move the figures
 * without a redeploy.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const stats = await getPlatformStats()

  return (
    <>
      {/* The hero animates on load; everything past the fold reveals on
          approach so the page reads as a sequence rather than a dump.
          StatsBar is excluded — it runs its own count-up observer. */}
      <Hero />
      <StatsBar stations={stats.stations} cities={stats.cities} owners={stats.owners} />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <FeaturedStations />
      </Reveal>
      <Reveal>
        <FreeBanner />
      </Reveal>
      <Reveal>
        <RoutePlannerPromo />
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
