// src/components/route/RouteHowItWorks.tsx
import { BatteryCharging, Car, MapPin, type LucideIcon } from 'lucide-react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH, NUMERAL } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion, type IconMotion } from '@/components/ui'
import { cn } from '@/lib/utils'

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
  /** Matched to what the glyph depicts, not picked for variety. */
  motion: IconMotion
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: MapPin,
    motion: 'scan',
    title: 'Set two cities',
    description:
      'Type a start and a destination anywhere in Pakistan, or tap one of the popular routes above.',
  },
  {
    icon: Car,
    motion: 'travel',
    title: 'Pick your EV',
    description:
      'Stops are sized against your car’s real battery capacity and peak charging rate, not a generic average.',
  },
  {
    icon: BatteryCharging,
    motion: 'pulse',
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

      {/*
        The same three-step treatment Partner Up uses.

        These are literally the same idea — three numbered steps explaining a
        flow — and they were drawn two different ways. Here the icon was a
        filled blue-to-cyan chip with a dark numbered disc pinned to its corner;
        on Partner Up it is an outlined holder with a stroke-only numeral in the
        card's corner. The rule the rest of the site follows is that prominence
        comes from the edge and the space rather than from painting the surface,
        and this section was the loudest thing on a page whose actual subject is
        the planner directly above it.

        Left-aligned rather than centred, for the same reason Partner Up is: the
        numeral sits in the top corner, and with centred content it had nothing
        to align to.
      */}
      <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon

          return (
            <li key={step.title} className="relative">
              {/* The thread between the steps, at the icon's centre line and
                  only ever between two cards — never trailing off the last. */}
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-full top-[60px] z-10 hidden h-px w-8 border-t-2 border-dashed border-slate-300 lg:block"
                />
              ) : null}

              <HoverMotion className={FRAME}>
                <div className={cn(FACE, 'overflow-hidden p-8')}>
                  <span aria-hidden="true" className={NUMERAL}>
                    {index + 1}
                  </span>

                  <span aria-hidden="true" className={ICON_FRAME}>
                    <AnimatedIcon motion={step.motion}>
                      <Icon size={24} className={ICON_GLYPH} />
                    </AnimatedIcon>
                  </span>

                  <span aria-hidden="true" className={cn('mt-8', CAP_RULE)} />

                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-ui leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              </HoverMotion>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
