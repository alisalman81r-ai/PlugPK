// src/app/(main)/cars/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CarDetails } from '@/components/cars/CarDetails'
import { carSeo } from '@/lib/cars'
import { getCarBySlugFromDb, getCarSlugs, listCars } from '@/lib/db/car-queries'

/**
 * One page per car, generated at build time.
 *
 * generateStaticParams means every car is a static file — no database round
 * trip — and an unknown slug 404s rather than rendering an empty shell.
 */

interface CarPageProps {
  params: { slug: string }
}

/**
 * Only the slugs the catalogue holds are prebuilt; anything else 404s at
 * request time via notFound() below.
 *
 * dynamicParams is left at its default (true) after measuring both. Setting it
 * to false looked more correct — the catalogue is a build-time module, so an
 * unlisted slug genuinely does not exist — but it made Next answer HTTP 200
 * carrying the 404 body, a soft 404 that a crawler indexes as a real page.
 * Verified: with the default, /cars/nope returns a true 404.
 */
export async function generateStaticParams() {
  return (await getCarSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CarPageProps): Promise<Metadata> {
  const car = await getCarBySlugFromDb(params.slug)

  // Metadata runs before the component, so an unknown slug is handled here too
  // rather than letting Next fall back to the layout's default title on a 404.
  if (!car) return { title: 'Car not found' }

  const seo = carSeo(car)

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: seo.canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
    },
  }
}

export default async function CarPage({ params }: CarPageProps) {
  const car = await getCarBySlugFromDb(params.slug)
  if (!car) notFound()

  /*
    The whole catalogue, for the "similar cars" rail at the bottom of the page.
    getSimilarCars judges a car against a pool, and the pool has to be the live
    catalogue rather than the seed module now that the two can differ.
  */
  const pool = await listCars()

  /**
   * Product schema, built only from figures that exist.
   *
   * `offers` carries the rupee integers rather than the display string, because
   * a crawler needs a number and a currency. additionalProperty holds the
   * electrical specs — schema.org has no battery or range field for a car, and
   * inventing one would not be understood, whereas a named QuantitativeValue is.
   */
  const properties = [
    car.batteryCapacity
      ? { name: 'Battery capacity', value: car.batteryCapacity, unitText: 'kWh' }
      : null,
    car.range ? { name: 'Driving range', value: car.range, unitText: 'km' } : null,
    car.electricRange
      ? { name: 'Electric range', value: car.electricRange, unitText: 'km' }
      : null,
    car.power ? { name: 'Power', value: car.power, unitText: 'hp' } : null,
    car.dcCharging ? { name: 'DC charging', value: car.dcCharging, unitText: 'kW' } : null,
    car.acCharging ? { name: 'AC charging', value: car.acCharging, unitText: 'kW' } : null,
  ].filter((entry): entry is { name: string; value: number; unitText: string } => Boolean(entry))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: car.fullName,
    brand: { '@type': 'Brand', name: car.brand },
    model: car.model,
    vehicleConfiguration: car.category,
    fuelType: car.category === 'EV' ? 'Electric' : 'Plug-in Hybrid',
    ...(car.engineCapacity
      ? {
          vehicleEngine: {
            '@type': 'EngineSpecification',
            engineDisplacement: {
              '@type': 'QuantitativeValue',
              value: car.engineCapacity,
              unitCode: 'CMQ',
            },
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      ...(car.price.min === car.price.max
        ? { price: car.price.min }
        : {
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: car.price.min,
              maxPrice: car.price.max,
              priceCurrency: 'PKR',
            },
          }),
      availability: 'https://schema.org/InStock',
      areaServed: 'PK',
    },
    ...(properties.length > 0
      ? {
          additionalProperty: properties.map((property) => ({
            '@type': 'PropertyValue',
            name: property.name,
            value: property.value,
            unitText: property.unitText,
          })),
        }
      : {}),
  }

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="container-plug">
        <CarDetails car={car} pool={pool} />
      </div>

      <script
        type="application/ld+json"
        // Serialised rather than templated so a model name containing a quote
        // cannot break out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  )
}
