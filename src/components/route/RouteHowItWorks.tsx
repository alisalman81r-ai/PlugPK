// src/components/route/RouteHowItWorks.tsx
import { BatteryCharging, Car, MapPin } from '@/components/ui/icons'

import { Hl, SectionHead, Steps, Wrap } from '@/components/v2/ui'

/**
 * What the planner does, in three steps (landing-v2 .steps).
 *
 * It sits below the planner rather than above it. Explaining a form before
 * showing it asks the reader to hold three abstract steps in their head; the
 * same three read as reassurance once the thing they describe is on screen.
 */

const STEPS = [
  {
    icon: <MapPin className="text-volt-ink" aria-hidden="true" />,
    title: 'Set two cities',
    body: 'Type a start and a destination anywhere in Pakistan, or tap one of the popular routes above.',
  },
  {
    icon: <Car className="text-volt-ink" aria-hidden="true" />,
    title: 'Pick your EV',
    body: 'Stops are sized against your car’s real battery capacity and peak charging rate, not a generic average.',
  },
  {
    icon: <BatteryCharging className="text-volt-ink" aria-hidden="true" />,
    title: 'Drive with a plan',
    body: 'You get the charging stops in order, how long each one takes, and the battery you arrive and leave on.',
  },
]

export function RouteHowItWorks() {
  return (
    <section data-theme="light" aria-labelledby="how-it-works-heading" className="bg-chalk py-[clamp(80px,9vw,128px)]">
      <Wrap>
        <SectionHead
          eyebrow="How it works"
          title={
            <span id="how-it-works-heading">
              Three steps to a plan <Hl>you can drive</Hl>
            </span>
          }
        />
        <Steps steps={STEPS} />
      </Wrap>
    </section>
  )
}
