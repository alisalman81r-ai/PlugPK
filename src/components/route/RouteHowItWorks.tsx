// src/components/route/RouteHowItWorks.tsx
import { BatteryCharging, Car, MapPin, type LucideIcon } from 'lucide-react'

/**
 * What the planner does, in three steps.
 *
 * It sits below the planner rather than above it. Explaining a form before
 * showing it asks the reader to hold three abstract steps in their head; the
 * same three read as reassurance once the thing they describe is on screen —
 * and anyone who arrived knowing what they wanted has already scrolled past.
 *
 * The steps are numbered, and the numbers are the design: a row of three
 * identical icon cards gives no reading order, which is the one thing a
 * sequence has to communicate.
 */

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: MapPin,
    title: 'Set two cities',
    description:
      'Type a start and a destination anywhere in Pakistan, or tap one of the popular routes above.',
  },
  {
    icon: Car,
    title: 'Pick your EV',
    description:
      'Stops are sized against your car’s real battery capacity and peak charging rate, not a generic average.',
  },
  {
    icon: BatteryCharging,
    title: 'Drive with a plan',
    description:
      'You get the charging stops in order, how long each one takes, and the battery you arrive and leave on.',
  },
]

export function RouteHowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <div className="mb-10 text-center">
        <p className="mb-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
          How it works
        </p>
        <h2
          id="how-it-works-heading"
          className="font-display text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl"
        >
          Three steps to a plan you can drive
        </h2>
      </div>

      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {/* The thread between the steps, drawn behind them. Only on the wide
            layout, where the three actually sit in a row. */}
        <span
          aria-hidden="true"
          className="absolute left-[16%] right-[16%] top-[3.25rem] hidden border-t-2 border-dashed border-slate-200 lg:block"
        />

        {STEPS.map((step, index) => {
          const Icon = step.icon

          return (
            <li
              key={step.title}
              className="relative flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white px-6 py-8 text-center shadow-e1 transition-shadow duration-200 hover:shadow-e2"
            >
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-plug-blue-600 to-plug-cyan-500 text-white shadow-blue">
                <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 font-mono text-[11px] font-bold text-white">
                  {index + 1}
                </span>
              </span>

              <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[28ch] text-ui leading-relaxed text-slate-500">
                {step.description}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
