// src/components/partners/PartnerPricing.tsx
import { ArrowRight, Check, Minus } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { FACE, FRAME, FRAME_FEATURED } from '@/components/shared/frame'

/**
 * Plans for hosts.
 *
 * Two things to know before changing these.
 *
 * The figures below are the only place a price is written down, and they are
 * restored from the tiers this product published before pricing was removed
 * (Basic free, Premium PKR 4,999 a month, Enterprise on request). A published
 * price is a promise that has to be honoured, so nothing here was invented to
 * fill the layout — confirm the numbers before this page goes public.
 *
 * Nothing here takes a payment, because the application has no payment
 * processing. Every button either starts a free listing or opens the meeting
 * request that already exists, which is an honest end to the journey; a
 * "Subscribe" button that silently did nothing would not be.
 *
 * The card treatment comes from ./frame, shared with the rest of the page.
 */

interface Plan {
  name: string
  price: string
  cadence?: string
  tagline: string
  features: { label: string; included: boolean }[]
  cta: { label: string; href: string }
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: 'PKR 0',
    cadence: 'forever',
    tagline: 'Everything you need to be found.',
    features: [
      { label: 'Listed on the map and in Partner Up', included: true },
      { label: 'Photos of your chargers', included: true },
      { label: 'Reviews from drivers', included: true },
      { label: 'Views and directions dashboard', included: true },
      { label: 'Priority placement in search', included: false },
      { label: 'Featured on the homepage', included: false },
    ],
    cta: { label: 'List your charger', href: '/business/signup' },
  },
  {
    name: 'Premium',
    price: 'PKR 4,999',
    cadence: 'per month',
    tagline: 'For venues that want the traffic.',
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Priority placement in search', included: true },
      { label: 'Featured on the homepage', included: true },
      { label: 'Highlighted pin on the map', included: true },
      { label: 'Longer analytics history', included: true },
      { label: 'Named account contact', included: false },
    ],
    cta: { label: 'Talk to us about Premium', href: '/for-businesses#meeting' },
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Let’s talk',
    tagline: 'Fleets, chains and multi-site operators.',
    features: [
      { label: 'Everything in Premium', included: true },
      { label: 'Multiple sites under one account', included: true },
      { label: 'Named account contact', included: true },
      { label: 'Bulk listing import', included: true },
      { label: 'Custom terms', included: true },
      { label: 'API access on request', included: true },
    ],
    cta: { label: 'Arrange a meeting', href: '/for-businesses#meeting' },
  },
]

export function PartnerPricing() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className="container-plug">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
            Plans
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Listing is free. Growing is optional.
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            You keep what drivers pay you either way — Plug.pk never takes a cut of your
            charging revenue.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                plan.featured ? FRAME_FEATURED : FRAME,
                // Lifted out of the row so the recommended plan is where the
                // eye lands, without needing a fill to say so.
                plan.featured && 'lg:-mt-4 lg:mb-4',
              )}
            >
              <div className={cn(FACE, 'p-8')}>
                {plan.featured ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-brand px-3.5 py-1 text-ui-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
                    Most popular
                  </span>
                ) : null}

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-ui-sm text-slate-500">{plan.tagline}</p>

                <p className="mt-5 flex items-end gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-slate-900">
                    {plan.price}
                  </span>
                  {plan.cadence ? (
                    <span className="pb-1 text-ui-sm text-slate-400">{plan.cadence}</span>
                  ) : null}
                </p>

                {/* The same ruled cap the other cards carry, so the three
                    sections read as one system rather than three designs. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-6 block h-0.5 origin-left rounded-full transition-all duration-300',
                    plan.featured
                      ? 'w-16 bg-gradient-brand'
                      : 'w-10 bg-slate-300 group-hover:w-16 group-hover:bg-gradient-brand',
                  )}
                />

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className={cn(
                        'flex items-start gap-2.5 text-ui-sm',
                        feature.included ? 'text-slate-700' : 'text-slate-400',
                      )}
                    >
                      {/* Outlined ticks rather than filled pills, matching the
                          no-fill rule the rest of the page follows. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          feature.included
                            ? 'border-emerald-300 text-emerald-600'
                            : 'border-slate-200 text-slate-300',
                        )}
                      >
                        {feature.included ? <Check size={11} /> : <Minus size={11} />}
                      </span>
                      {feature.label}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta.href}
                  className={cn(
                    'group/cta mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-ui font-semibold transition-all duration-200',
                    plan.featured
                      ? 'bg-gradient-brand text-white shadow-[0_8px_25px_rgba(37,99,235,0.25)] hover:-translate-y-0.5'
                      : 'border-[1.5px] border-slate-300 text-slate-700 hover:border-plug-blue-400 hover:text-plug-blue-700',
                  )}
                >
                  {plan.cta.label}
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Said plainly rather than buried, because a plan page that implies a
            card will be charged when nothing charges it is the kind of detail
            people rightly get annoyed about. */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-ui-sm text-slate-500">
          Paid plans are arranged with us directly — there is no card payment on the site yet.
          Free listings go live as soon as we have verified the details.
        </p>
      </div>
    </section>
  )
}
