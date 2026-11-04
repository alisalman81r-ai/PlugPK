// src/app/admin/(protected)/cars/new/page.tsx
import { getBrands } from '@/lib/cars'
import { listCars } from '@/lib/db/car-queries'

import { NewCarView } from '../cars-view'

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

export const metadata = { title: { absolute: 'Add a car · plugpk admin' } }
export const dynamic = 'force-dynamic'

export default async function NewCarPage() {
  const brands = getBrands(await listCars())
  return <NewCarView brands={brands} />
}
