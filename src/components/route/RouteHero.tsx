// src/components/route/RouteHero.tsx
import type { ReactNode } from 'react'

import { Car, MapPin, Zap } from '@/components/ui/icons'

import { Hl, HeroStats, PageHero } from '@/components/v2/ui'

/**
 * The planner's opening band: the landing-v2 ink hero (.phero), with the
 * popular routes lifted up into it.
 *
 * The figures are counted from the data at render time. A route planner is
 * exactly the kind of page where a made-up "500+ stations" would be caught the
 * moment somebody planned a journey and found six.
 */

export interface RouteHeroProps {
  /** Vehicles the planner can size stops for. */
  vehicleCount: number
  /** Stations it can route through. */
  stationCount: number
  /** Cities with at least one of those stations. */
  cityCount: number
}

function StatValue({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-volt">
      {icon}
      {value.toLocaleString('en-PK')}
    </span>
  )
}

export function RouteHero({ vehicleCount, stationCount, cityCount }: RouteHeroProps) {
  return (
    <PageHero
      title={
        <>
          Plan the drive, <Hl dark>charging stops and all</Hl>
        </>
      }
      sub={
        <>
          Pick a popular corridor below or enter your own two cities. Tell us what you drive and how
          much charge you have, and we size the stops around your car&apos;s real range.
        </>
      }
    >
      <HeroStats
        items={[
          { value: <StatValue icon={<Car aria-hidden="true" />} value={vehicleCount} />, label: 'EVs supported' },
          {
            value: <StatValue icon={<Zap aria-hidden="true" />} value={stationCount} />,
            label: 'Stations to route via',
          },
          {
            value: <StatValue icon={<MapPin aria-hidden="true" />} value={cityCount} />,
            label: cityCount === 1 ? 'City' : 'Cities',
          },
        ]}
      />
    </PageHero>
  )
}
