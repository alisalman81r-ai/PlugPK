// src/components/range/RangeFactors.tsx
import { Battery, Car, Flame, Gauge, Route, Snowflake, TrendingDown, Users, Wind } from '@/components/ui/icons'

/**
 * What moves real-world range, as a driver in Pakistan meets it.
 *
 * Each line says what it does and, where it helps, what to do about it. No
 * percentages: the effect of each depends on the car and on the others, and a
 * figure per factor would be the false precision the rest of the page avoids.
 */

const FACTORS = [
  {
    icon: Flame,
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
      <div className="max-w-2xl">
        <h2
          id="factors-heading"
          className="text-[clamp(1.25rem,2.4vw,1.5rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          What changes your range here
        </h2>
        <p className="mt-2 text-ui leading-relaxed text-slate-600">
          None of these appear in a lab test. Most of them are in every Pakistani summer.
        </p>
      </div>

      <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {FACTORS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3.5">
            <Icon size={22} className="mt-0.5 shrink-0 text-plug-cyan-700" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-ui font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-ui-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
