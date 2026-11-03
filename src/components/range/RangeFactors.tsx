// src/components/range/RangeFactors.tsx
import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import { Battery, Car, Gauge, Route, Snowflake, Sun, TrendingDown, Users, Wind } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * What moves real-world range, as a driver in Pakistan meets it.
 *
 * Each line says what it does and, where it helps, what to do about it. No
 * percentages: the effect of each depends on the car and on the others, and a
 * figure per factor would be the false precision the rest of the page avoids.
 */

const FACTORS = [
  {
    icon: Sun,
    title: 'Hot weather',
    body: 'A hot battery has to be cooled while you drive and while it charges. Parking in shade helps before you set off.',
  },
  {
    icon: Snowflake,
    title: 'AC use',
    body: 'Cooling the cabin draws from the same battery as the motor. Its share is biggest in slow traffic, where the motor needs little.',
  },
  {
    icon: Gauge,
    title: 'Motorway speed',
    body: 'Air resistance climbs steeply with speed. 120 km/h costs far more per km than 90 — the single biggest lever you control.',
  },
  {
    icon: Route,
    title: 'Traffic',
    body: 'Stop-start driving is cheap for an EV: little speed to hold, and braking recovers energy. Long idles with the AC on add up, though.',
  },
  {
    icon: Users,
    title: 'Passengers and load',
    body: 'A full car and a loaded boot take more energy to move, above all on climbs and when pulling away.',
  },
  {
    icon: Wind,
    title: 'Tyre pressure',
    body: 'Under-inflated tyres roll with more resistance. Check them at the pressure on the door sticker, with the tyres cold.',
  },
  {
    icon: TrendingDown,
    title: 'Driving style',
    body: 'Hard acceleration and late braking waste energy. Smooth driving and early lifting off let regeneration do its work.',
  },
  {
    icon: Car,
    title: 'Road conditions',
    body: 'Broken surfaces, climbs like the Salt Range on the M-2, and headwinds all cost range. Descents give some of it back.',
  },
  {
    icon: Battery,
    title: 'Battery temperature',
    body: 'Cells work best in a moderate range. A pack left baking in the sun, or pushed hard in heat, can give less and charge slower.',
  },
] as const

export function RangeFactors() {
  return (
    <section aria-labelledby="factors-heading">
      <header data-shead="" className="mb-[clamp(32px,4vw,48px)] grid justify-items-start">
        <h2 id="factors-heading" data-split="" className={cn(H2_CLASS, 'text-ink')}>
          What changes your range <Hl>here</Hl>
        </h2>
        <p data-shead-lead="" className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
          None of these appear in a lab test. Most of them are in every Pakistani summer.
        </p>
      </header>

      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
        {FACTORS.map(({ icon: Icon, title, body }) => (
          <RevealItem key={title} className="h-full">
            <div className="group/f grid h-full grid-cols-[46px_1fr] gap-x-4 rounded-[22px] border border-ink/10 bg-white px-[18px] py-5 [transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1)] hover:shadow-e2 hover:[translate:0_-4px] sm:block sm:p-6">
              <span className="row-span-2 grid size-[46px] place-items-center rounded-[14px] bg-chalk text-ink [transition:background-color_.3s,color_.3s,rotate_.5s_cubic-bezier(.34,1.56,.64,1)] group-hover/f:bg-ink group-hover/f:text-volt group-hover/f:[rotate:-8deg]">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mb-1.5 mt-0.5 font-display text-[19px] leading-[1.15] text-ink sm:mb-2 sm:mt-[18px] sm:text-[21px]">
                {title}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-muted">{body}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
