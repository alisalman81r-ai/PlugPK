// src/app/admin/(protected)/cars/new/page.tsx
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { CarForm } from '@/components/admin/CarForm'
import { getBrands } from '@/lib/cars'
import { listCars } from '@/lib/db/car-queries'

/**
 * Adding a car.
 *
 * The same form as the edit page, with no car passed — one component for both,
 * so a field added to one cannot be missing from the other.
 *
 * No photograph control here. An image has to be attached to a row that exists,
 * and inventing an id before the car is created would mean an upload could
 * strand a file against a car that was never saved. Create first, then the edit
 * page offers it — which is also the order the form's own copy promises.
 */

export const metadata = { title: { absolute: 'Add a car · Plug.pk admin' } }
export const dynamic = 'force-dynamic'

export default async function NewCarPage() {
  const brands = getBrands(await listCars())

  return (
    <>
      <AdminHeader
        title="Add a car"
        description="Goes live on the public catalogue as soon as it is saved."
        action={
          <Link
            href="/admin/cars"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All cars
          </Link>
        }
      />

      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-ui-sm">
            <Info size={16} className="mt-0.5 shrink-0 text-plug-blue-600" aria-hidden="true" />
            <p className="leading-relaxed text-slate-600">
              Only brand, model, powertrain and price are required — everything else can be filled
              in later, and a blank figure is stored as <strong>not published</strong> rather than
              guessed. Add the photograph after saving.
            </p>
          </div>

          <CarForm brands={brands} />
        </div>
      </div>
    </>
  )
}
