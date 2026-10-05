// src/app/(main)/page.tsx
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

import { AppBanner } from '@/components/home/AppBanner'
import { CommunityPreview } from '@/components/home/CommunityPreview'
import { Hero } from '@/components/home/Hero'
import { HomeReveal } from '@/components/home/HomeReveal'
import { PartnerCTA } from '@/components/home/PartnerCTA'
import { RoutePlannerPromo } from '@/components/home/RoutePlannerPromo'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { readOrFallback } from '@/lib/db/availability'
import {
  getCommunityClubs,
  getCommunityFigures,
  getLatestPosts,
  type CommunityFigures,
} from '@/lib/db/community-queries'
import { getHeroStats, getHowItWorksData, getShowcaseStation } from '@/lib/db/queries'
import type { CommunityPost, EVClub } from '@/lib/types'

/*
  The two bands that animate with framer-motion, loaded as their own chunks.

  Both are below the hero, so neither belongs in the first bundle the landing
  page parses. Still server-rendered (dynamic() keeps SSR on by default): the
  HTML arrives complete, and only the script that animates it comes later.
*/
const FreedomBand = dynamic(() => import('@/components/home/FreedomBand').then((m) => m.FreedomBand))
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks').then((m) => m.HowItWorks))

export const metadata: Metadata = {
  // `absolute`: the root template would make this "… | Plug.pk | Plug.pk".
  title: { absolute: "Plug.pk — EV chargers, route planning and cars in Pakistan" },
  description:
    'Find EV charging stations across Pakistan, plan long drives around your car’s real range, compare electric cars and ask other EV drivers.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Plug.pk — EV chargers, route planning and cars in Pakistan',
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
 * The figures and rails are supplementary; the page is not.
 *
 * Every read is guarded: a database that cannot answer renders the page
 * without the numbers rather than taking the landing page to the error
 * boundary. See lib/db/availability.
 *
 * ── Eight sections, not ten ───────────────────────────────────────────
 *
 * ValueBanner ("Everything you need to go electric": find chargers, plan a
 * route, join the community) is gone. Each of its three cards repeated a band
 * already on the page — how it works, the route planner, the community — so it
 * was the page summarising itself halfway down.
 */
export default async function HomePage() {
  const [heroStats, clubs, figures, latestPosts, showcase, howItWorks] = await Promise.all([
    readOrFallback(
      '/ hero stats',
      { locations: 0, connectorTypes: 0, reviews: 0, rating: null, byCity: {}, pins: [] },
      getHeroStats,
    ),
    readOrFallback('/ clubs', [] as EVClub[], () => getCommunityClubs()),
    readOrFallback('/ community figures', EMPTY_FIGURES, getCommunityFigures),
    // The two newest real posts, for the community card. It showed two
    // fixtures from mock-data under "Real questions, real answers".
    readOrFallback('/ latest posts', [] as CommunityPost[], () => getLatestPosts(5)),
    // The station the how-it-works phones navigate to and review. Null when
    // nothing is reviewed yet, and those two steps show photographs instead.
    readOrFallback('/ showcase station', null, getShowcaseStation),
    readOrFallback('/ how-it-works data', { search: null, connectors: null }, getHowItWorksData),
  ])

  return (
    <>
      {/* The hero animates on load. Everything below is visible in the HTML
          as sent; HomeReveal only nudges a section that hydrates below the
          fold, and never hides it. */}
      <Hero stats={heroStats} />
      {/* Not wrapped: it runs its own scroll-linked entrance. */}
      <FreedomBand />
      <HomeReveal>
        <HowItWorks
          stats={{ locations: heroStats.locations, rating: heroStats.rating, reviews: heroStats.reviews }}
          showcase={showcase}
          search={howItWorks.search}
          connectors={howItWorks.connectors}
          pins={heroStats.pins}
        />
      </HomeReveal>
      <HomeReveal>
        <RoutePlannerPromo pins={heroStats.pins} />
      </HomeReveal>
      <HomeReveal>
        <ServicesPreview />
      </HomeReveal>
      <HomeReveal>
        <CommunityPreview posts={latestPosts} clubs={clubs.slice(0, 3)} counts={figures} />
      </HomeReveal>
      <HomeReveal>
        <PartnerCTA />
      </HomeReveal>
      <HomeReveal>
        <AppBanner />
      </HomeReveal>
    </>
  )
}
