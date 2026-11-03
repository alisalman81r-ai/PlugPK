// src/app/(main)/page.tsx
import type { Metadata } from 'next'

import { CityTicker, HomeHero } from '@/components/home/v2/HomeHero'
import { HomeMotion } from '@/components/home/v2/HomeMotion'
import { Loader } from '@/components/home/v2/Loader'
import { AppBand, CommunityBand, PartnerBand, ServicesBand } from '@/components/home/v2/HomeSections'
import { HowItWorks, RouteBand, Statement } from '@/components/home/v2/HomeStory'
import { POPULAR_CITIES } from '@/lib/constants'
import { readOrFallback } from '@/lib/db/availability'
import {
  getCommunityClubs,
  getCommunityFigures,
  getLatestPosts,
  type CommunityFigures,
} from '@/lib/db/community-queries'
import { getHeroStats, getHowItWorksData, getServiceCategoryCounts } from '@/lib/db/queries'
import type { CommunityPost, EVClub } from '@/lib/types'

export const metadata: Metadata = {
  // `absolute`: the root template would make this "… | plugpk | plugpk".
  title: { absolute: "plugpk — EV chargers, route planning and cars in Pakistan" },
  description:
    'Find EV charging stations across Pakistan, plan long drives around your car’s real range, compare electric cars and ask other EV drivers.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'plugpk — EV chargers, route planning and cars in Pakistan',
    description:
      'Find EV charging stations across Pakistan, plan long drives around your car’s real range, and compare electric cars.',
    url: '/',
    type: 'website',
  },
}

/**
 * Cached, not dynamic.
 *
 * Every write that changes what this page shows already calls
 * revalidatePath('/'): the admin station, service and connector actions,
 * registerUser, and posting to the community. So the page is served from cache
 * and regenerated when something actually changes. The interval is a
 * backstop for rows changed outside those actions.
 */
export const revalidate = 300

const EMPTY_FIGURES: CommunityFigures = {
  discussions: 0,
  replies: 0,
  clubs: 0,
  cities: 0,
  clubMembers: 0,
  byCategory: { all: 0 },
}

/**
 * The landing-v2 home page: hero, city ticker, statement, how it works, route
 * planner, services, community, partner up, and the app.
 *
 * Every read is guarded: a database that cannot answer renders the page
 * without the numbers rather than taking the landing page to the error
 * boundary. See lib/db/availability.
 */
export default async function HomePage() {
  const [heroStats, clubs, figures, latestPosts, howItWorks, serviceCounts] = await Promise.all([
    readOrFallback(
      '/ hero stats',
      { locations: 0, connectorTypes: 0, reviews: 0, rating: null, byCity: {}, pins: [] },
      getHeroStats,
    ),
    readOrFallback('/ clubs', [] as EVClub[], () => getCommunityClubs()),
    readOrFallback('/ community figures', EMPTY_FIGURES, getCommunityFigures),
    readOrFallback('/ latest posts', [] as CommunityPost[], () => getLatestPosts(2)),
    readOrFallback('/ how-it-works data', { search: null, connectors: null }, getHowItWorksData),
    readOrFallback('/ service category counts', {} as Record<string, number>, getServiceCategoryCounts),
  ])

  return (
    <>
      <Loader />
      <HomeHero pins={heroStats.pins} />
      <CityTicker cities={POPULAR_CITIES} />
      <Statement />
      <HowItWorks locations={heroStats.locations} search={howItWorks.search} connectors={howItWorks.connectors} />
      <RouteBand />
      <ServicesBand counts={serviceCounts} />
      <CommunityBand posts={latestPosts} clubs={clubs.slice(0, 3)} figures={figures} />
      <PartnerBand />
      <AppBand />
      <HomeMotion />
    </>
  )
}
