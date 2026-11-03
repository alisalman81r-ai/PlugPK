// src/components/partners/PartnerSteps.tsx
import { Banknote, BarChart3, Home, ShieldCheck, Users, type IconType } from '@/components/ui/icons'

import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { CARD, CARD_HOVER, Hl, Section, SectionHead, Steps, WRAP } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * How hosting works (.pt-how), and what a host is actually promised (.pt-get).
 *
 * Every claim here maps to something the application does. "We check the
 * details" is the admin approval step; "you keep it" is true because there is
 * no payment processing and no commission anywhere in the code; the dashboard
 * figures named are the ones BusinessDailyStat actually counts. If a claim on
 * this page ever stops being true, the code that made it true is the thing to
 * look at.
 */

const STEPS = [
  {
    icon: <Home aria-hidden="true" />,
    title: 'List what you have',
    body: 'A hotel forecourt, an office car park, or the single charger on your driveway. Same form, same few minutes.',
  },
  {
    icon: <ShieldCheck aria-hidden="true" />,
    title: 'We check the details',
    body: 'We confirm the address, the pin and the charger specs before publishing, so drivers who set off actually arrive.',
  },
  {
    icon: <Users aria-hidden="true" />,
    title: 'Drivers find you',
    body: 'Your listing appears on the map and in search, filterable by connector and speed, with directions one tap away.',
  },
]

const BENEFITS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Banknote,
    title: 'You set the price, you keep it',
    body: 'plugpk does not set your rates, process the payment or take a percentage. Whatever you charge is between you and the driver.',
  },
  {
    icon: BarChart3,
    title: 'See what your listing does',
    body: 'Views, directions taken, reviews and rating — counted from real visits to your page, not estimated.',
  },
  {
    icon: Users,
    title: 'Reach drivers already looking',
    body: 'People open the map because they need a charge now, and an approved listing can appear as a charging stop when it is on a planned route.',
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
          <Steps steps={STEPS} />
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

          <RevealGroup className="grid gap-4 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <RevealItem key={benefit.title} className="h-full">
                <article
                  className={cn(
                    CARD,
                    CARD_HOVER,
                    'group isolate h-full overflow-hidden p-[30px]',
                    // A volt glow that rises in the corner on hover.
                    'before:absolute before:-right-[140px] before:-top-[140px] before:-z-[1] before:h-[280px] before:w-[280px] before:rounded-full before:bg-[radial-gradient(closest-side,rgba(212,255,58,.35),transparent)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
                  )}
                >
                  <span aria-hidden="true" className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
                    <benefit.icon size={24} />
                  </span>
                  <h3 className="mb-2.5 mt-8 font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium lg:mt-14">
                    {benefit.title}
                  </h3>
                  <p className="text-[15px] leading-[1.6] text-muted">{benefit.body}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>
    </>
  )
}
