// src/app/(main)/vehicles/page.tsx
import type { Metadata } from 'next'

import { VehicleBrowser } from '@/components/vehicles/VehicleBrowser'
import { getVehicleStats, getVehicles } from '@/lib/db/queries'

/**
 * The vehicle catalogue.
 *
 * A new route rather than a change to an existing page, so nothing already
 * shipped had to move to make room for it.
 *
 * Reads the Vehicle table, not the seed module, so a car added to the database
 * appears here without a deploy. Cached for an hour rather than per request:
 * the catalogue changes when somebody edits it, not when somebody visits.
 *
 * The figures in the copy are counted from the data rather than typed in, which
 * is the only way a number in a heading stays true after a row is added.
 */

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'EV & PHEV Vehicles in Pakistan',
  description:
    'Every electric, plug-in hybrid and range-extender vehicle sold or imported in Pakistan — searchable by brand, model and powertrain.',
}

export default async function VehiclesPage() {
  const [vehicles, totals] = await Promise.all([getVehicles(), getVehicleStats()])

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-plug">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Vehicle database
          </span>

          <h1 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Every EV in <span className="text-plug-blue-600">Pakistan</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            {totals.vehicles} electric, plug-in hybrid and range-extender models across{' '}
            {totals.brands} brands — officially sold, commonly imported, and the rare ones
            too.
          </p>
        </div>

        <div className="mt-14">
          <VehicleBrowser vehicles={vehicles} totals={totals} />
        </div>
      </div>
    </section>
  )
}
