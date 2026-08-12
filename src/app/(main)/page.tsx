// src/app/(main)/page.tsx
import { AppBanner } from '@/components/home/AppBanner'
import { BusinessCTA } from '@/components/home/BusinessCTA'
import { CommunityPreview } from '@/components/home/CommunityPreview'
import { FeaturedStations } from '@/components/home/FeaturedStations'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { RoutePlannerPromo } from '@/components/home/RoutePlannerPromo'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { StatsBar } from '@/components/home/StatsBar'
import { Reveal } from '@/components/ui'

export default function HomePage() {
  return (
    <>
      {/* The hero animates on load; everything past the fold reveals on
          approach so the page reads as a sequence rather than a dump.
          StatsBar is excluded — it runs its own count-up observer. */}
      <Hero />
      <StatsBar />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <FeaturedStations />
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
