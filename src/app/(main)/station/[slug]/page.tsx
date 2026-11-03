// src/app/station/[slug]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as React from 'react'
import { Suspense } from 'react'

import { BusinessViewTracker } from '@/components/business/BusinessViewTracker'
import { AmenitiesGrid } from '@/components/station/AmenitiesGrid'
import { BookingPanel } from '@/components/station/BookingPanel'
import { ChargerSpecCard } from '@/components/station/ChargerSpecCard'
import { PhotoGallery } from '@/components/station/PhotoGallery'
import { RelatedStations, RelatedStationsSkeleton } from '@/components/station/RelatedStations'
import { ReviewsSection } from '@/components/station/ReviewsSection'
import { StationHeader } from '@/components/station/StationHeader'
import { StationMobileBar, StationSidebar } from '@/components/station/StationSidebar'
import { prebuiltParams } from '@/lib/db/build-params'
import { getBookingCars, getPublicHostOffer, getPublicStationOffer } from '@/lib/db/host-queries'
import { distanceKm } from '@/lib/db/business-listing'
import { getMapStations, getStationBySlug, getStationSlugs } from '@/lib/db/queries'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, getMaxPower, getPortAvailability } from '@/lib/utils'
import { Btn, CARD, Eyebrow, WRAP } from '@/components/v2/ui'

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

/**
 * A section of the listing: a white rounded card with a mono eyebrow over a
 * Power Grotesk heading, the landing-v2 card language.
 */
function Block({
  id,
  eyebrow,
  title,
  aside,
  children,
  className,
}: {
  id?: string
  eyebrow: string
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    // data-reveal: each section rises in as it scrolls into view, as the map
    // page's cards do.
    <section id={id} data-reveal="" className={cn(CARD, 'scroll-mt-28 p-5 sm:p-8', className)}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>
          <h2 className="font-display text-[clamp(26px,2.4vw,32px)] leading-[1.08] text-ink">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** The three nearest chargers that take bookings, closest first. */
async function getNearbyBookable(station: Station): Promise<(Station & { distanceKm: number })[]> {
  const all = await getMapStations()
  return all
    .filter((other) => other.bookable && other.id !== station.id)
    .map((other) => ({ ...other, distanceKm: distanceKm(station.coordinates, other.coordinates) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3)
}

/** What the Book a slot button lands on at a station that takes no bookings. */
function NoBookingHere({
  isExample,
  nearby,
}: {
  isExample: boolean
  nearby: (Station & { distanceKm: number })[]
}) {
  return (
    <div className="rounded-[22px] border border-ink/10 bg-paper p-5 sm:p-6">
      <p className="font-semibold text-ink">
        {isExample ? 'This is a sample listing, so it cannot be booked.' : 'This station does not take bookings yet.'}
      </p>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
        {isExample
          ? 'It shows how a listing works and is not a real site.'
          : 'You can still drive here and charge on arrival.'}{' '}
        {nearby.length > 0
          ? 'These chargers near it take bookings, so you can reserve your time before you go:'
          : 'No charger nearby takes bookings yet. Chargers that do show a Book a slot option on the map.'}
      </p>

      {nearby.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {nearby.map((other) => (
            <li key={other.id}>
              <Link
                href={`/station/${other.slug}#book`}
                className="group/nb flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 transition-[border-color,box-shadow] duration-300 hover:border-ink/25 hover:shadow-e1"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{other.name}</span>
                  <span className="block font-mono text-xs text-muted">
                    {other.address.city} · {formatNearby(other.distanceKm)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Book
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover/nb:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Btn href="/map" variant="ghost" size="sm" className="mt-4">
          Back to the map
        </Btn>
      )}
    </div>
  )
}

function formatNearby(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`
}

export default async function StationDetailPage({ params }: PageProps) {
  const station = await getStationBySlug(params.slug)

  if (!station) notFound()

  const reviews = station.reviews ?? []
  const isExample = isSampleListing(station.id)
  // Price and booking terms: a partner listing's from its host, an operator
  // station's from the plugpk team. Null for a listing that is not live and
  // for the sample listings.
  const offer = station.businessId
    ? await getPublicHostOffer(station.businessId)
    : await getPublicStationOffer(station.id)
  const canBook = Boolean(offer?.settings.bookingEnabled && offer.settings.bookingFee > 0 && offer.accounts.length > 0)
  const venue = station.businessId ? `business:${station.businessId}` : `station:${station.id}`
  // Where this station takes no bookings, the closest ones that do.
  const nearbyBookable = canBook ? [] : await getNearbyBookable(station).catch(() => [])
  // The cars a driver can time a charge for. Only loaded when there is a booking panel to fill.
  const bookingCars = canBook ? await getBookingCars().catch(() => []) : []

  return (
    <div className="bg-chalk">
      {/* Business listings count their own visits — this is where the figures
          on the owner's analytics page come from. Stations entered by an
          operator have no businessId and are not tracked. */}
      {station.businessId ? <BusinessViewTracker businessId={station.businessId} /> : null}

      <StationHeader station={station} />

      {/* The listing, lifted into the header like the design's .lift sheets.
          Extra bottom room on phones: the sticky bar carries the actions. */}
      {/* data-lift: rises in after the header, as the map's filter sheet does. */}
      <div
        data-theme="light"
        data-lift=""
        className={`relative z-[3] -mt-[84px] grid items-start gap-6 pb-48 sm:-mt-28 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:pb-[clamp(80px,9vw,128px)] ${WRAP}`}
      >
        <div className="grid min-w-0 gap-6">
          <div className={cn(CARD, 'overflow-hidden p-2 shadow-e4 sm:p-2.5')}>
            <PhotoGallery
              photos={station.photos}
              stationName={station.name}
              businessId={station.businessId}
              isExample={isExample}
            />
          </div>

          {isExample ? (
            <p data-reveal="" className="rounded-[22px] border border-[#FFE0A3] bg-[#FFF6E3] px-5 py-4 text-sm leading-relaxed text-[#8A5300]">
              <strong className="font-semibold">{SAMPLE_LISTING_LABEL}.</strong> This station is
              sample data that shows how a listing works. Its photos, hours and reviews are
              examples, not a real site — do not plan a trip around it.
            </p>
          ) : null}

          {/* The owner writes this on their profile page. Without it rendered
              here, that field collected text no driver would ever read. */}
          {station.description ? (
            <Block eyebrow="About" title="About this station">
              <p className="whitespace-pre-line text-[16px] leading-[1.7] text-muted">{station.description}</p>
            </Block>
          ) : null}

          <Block
            eyebrow="Chargers"
            title="Charger details"
            aside={
              station.connectors.length > 0 ? (
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {station.connectors.length} {station.connectors.length === 1 ? 'charger' : 'chargers'}
                </span>
              ) : null
            }
          >
            <div className="flex flex-col gap-3">
              {station.connectors.map((connector, index) => (
                <ChargerSpecCard key={connector.id} connector={connector} index={index} />
              ))}
            </div>
          </Block>

          {offer?.settings.pricePerKwh ? (
            <Block eyebrow="Pricing" title="What it costs">
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] bg-ink p-6 text-white">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Per unit (kWh)</p>
                  <p className="mt-2 font-mono text-[34px] font-semibold leading-none text-white">
                    <span className="text-volt">PKR</span> {offer.settings.pricePerKwh.toLocaleString('en-PK')}
                  </p>
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-white/65">
                  {station.businessId ? 'Set by the host and paid to them at the charger.' : 'Paid at the charger.'}
                  {canBook ? ` A booking advance of PKR ${offer.settings.bookingFee.toLocaleString('en-PK')} is deducted from your bill.` : ''}
                </p>
              </div>
            </Block>
          ) : null}

          {/* Every station has this section, so the Book a slot button never
              leads nowhere: the panel where the station takes bookings, and
              otherwise an honest note with the nearest chargers that do. */}
          <Block id="book" eyebrow="Booking" title="Book a slot">
            {canBook && offer ? (
              <BookingPanel
                venue={venue}
                stationPath={`/station/${station.slug}`}
                listingName={station.name}
                settings={offer.settings}
                accounts={offer.accounts}
                cars={bookingCars}
              />
            ) : (
              <NoBookingHere isExample={isExample} nearby={nearbyBookable} />
            )}
          </Block>

          <Block eyebrow="Around the charger" title="Nearby amenities">
            <AmenitiesGrid amenities={station.amenities} />
          </Block>

          <div data-reveal="" className={cn(CARD, 'p-5 sm:p-8')}>
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
          </div>
        </div>

        <aside className="sticky top-[calc(var(--nav-h,88px)+16px)] hidden h-fit lg:block">
          <StationSidebar station={canBook ? { ...station, bookable: true } : station} />
        </aside>
      </div>

      {/* Streams in after the listing itself: a slow suggestion query should
          never hold up the page somebody actually opened. */}
      <Suspense fallback={<RelatedStationsSkeleton />}>
        <RelatedStations currentStationId={station.id} city={station.address.city} />
      </Suspense>

      <StationMobileBar station={canBook ? { ...station, bookable: true } : station} />
    </div>
  )
}
