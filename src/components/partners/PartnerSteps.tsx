// src/components/partners/PartnerSteps.tsx
import { Home, ShieldCheck, Users } from '@/components/ui/icons'

import { Hl, Section, SectionHead, WRAP } from '@/components/v2/ui'

import { PartnerBenefits } from './PartnerBenefits'

/**
 * How hosting works (.pt-how), and what a host is actually promised (.pt-get).
 *
 * Every claim here maps to something the application does. "We check the
 * details" is the admin approval step; "you keep it" is true because there is
 * no payment processing and no commission anywhere in the code; the dashboard
 * figures named are the ones BusinessDailyStat actually counts. If a claim on
 * this page ever stops being true, the code that made it true is the thing to
 * look at.
 *
 * The steps are v2's .steps cards written out here rather than <Steps>, because
 * in partner.html each step rises in on its own (data-reveal on every li).
 */

const STEPS = [
  {
    icon: Home,
    title: 'List what you have',
    body: 'A hotel forecourt, an office car park, or the single charger on your driveway. Same form, same few minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'We check the details',
    body: 'We confirm the address, the pin and the charger specs before publishing, so drivers who set off actually arrive.',
  },
  {
    icon: Users,
    title: 'Drivers find you',
    body: 'Your listing appears on the map and in search, filterable by connector and speed, with directions one tap away.',
  },
]

export function PartnerSteps() {
  return (
    <>
      <Section tone="paper">
        <div className={WRAP}>
          <SectionHead
            eyebrow="How it works"
            title={
              <>
                Three steps, then you are <Hl>on the map</Hl>
              </>
            }
            lead="Applying is free, there is no commission, and there is nothing to install on your side."
          />
          <ol className="grid gap-4 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              // The reveal moves the li, the hover lifts the card inside it: GSAP
              // leaves translate inline on what it animates.
              <li key={step.title} data-reveal="">
                <div className="group/step h-full relative overflow-hidden rounded-[28px] border border-ink/10 bg-white px-[30px] pb-8 pt-[30px] [transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s] hover:shadow-e2 hover:[translate:0_-4px]">
                  <span
                    aria-hidden="true"
                    className="absolute right-[26px] top-[18px] font-display text-[88px] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(11,12,14,.22)] [transition:color_.4s,-webkit-text-stroke-color_.4s] group-hover/step:text-volt group-hover/step:[-webkit-text-stroke-color:#0B0C0E]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="block h-[30px] w-[30px] text-ink [&_svg]:h-full [&_svg]:w-full">
                    <step.icon aria-hidden="true" />
                  </span>
                  <h3 className="mt-[70px] font-display text-[26px] leading-[1.1] text-ink">{step.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.6] text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="chalk">
        <div className={WRAP}>
          <SectionHead
            eyebrow="What you get"
            title={
              <>
                Your charger, <Hl>earning its keep</Hl>
              </>
            }
            lead="Every line below maps to something the product actually does."
          />
          <PartnerBenefits />
        </div>
      </Section>
    </>
  )
}
