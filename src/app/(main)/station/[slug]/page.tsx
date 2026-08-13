// src/app/station/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AmenitiesGrid } from '@/components/station/AmenitiesGrid'
import { ChargerSpecCard } from '@/components/station/ChargerSpecCard'
import { PhotoGallery } from '@/components/station/PhotoGallery'
import { RelatedStations } from '@/components/station/RelatedStations'
import { ReviewsSection } from '@/components/station/ReviewsSection'
import { StationHeader } from '@/components/station/StationHeader'
import { StationMobileBar, StationSidebar } from '@/components/station/StationSidebar'
import { getStationBySlug, getStationSlugs } from '@/lib/db/queries'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = await getStationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const station = await getStationBySlug(params.slug)

  if (!station) return { title: 'Station Not Found' }

  return {
    title: `${station.name} — EV Charging Station`,
    description: `${station.name} in ${station.address.city}. ${station.connectors.length} chargers available. Rated ${station.rating}/5 by ${station.reviewCount} reviews.`,
  }
}

function Divider() {
  return <hr className="border-slate-100" />
}

export default async function StationDetailPage({ params }: PageProps) {
  const station = await getStationBySlug(params.slug)

  if (!station) notFound()

  const reviews = station.reviews ?? []

  return (
    <>
      <div className="container-plug pb-32 pt-8 lg:pb-20">
        <StationHeader station={station} />

        <div className="mt-8 grid items-start gap-16 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="mb-10">
              <PhotoGallery photos={station.photos} stationName={station.name} />
            </div>

            <Divider />

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
            />

            <div className="my-16">
              <Divider />
            </div>

            <RelatedStations currentStationId={station.id} city={station.address.city} />
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
