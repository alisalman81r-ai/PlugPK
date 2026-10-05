// src/app/station/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { BusinessViewTracker } from '@/components/business/BusinessViewTracker'
import { AmenitiesGrid } from '@/components/station/AmenitiesGrid'
import { ChargerSpecCard } from '@/components/station/ChargerSpecCard'
import { PhotoGallery } from '@/components/station/PhotoGallery'
import { RelatedStations, RelatedStationsSkeleton } from '@/components/station/RelatedStations'
import { ReviewsSection } from '@/components/station/ReviewsSection'
import { StationHeader } from '@/components/station/StationHeader'
import { StationMobileBar, StationSidebar } from '@/components/station/StationSidebar'
import { prebuiltParams } from '@/lib/db/build-params'
import { getStationBySlug, getStationSlugs } from '@/lib/db/queries'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { getMaxPower, getPortAvailability } from '@/lib/utils'

interface PageProps {
  params: { slug: string }
}

/**
 * Static, refreshed every five minutes.
 *
 * The page used to read the session (getMySavedStationIds) to fill in the Save
 * button, and one cookie read makes the whole route dynamic — every visit to a
 * station was a fresh server render against a database in Tokyo. The bookmark
 * state is fetched by the Save button itself now (useSavedStations), so nothing
 * here depends on who is looking. Writing a review revalidates this path, so a
 * new review does not wait for the timer.
 */
export const revalidate = 300

export async function generateStaticParams() {
  return prebuiltParams('/station/[slug]', async () => {
    const slugs = await getStationSlugs()
    return slugs.map((slug) => ({ slug }))
  })
}

/**
 * The search snippet, built only from what is true of the listing.
 *
 * It used to read "Rated 0/5 by 0 reviews" for anything unreviewed and
 * "N chargers available" — a count of connector rows, presented as live
 * availability. The rating is now the one counted from reviews, and only
 * mentioned when there is one; the chargers are described as installed.
 */
function describe(station: Station): string {
  const parts: string[] = []
  const where = [station.address.area, station.address.city].filter(Boolean).join(', ')
  const { total: ports } = getPortAvailability(station)
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const types = [...new Set(station.connectors.map((connector) => connector.type))]

  parts.push(`EV charging at ${station.name}${where ? `, ${where}` : ''}.`)
  if (ports > 0) {
    parts.push(
      `${ports} ${ports === 1 ? 'port' : 'ports'} installed${types.length > 0 ? ` (${types.join(', ')})` : ''}${maxPower > 0 ? `, up to ${maxPower} kW` : ''}.`,
    )
  }
  if (station.reviewCount > 0) {
    parts.push(
      `Rated ${station.rating.toFixed(1)}/5 from ${station.reviewCount} ${station.reviewCount === 1 ? 'review' : 'reviews'}.`,
    )
  }
  if (isSampleListing(station.id)) parts.push(`${SAMPLE_LISTING_LABEL} — sample data, not a live site.`)
  return parts.join(' ')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // cache()d in queries.ts, so this and the page below share one query.
  const station = await getStationBySlug(params.slug)

  if (!station) return { title: 'Station Not Found' }

  const url = `/station/${station.slug}`
  const title = `${station.name} — EV Charging Station`
  const description = describe(station)
  // A sample listing's photo is a stock image; it is not offered as the
  // picture of the place in a link preview either.
  const image = !isSampleListing(station.id) ? (station.coverPhoto ?? station.photos[0]) : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: station.name }] } : {}),
    },
  }
}

function Divider() {
  return <hr className="border-slate-100" />
}

export default async function StationDetailPage({ params }: PageProps) {
  const station = await getStationBySlug(params.slug)

  if (!station) notFound()

  const reviews = station.reviews ?? []
  const isExample = isSampleListing(station.id)

  return (
    <>
      {/* Business listings count their own visits — this is where the figures
          on the owner's analytics page come from. Stations entered by an
          operator have no businessId and are not tracked. */}
      {station.businessId ? <BusinessViewTracker businessId={station.businessId} /> : null}

      {/* Extra bottom room on phones: the sticky bar now carries an action row
          under Navigate. */}
      <div className="container-plug pb-48 pt-8 lg:pb-20">
        <StationHeader station={station} />

        {isExample ? (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-ui-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">{SAMPLE_LISTING_LABEL}.</strong> This station is
            sample data that shows how a listing works. Its photos, hours and reviews are
            examples, not a real site — do not plan a trip around it.
          </p>
        ) : null}

        <div className="mt-8 grid items-start gap-16 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="mb-10">
              <PhotoGallery
                photos={station.photos}
                stationName={station.name}
                businessId={station.businessId}
                isExample={isExample}
              />
            </div>

            <Divider />

            {/* The owner writes this on their profile page. Without it rendered
                here, that field collected text no driver would ever read. */}
            {station.description ? (
              <>
                <section className="mt-10">
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">About</h2>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">
                    {station.description}
                  </p>
                </section>

                <div className="my-10">
                  <Divider />
                </div>
              </>
            ) : null}

            <section className="mt-10">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Charger Details</h2>
              <div className="flex flex-col gap-4">
                {station.connectors.map((connector, index) => (
                  <ChargerSpecCard key={connector.id} connector={connector} index={index} />
                ))}
              </div>
            </section>

            <div className="my-10">
              <Divider />
            </div>

            <section>
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Nearby Amenities</h2>
              <AmenitiesGrid amenities={station.amenities} />
            </section>

            <div className="my-10">
              <Divider />
            </div>

            <ReviewsSection
              reviews={reviews}
              rating={station.rating}
              reviewCount={station.reviewCount}
              stationId={station.id}
              stationName={station.name}
              stationSlug={station.slug}
              isExample={isExample}
              // A business listing's review has to be filed against the
              // business row, not a station id that does not exist.
              target={station.businessId ? 'business' : 'station'}
            />

            <div className="my-16">
              <Divider />
            </div>

            {/* Streams in after the listing itself: a slow suggestion query
                should never hold up the page somebody actually opened. */}
            <Suspense fallback={<RelatedStationsSkeleton />}>
              <RelatedStations currentStationId={station.id} city={station.address.city} />
            </Suspense>
          </div>

          <aside className="sticky top-[88px] hidden h-fit lg:block">
            <StationSidebar station={station} />
          </aside>
        </div>
      </div>

      <StationMobileBar station={station} />
    </>
  )
}
