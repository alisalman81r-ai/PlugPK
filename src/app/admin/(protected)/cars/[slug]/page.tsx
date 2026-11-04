// src/app/admin/(protected)/cars/[slug]/page.tsx
import { notFound } from 'next/navigation'

import { getBrands } from '@/lib/cars'
import { auditCar } from '@/lib/car-admin'
import { getCarBySlugFromDb, listCars } from '@/lib/db/car-queries'

import { CarDetailView } from '../cars-view'

/**
 * One car, editable: the fields, the photograph, what is outstanding, and
 * delete. The layout and why each panel saves on its own are described on
 * CarDetailView.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const car = await getCarBySlugFromDb(params.slug)
  return { title: { absolute: car ? `${car.fullName} · plugpk admin` : 'Car not found' } }
}

export default async function AdminCarDetailPage({ params }: PageProps) {
  const car = await getCarBySlugFromDb(params.slug)
  if (!car) notFound()

  const all = await listCars()
  return <CarDetailView car={car} brands={getBrands(all)} audit={auditCar(car)} />
}
