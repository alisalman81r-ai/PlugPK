// src/app/(main)/cars/page.tsx
import type { Metadata } from 'next'

import { CarInsights } from '@/components/cars/CarInsights'
import { CarsExplorer } from '@/components/cars/CarsExplorer'
import {
  getAllCars,
  getBrands,
  getCategories,
  getConnectors,
  getInsights,
  getPriceBounds,
} from '@/lib/cars'

/**
 * The Pakistan EV, PHEV and REEV car database.
 *
 * A server component that reads the module once and hands the rows to a client
 * browser. Search and filtering happen in the browser because a round trip per
 * keystroke would make them feel broken on a slow connection, and the whole
 * database is a few kilobytes of JSON — far less than a single car photograph.
 *
 * Static: the data is a module, so there is nothing per-request to compute and
 * no reason to make a visitor wait for a render that never changes.
 */

const cars = getAllCars()

export const metadata: Metadata = {
  title: 'EV & PHEV Cars in Pakistan — Prices, Range & Specifications',
  description: `Compare ${cars.length} electric, plug-in hybrid and range-extender cars on sale in Pakistan. Prices in PKR, battery capacity, driving range, power and charging speeds.`,
  alternates: { canonical: '/cars' },
  openGraph: {
    title: 'EV & PHEV Cars in Pakistan — Prices & Specifications',
    description: `Every electrified car in the Pakistan market, with prices, range, battery and charging figures. ${cars.length} cars listed.`,
    url: '/cars',
    type: 'website',
  },
}

export default function CarsPage() {
  /**
   * The hero and the results are one client component, because the hero holds
   * the search box and the results react to it on the keystroke. Everything it
   * needs is computed here, on the server, and handed down once.
   */
  return (
    <CarsExplorer
      cars={cars}
      brands={getBrands()}
      categories={getCategories()}
      connectors={getConnectors()}
      priceBounds={getPriceBounds()}
      // Computed on the server from the whole dataset and passed as a finished
      // element: the superlatives never change with the filters, so none of
      // that work belongs in the client bundle.
      insights={<CarInsights insights={getInsights()} />}
    />
  )
}
