// src/app/(main)/cars/page.tsx
import type { Metadata } from 'next'

import { CarsBrowser } from '@/components/cars/CarsBrowser'
import { Reveal } from '@/components/ui'
import {
  getAllCars,
  getBrands,
  getCategories,
  getConnectors,
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
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-plug">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Pakistan market
          </span>

          <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-black leading-[1.03] tracking-[-0.035em] text-slate-900">
            Every electrified car, <span className="text-plug-blue-600">compared</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            {cars.length} EVs, plug-in hybrids and range extenders on sale in Pakistan —
            with prices in rupees, real battery and range figures, and nothing estimated.
          </p>
        </div>

        {/*
          Counted from the data, not written down — the only way a figure in a
          heading stays true when a car is added.
        */}
        <Reveal>
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 border-y border-slate-200 py-8 sm:grid-cols-4">
            <Stat value={cars.length} label="Cars listed" />
            <Stat value={getBrands().length} label="Brands" />
            <Stat value={cars.filter((car) => car.category === 'EV').length} label="Fully electric" />
            {/* PHEVs and REEVs together — a range extender is not a plug-in
                hybrid, so the label names both rather than filing one under
                the other. */}
            <Stat
              value={cars.filter((car) => car.category !== 'EV').length}
              label="Plug-in & REEV"
            />
          </dl>
        </Reveal>

        {/*
          The browser is deliberately not wrapped in Reveal. Its grid remounts
          whenever a filter changes, so a fade-and-rise would replay on every
          click — turning a filter into something that feels slow rather than
          instant.
        */}
        <div className="mt-12">
          <CarsBrowser
            cars={cars}
            brands={getBrands()}
            categories={getCategories()}
            connectors={getConnectors()}
            priceBounds={getPriceBounds()}
          />
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <dd className="text-[2rem] font-black leading-none tracking-tight text-slate-900">
        {value}
      </dd>
      <dt className="mt-2 text-ui-xs text-slate-500">{label}</dt>
    </div>
  )
}
