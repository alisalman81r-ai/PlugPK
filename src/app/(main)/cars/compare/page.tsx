// src/app/(main)/cars/compare/page.tsx
import { ArrowLeft } from '@/components/ui/icons'
import type { Metadata } from 'next'

import { CarComparison } from '@/components/cars/CarComparison'
import { CompareSelectionSync } from '@/components/cars/CompareSelectionSync'
import { MAX_COMPARE } from '@/components/cars/compare-selection'
import { Btn, BtnArrow, Hl, Lift, LiftBody, PageHero } from '@/components/v2/ui'
import { getCarsByIdsFromDb, listCars } from '@/lib/db/car-queries'

/**
 * The comparison, addressed by URL.
 *
 * Ids travel in the query string rather than in component state, which is what
 * makes a comparison shareable, bookmarkable and able to survive a refresh — a
 * modal holding the selection would lose all three.
 *
 * Unknown ids are dropped rather than 404ing the page: a link that outlives a
 * car being delisted should still show the cars it can, not nothing.
 */

export const metadata: Metadata = {
  title: 'Compare EV & PHEV Cars in Pakistan',
  description:
    'Compare electric, plug-in hybrid and range-extender cars sold in Pakistan side by side — price, battery, range, power and charging speeds.',
  alternates: { canonical: '/cars/compare' },
}

interface ComparePageProps {
  searchParams: { ids?: string }
}

/** Shared with the catalogue's tray, so the two cannot disagree about the cap. */
const MAX = MAX_COMPARE

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const ids = (searchParams.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX)

  const cars = await getCarsByIdsFromDb(ids)
  // What the add control can offer: everything not already in the table.
  const chosen = new Set(cars.map((car) => car.id))
  const available = (await listCars()).filter((car) => !chosen.has(car.id))

  return (
    <>
      <PageHero
        title={
          <>
            Compare <Hl dark>cars</Hl>
          </>
        }
        sub="Every published figure, lined up. Rows no car has a figure for are left out rather than filled with dashes."
        actions={
          /* The way back to the catalogue. A real link rather than
             router.back(): adding a car rewrites the query string, and a
             reader arriving on a shared link has no history to go back to. */
          <Btn href="/cars" variant="ghostDark" size="sm">
            <ArrowLeft aria-hidden="true" />
            All cars
          </Btn>
        }
      />

      <CompareSelectionSync ids={cars.map((car) => car.id)} requested={ids.length > 0} />

      <Lift className="mb-[clamp(64px,7vw,104px)]">
        <LiftBody className="pb-6 sm:pb-8">
          {cars.length >= 2 ? (
            <CarComparison cars={cars} available={available} max={MAX} />
          ) : (
            /* One car is not a comparison — that is the detail page. Rather
               than render a single column, this says what is missing. */
            <div className="grid justify-items-center gap-4 rounded-[28px] border-[1.5px] border-dashed border-ink/15 px-5 py-14 text-center">
              <p className="font-display text-[26px] leading-[1.1] text-ink">
                {cars.length === 1 ? 'Pick one more car' : 'Nothing selected yet'}
              </p>
              <p className="-mt-1 max-w-sm text-sm leading-relaxed text-muted">
                {cars.length === 1
                  ? `Add another car from the catalogue to see them side by side. You can compare up to ${MAX}.`
                  : `Tap the compare button on any car in the catalogue — pick two to ${MAX} — and they will line up here.`}
              </p>
              <Btn href="/cars" variant="ink" size="sm">
                Browse cars
                <BtnArrow />
              </Btn>
            </div>
          )}
        </LiftBody>
      </Lift>
    </>
  )
}
