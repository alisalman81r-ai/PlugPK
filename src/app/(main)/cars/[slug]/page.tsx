// src/app/(main)/cars/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CarDetails } from '@/components/cars/CarDetails'
import { carSeo, getAllCars, getCarBySlug } from '@/lib/cars'

/**
 * One page per car, generated at build time.
 *
 * generateStaticParams means every car is a static file — no database round
 * trip, and a slug that does not exist 404s rather than rendering an empty
 * shell. dynamicParams is left at its default so a car added to the module
 * after a deploy still renders on first request.
 */

interface CarPageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllCars().map((car) => ({ slug: car.slug }))
}

export function generateMetadata({ params }: CarPageProps): Metadata {
  const car = getCarBySlug(params.slug)

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

export default function CarPage({ params }: CarPageProps) {
  const car = getCarBySlug(params.slug)
  if (!car) notFound()

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
        <CarDetails car={car} />
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
