// src/app/(main)/charging-calculator/page.tsx
import type { Metadata } from 'next'

import { ChargingCalculator } from '@/components/calculator/ChargingCalculator'
import { ChargingExplainer } from '@/components/calculator/ChargingExplainer'
import type { CalculatorCar } from '@/components/calculator/types'
import { readOrFallback } from '@/lib/db/availability'
import { listCars } from '@/lib/db/car-queries'

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

/** Same measure as /community, /map and the clubs directory. */
const STAGE = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10'

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
      // A plug-in hybrid's `range` is petrol and battery together; only its
      // electric range says what a charge adds. And a PHEV's `rangeStandard`
      // describes the combined figure, so it is not borrowed for this one.
      rangeKm: c.category === 'EV' ? c.range : c.electricRange,
      rangeCycle: c.category === 'EV' ? (c.rangeStandard ?? null) : null,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))

  return (
    <div className="min-h-below-nav bg-slate-50 pb-20 lg:pb-28">
      {/*
        The site's own band — the dark ground /community, /map and the clubs
        page open with — so this reads as one more part of Plug.pk rather than
        a tool dropped into it. The calculator card is lifted up into it, the
        same way the clubs directory is.
      */}
      <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-28 pt-12 sm:rounded-b-[2.5rem] sm:pb-32 lg:pb-36 lg:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-cyan-500/15 blur-[130px]" />
        </div>

        <div className={`relative ${STAGE}`}>
          {/* Centred, in two colours, like the Map, Routes and Cars heroes. */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mx-auto text-balance font-display text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
              <span className="block">How long will</span>
              <span className="block bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">your charge take?</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
              Pick your car, drag the battery to where you are and where you want to be, and choose the
              charger. We&rsquo;ll work out the time and what it costs — using your car&rsquo;s own charging
              limits wherever we have them.
            </p>
          </div>
        </div>
      </header>

      <div className={`relative -mt-20 sm:-mt-24 ${STAGE}`}>
        <ChargingCalculator cars={cars} />
        <ChargingExplainer />
      </div>
    </div>
  )
}
