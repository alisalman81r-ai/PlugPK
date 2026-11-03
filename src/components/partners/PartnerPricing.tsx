// src/components/partners/PartnerPricing.tsx
import { Check, ShieldCheck } from '@/components/ui/icons'

import { Reveal, RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { Btn, BtnArrow, Hl, Section, SectionHead, WRAP } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * Plans for hosts (landing-v2's .pt-plans).
 *
 * Two things to know before changing these.
 *
 * The figures below are the only place a price is written down, restored from
 * the tiers this product published before pricing was removed (Premium PKR
 * 4,999 a month, Enterprise on request). A published price is a promise that
 * has to be honoured, so nothing here was invented to fill the layout.
 *
 * Nothing here takes a payment, because the application has no payment
 * processing. Every button either starts a free listing or opens the meeting
 * request, which is an honest end to the journey; a "Subscribe" button that
 * silently did nothing would not be.
 *
 * One paid plan, not two at the same price, and the feature list is what the
 * application actually does for every approved listing — there are no plan
 * tiers in the schema and nothing ranks, features or highlights a listing.
 */

interface Plan {
  name: string
  /** Mono figure; absent for "Let's talk". */
  amount?: string
  cadence?: string
  talk?: string
  tagline: string
  features: string[]
  cta: { label: string; href: string }
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Standard',
    amount: '4,999',
    cadence: 'per month',
    tagline: 'Everything you need to be found.',
    features: [
      'Listed on the map and in Partner Up',
      'Photos of your chargers',
      'Reviews from drivers, with public replies',
      'Views and directions dashboard',
    ],
    cta: { label: 'List your charger', href: '/business/signup' },
    featured: true,
  },
  {
    name: 'Enterprise',
    talk: 'Let’s talk',
    tagline: 'Fleets, chains and multi-site operators.',
    features: [
      'Everything in Standard',
      'Several sites under one account',
      'Terms agreed for your sites',
      'A meeting to set it up with us',
    ],
    cta: { label: 'Arrange a meeting', href: '#meeting' },
  },
]

const FEATURED =
  'border-[1.5px] border-transparent text-white [background:linear-gradient(165deg,#16191D,#0B0C0E_60%)_padding-box,linear-gradient(155deg,#D4FF3A_0%,rgba(212,255,58,.45)_22%,#2A2E35_55%,#0B0C0E_100%)_border-box] shadow-[0_40px_80px_-40px_rgba(11,12,14,.6),0_20px_50px_-30px_rgba(212,255,58,.35)] hover:shadow-[0_50px_90px_-40px_rgba(11,12,14,.7),0_26px_60px_-30px_rgba(212,255,58,.5)]'

export function PartnerPricing() {
  return (
    <Section tone="paper" id="pricing" className="scroll-mt-[var(--nav-h)]">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Plans"
          title={
            <>
              One price to list. <Hl>Growing is optional.</Hl>
            </>
          }
          lead="You keep what drivers pay you on every plan — plugpk never takes a cut of your charging revenue."
        />

        <RevealGroup className="mx-auto grid w-full max-w-[980px] items-stretch gap-7 md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] md:gap-5">
          {PLANS.map((plan) => (
            <RevealItem key={plan.name} className="h-full">
              <article
                data-theme={plan.featured ? 'dark' : undefined}
                className={cn(
                  'relative isolate flex h-full flex-col rounded-[26px] px-[22px] pb-6 pt-[34px] transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1.5 sm:rounded-[32px] sm:px-9 sm:pb-[34px] sm:pt-[38px]',
                  plan.featured ? FEATURED : 'border border-ink/10 bg-white text-ink shadow-e1 hover:shadow-e2',
                )}
              >
                {plan.featured ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden rounded-[inherit] bg-[radial-gradient(420px_300px_at_0%_0%,rgba(212,255,58,.14),transparent_70%),repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.025)_22px_23px)]"
                    />
                    <span className="absolute -top-3.5 left-[22px] inline-flex h-7 items-center rounded-full bg-volt px-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink shadow-[0_8px_20px_-8px_rgba(212,255,58,.7)] sm:left-9">
                      Start here
                    </span>
                  </>
                ) : null}

                <h3 className="m-0 font-display text-[32px] font-normal leading-[1.05] pg-medium">{plan.name}</h3>
                <p className={cn('mt-2 text-[15px]', plan.featured ? 'text-white/60' : 'text-muted')}>{plan.tagline}</p>

                <div
                  className={cn(
                    'mb-[26px] mt-[30px] flex flex-wrap items-baseline gap-x-3 gap-y-1.5 border-b pb-[26px]',
                    plan.featured ? 'border-white/10' : 'border-ink/10',
                  )}
                >
                  {plan.amount ? (
                    <>
                      <b className="inline-flex items-baseline gap-2.5 whitespace-nowrap font-mono text-[clamp(44px,5vw,60px)] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                        <small className="mt-[0.25em] self-start text-[0.36em] tracking-[0.06em] opacity-70">PKR</small>
                        {plan.amount}
                      </b>
                      <span
                        className={cn(
                          'font-mono text-[13px] font-medium uppercase tracking-[0.1em]',
                          plan.featured ? 'text-white/60' : 'text-muted',
                        )}
                      >
                        {plan.cadence}
                      </span>
                    </>
                  ) : (
                    <b className="font-display text-[clamp(44px,5vw,60px)] font-normal leading-none pg-medium">{plan.talk}</b>
                  )}
                </div>

                <ul className="mb-[34px] grid flex-1 content-start gap-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={cn('flex items-start gap-3 text-[15.5px] leading-[1.45]', plan.featured && 'text-white/90')}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid h-[22px] w-[22px] flex-none place-items-center rounded-full',
                          plan.featured ? 'bg-volt/[0.14] text-volt' : 'bg-chalk text-ink',
                        )}
                      >
                        <Check size={13} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Btn href={plan.cta.href} variant={plan.featured ? 'volt' : 'ink'} size="lg" className="w-full">
                  {plan.cta.label}
                  <BtnArrow />
                </Btn>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Said plainly rather than buried: a plan page that implies a card
            will be charged when nothing charges it is the kind of detail people
            rightly get annoyed about. */}
        <Reveal className="mx-auto mt-8 flex w-full max-w-[640px] items-start justify-center gap-2.5 text-sm leading-[1.6] text-muted">
          <ShieldCheck size={18} aria-hidden="true" className="mt-0.5 flex-none text-volt-ink" />
          <p>
            Paid plans are arranged with us directly — there is no card payment on the site yet. Every listing is
            checked by a person before it goes live.
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
