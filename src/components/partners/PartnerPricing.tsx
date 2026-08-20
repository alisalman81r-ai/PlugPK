// src/components/partners/PartnerPricing.tsx
import { ArrowRight, Check, Minus } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

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
    <section id="pricing" className="scroll-mt-24 bg-slate-50 py-20 lg:py-24">
      <div className="container-plug">
        <div className="mx-auto mb-14 max-w-2xl text-center">
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

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-3xl border bg-white p-7 transition-shadow',
                plan.featured
                  ? 'border-plug-blue-500 shadow-[0_16px_45px_rgba(37,99,235,0.15)] lg:-mt-3 lg:mb-3'
                  : 'border-slate-200 hover:shadow-card-hover',
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3.5 py-1 text-ui-xs font-bold uppercase tracking-wider text-white">
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

              <ul className="mt-7 flex flex-1 flex-col gap-3 border-t border-slate-100 pt-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={cn(
                      'flex items-start gap-2.5 text-ui-sm',
                      feature.included ? 'text-slate-700' : 'text-slate-400',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        feature.included ? 'bg-emerald-100' : 'bg-slate-100',
                      )}
                    >
                      {feature.included ? (
                        <Check size={11} className="text-emerald-600" />
                      ) : (
                        <Minus size={11} className="text-slate-400" />
                      )}
                    </span>
                    {feature.label}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={cn(
                  'group mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-ui font-semibold transition-all duration-200',
                  plan.featured
                    ? 'bg-gradient-brand text-white shadow-[0_8px_25px_rgba(37,99,235,0.25)] hover:-translate-y-0.5'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50',
                )}
              >
                {plan.cta.label}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Said plainly rather than buried, because a plan page that implies a
            card will be charged when nothing charges it is the kind of detail
            people rightly get annoyed about. */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-ui-sm text-slate-500">
          Paid plans are arranged with us directly — there is no card payment on the site yet.
          Free listings go live as soon as we have verified the details.
        </p>
      </div>
    </section>
  )
}
