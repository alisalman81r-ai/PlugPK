// src/app/(main)/charging-calculator/page.tsx
import type { Metadata } from 'next'

import { ChargingCalculator } from '@/components/calculator/ChargingCalculator'
import { ChargingExplainer } from '@/components/calculator/ChargingExplainer'
import type { CalculatorCar } from '@/components/calculator/types'
import { readOrFallback } from '@/lib/db/availability'
import { listCars } from '@/lib/db/car-queries'
import { Hl, PageHero } from '@/components/v2/ui'

export const metadata: Metadata = {
  title: 'EV Charging Time Calculator',
  description:
    'How long will your EV take to charge? Pick your car, set your charge, and see the time and cost on a home socket, a wall box or a public DC charger.',
}

/**
 * The catalogue changes a few times a month at most, so an hour's cache costs
 * nothing and keeps the page static.
 */
export const revalidate = 3600

/** Only cars that take a plug. A full hybrid has a battery and no socket. */
const PLUG_IN = new Set(['EV', 'PHEV', 'REEV'])

export default async function ChargingCalculatorPage() {
  /*
    Read through the same guard the homepage uses. If the database cannot be
    reached the calculator still works — the car list is empty and the driver
    types their battery size — rather than the whole page failing.
  */
  const all = await readOrFallback('/charging-calculator cars', [], listCars)

  const cars: CalculatorCar[] = all
    .filter((c) => PLUG_IN.has(c.category) && c.batteryCapacity && c.batteryCapacity > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.fullName,
      brand: c.brand,
      category: c.category,
      batteryKwh: c.batteryCapacity as number,
      acKw: c.acCharging,
      dcKw: c.dcCharging,
      dcQuotedMin: c.dcChargingMinutes ?? null,
      dcQuotedFromPct: c.dcChargingFromPct ?? 10,
      // A plug-in hybrid's `range` is petrol and battery together; only its
      // electric range says what a charge adds. And a PHEV's `rangeStandard`
      // describes the combined figure, so it is not borrowed for this one.
      rangeKm: c.category === 'EV' ? c.range : c.electricRange,
      rangeCycle: c.category === 'EV' ? (c.rangeStandard ?? null) : null,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))

  return (
    <>
      {/*
        The ink hero every inner page opens with, the calculator lifted up
        into it as a paper sheet, then the explainer on chalk.
      */}
      <PageHero
        title={
          <>
            Charging time and cost <Hl dark>for your EV</Hl>
          </>
        }
        sub={
          <>
            Pick your car, drag the battery to where you are and where you want to be, and choose the charger.
            We&rsquo;ll work out the time and what it costs — using your car&rsquo;s own charging limits wherever we
            have them.
          </>
        }
        className="lg:pb-[196px]"
      />
      <ChargingCalculator cars={cars} />
      <ChargingExplainer />
    </>
  )
}
