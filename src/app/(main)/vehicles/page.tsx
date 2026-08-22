// src/app/(main)/vehicles/page.tsx
import type { Metadata } from 'next'

import { VehicleCatalogue } from '@/components/vehicles/VehicleCatalogue'
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
 *
 * Every car is on the page, grouped by brand. The first version put them behind
 * a dropdown, which answers "which one is mine" — a form's question. A
 * catalogue has to answer "what is out there", and that needs the list visible.
 * The dropdown still exists as components/vehicles/VehicleSelector for the
 * places that do want a field.
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

          {/* The count is the sentence's subject, so at zero the sentence has
              to change rather than reading "0 models across 0 brands". */}
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            {totals.vehicles > 0 ? (
              <>
                {totals.vehicles} electric, plug-in hybrid and range-extender models across{' '}
                {totals.brands} brands — officially sold, commonly imported, and the rare
                ones too.
              </>
            ) : (
              <>
                Electric, plug-in hybrid and range-extender vehicles sold or imported in
                Pakistan. Nothing is listed at the moment.
              </>
            )}
          </p>
        </div>

        {/* Counted by the database, not written down. Hidden entirely when
            there is nothing to count — a row of zeroes is worse than no row. */}
        {totals.vehicles > 0 ? (
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 border-y border-slate-200 py-8 sm:grid-cols-4">
            <Stat value={totals.vehicles} label="Vehicles listed" />
            <Stat value={totals.brands} label="Brands" />
            <Stat value={totals.official} label="Officially sold" />
            <Stat value={totals.electric} label="Fully electric" />
          </dl>
        ) : null}

        <div className="mt-14">
          <VehicleCatalogue vehicles={vehicles} />
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
