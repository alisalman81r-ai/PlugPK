// src/components/business/BusinessPricing.tsx
import { CheckCircle2, ChevronDown } from 'lucide-react'

import { Button, SectionHeader } from '@/components/ui'

const BASIC_FEATURES = [
  'Map listing',
  'Basic business profile',
  'Add up to 2 chargers',
  'Receive reviews',
  'Navigate clicks',
]

const PREMIUM_FEATURES = [
  'Priority map listing',
  'Featured badge',
  'Up to 10 chargers',
  'Analytics dashboard',
  'Promoted in search',
  'Respond to reviews',
  'Business support',
]

const ENTERPRISE_FEATURES = [
  'Multiple locations',
  'Dedicated account manager',
  'Custom integrations',
  'SLA guarantee',
  'White-label options',
  'Volume pricing',
]

const FAQS = [
  {
    question: 'Is the Basic plan really free forever?',
    answer:
      'Yes. Listing your business, appearing on the map and receiving reviews cost nothing, with no time limit and no card required. Premium adds priority placement and analytics on top.',
  },
  {
    question: 'How quickly will my listing go live?',
    answer:
      'Most listings are verified and live within 24 hours. We check that the address and charger details are accurate before publishing, which protects both you and the drivers who rely on us.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer:
      'Yes. Changes take effect at the start of your next billing cycle, and downgrading never removes your listing — you simply return to the Basic feature set.',
  },
  {
    question: 'Do I need technical knowledge to list?',
    answer:
      'No. If you know your charger type, its power rating and how many ports you have, the form takes about five minutes. Our team fills in anything you are unsure about during verification.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Bank transfer, credit and debit cards, and the major Pakistani mobile wallets. Enterprise customers can be invoiced against a purchase order.',
  },
]

function FeatureList({ features, dark = false }: { features: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-3">
          <CheckCircle2
            size={16}
            className={dark ? 'shrink-0 text-plug-cyan-400' : 'shrink-0 text-green-500'}
            aria-hidden="true"
          />
          <span className={dark ? 'text-sm text-white/80' : 'text-sm text-slate-600'}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function BusinessPricing() {
  return (
    <section className="section-padding bg-white">
      <div className="container-plug">
        <SectionHeader
          align="center"
          eyebrow="Pricing"
          eyebrowColor="blue"
          title="Simple, Transparent Pricing"
          subtitle="Start free. Upgrade when ready."
        />

        <div className="mx-auto mt-16 grid max-w-[900px] gap-8 lg:grid-cols-3">
          {/* Basic */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <p className="text-lg font-bold text-slate-900">Basic</p>
            <p className="mt-2">
              <span className="text-4xl font-black text-slate-900">PKR 0</span>
              <span className="text-base text-slate-400">/month</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">Perfect to get started</p>

            <hr className="my-6 border-slate-100" />

            <FeatureList features={BASIC_FEATURES} />

            <Button href="/business/signup" variant="secondary" fullWidth className="mt-8 h-11">
              Get Started Free
            </Button>
          </div>

          {/* Premium */}
          <div className="relative rounded-3xl border-2 border-plug-blue-600 bg-blue-50/30 p-8 shadow-blue">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-blue">
              Most Popular
            </span>

            <p className="text-lg font-bold text-plug-blue-600">Premium</p>
            <p className="mt-2">
              <span className="text-4xl font-black text-slate-900">PKR 4,999</span>
              <span className="text-base text-slate-400">/month</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">For active EV destinations</p>

            <hr className="my-6 border-blue-100" />

            <p className="mb-3 text-sm font-semibold text-slate-700">Everything in Basic, plus:</p>
            <FeatureList features={PREMIUM_FEATURES} />

            <Button href="/business/signup" variant="gradient" fullWidth className="mt-8 h-11">
              Start Premium Trial
            </Button>
            <p className="mt-2 text-center text-xs text-plug-blue-600">14 days free</p>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl bg-slate-900 p-8">
            <p className="text-lg font-bold text-white/60">Enterprise</p>
            <p className="mt-2">
              <span className="text-4xl font-black text-white">Custom</span>
            </p>
            <p className="mt-2 text-sm text-white/50">For large networks</p>

            <hr className="my-6 border-white/10" />

            <p className="mb-3 text-sm font-semibold text-white/80">Everything in Premium, plus:</p>
            <FeatureList features={ENTERPRISE_FEATURES} dark />

            <Button
              href="/contact"
              fullWidth
              className="mt-8 h-11 bg-white text-slate-900 hover:bg-slate-100"
            >
              Contact Sales
            </Button>
          </div>
        </div>

        {/* FAQ — native <details> so this stays a server component. */}
        <div className="mx-auto mt-20 max-w-[600px]">
          <h3 className="mb-10 text-center text-2xl font-bold text-slate-900">
            Frequently Asked Questions
          </h3>

          {FAQS.map((faq) => (
            <details key={faq.question} className="group border-b border-slate-100 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 marker:content-['']">
                {faq.question}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
