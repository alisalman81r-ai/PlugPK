// src/app/(main)/cars/page.tsx
import type { Metadata } from 'next'

import { BrandMarquee } from '@/components/cars/BrandMarquee'
import { CarInsights } from '@/components/cars/CarInsights'
import { CarsExplorer } from '@/components/cars/CarsExplorer'
import { getBrands, getCategories, getConnectors, getInsights } from '@/lib/cars'
import { listCars } from '@/lib/db/car-queries'

/**
 * The Pakistan EV, PHEV and REEV car database.
 *
 * A server component that loads the catalogue once and hands the rows to a
 * client browser. Search and filtering happen in the browser because a round
 * trip per keystroke would make them feel broken on a slow connection, and the
 * whole catalogue is a few kilobytes of JSON — far less than a single car
 * photograph.
 *
 * The rows come from the database now rather than the module, so an edit in the
 * admin portal shows here without a rebuild. That is also why the count in the
 * metadata is fetched rather than computed at module scope: a figure captured
 * once when the file was first imported would go stale the moment a car was
 * added.
 */

export async function generateMetadata(): Promise<Metadata> {
  const total = (await listCars()).length

  return {
    title: 'EV & PHEV Cars in Pakistan — Prices, Range & Specifications',
    description: `Compare ${total} electric, plug-in hybrid and range-extender cars on sale in Pakistan. Prices in PKR, battery capacity, driving range, power and charging speeds.`,
    alternates: { canonical: '/cars' },
    openGraph: {
      title: 'EV & PHEV Cars in Pakistan — Prices & Specifications',
      description: `Every electrified car in the Pakistan market, with prices, range, battery and charging figures. ${total} cars listed.`,
      url: '/cars',
      type: 'website',
    },
  }
}

export default async function CarsPage() {
  const cars = await listCars()
  /**
   * The hero and the results are one client component, because the hero holds
   * the search box and the results react to it on the keystroke. Everything it
   * needs is computed here, on the server, and handed down once.
   */
  return (
    <CarsExplorer
      cars={cars}
      brands={getBrands(cars)}
      categories={getCategories(cars)}
      connectors={getConnectors(cars)}
      // Both computed on the server from the whole dataset and passed as
      // finished elements: neither changes with the filters, so none of that
      // work belongs in the client bundle. They render between the hero and
      // the catalogue, in this order — the brand strip is a half-second of
      // reassurance, the insights are the first real answer.
      insights={
        <>
          <BrandMarquee brands={getBrands(cars)} />
          <CarInsights insights={getInsights(cars)} />
        </>
      }
    />
  )
}
