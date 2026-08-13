// src/components/business/BusinessPricing.tsx
import { ChevronDown } from 'lucide-react'

import { MeetingRequestForm } from '@/components/business/MeetingRequestForm'
import { SectionHeader } from '@/components/ui'

/**
 * Was three published subscription tiers — Basic at PKR 0, Premium at
 * PKR 4,999 a month, and Enterprise. Those are gone: the product no longer
 * publishes prices anywhere, so quoting a monthly figure here while removing
 * per-kWh rates from the map would have been inconsistent, and a stale
 * published price is a promise you have to honour.
 *
 * Terms are discussed instead, which is what the meeting request collects.
 *
 * The file keeps its name because /for-businesses imports it and the section
 * still occupies the same slot in that page's flow.
 */

/**
 * Only questions that are still true. The three that went were about billing
 * cycles, upgrading between plans, and whether Basic is free forever — none
 * of which mean anything once there are no plans.
 */
const FAQS = [
  {
    question: 'What does it cost to list my business?',
    answer:
      'Listing is free. Appearing on the map, receiving reviews and being found by drivers cost nothing, with no time limit and no card required. If you need something beyond a standard listing, that is what the meeting is for.',
  },
  {
    question: 'How quickly will my listing go live?',
    answer:
      'Most listings are verified and live within 24 hours. We check that the address and charger details are accurate before publishing, which protects both you and the drivers who rely on us.',
  },
  {
    question: 'Do I need technical knowledge to list?',
    answer:
      'No. You fill in your business details and charger information through a form, and we handle the rest. If you would rather walk through it with someone, ask for a meeting.',
  },
  {
    question: 'Do I set my own charging prices?',
    answer:
      'Yes, and you always have. Plug.pk does not set, take a cut of, or publish your rates — drivers confirm the current price with you or at the charger itself.',
  },
]

export function BusinessPricing() {
  return (
    <section id="meeting" className="bg-slate-50 py-20 lg:py-24">
      <div className="container-plug">
        <SectionHeader
          align="center"
          eyebrow="Talk to us"
          eyebrowColor="blue"
          title="Let’s work out what you need"
          subtitle="Listing is free. Tell us about your sites and we will find a time to talk it through."
        />

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* ── What a meeting covers ────────────────────────────── */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">What we will cover</h3>
            <ul className="mt-5 flex flex-col gap-4">
              {[
                'Getting your sites and chargers onto the map',
                'Keeping availability accurate as it changes',
                'What the analytics show you about your listing',
                'Anything specific to a larger or multi-site operator',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-plug-blue-600"
                  />
                  <span className="leading-relaxed text-slate-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-ui-sm leading-relaxed text-slate-600">
                Already know what you need? You can{' '}
                <a
                  href="/business/signup"
                  className="font-semibold text-plug-blue-600 underline-offset-2 hover:underline"
                >
                  list your business directly
                </a>{' '}
                without waiting for a call.
              </p>
            </div>
          </div>

          <MeetingRequestForm />
        </div>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h3 className="mb-6 text-center text-xl font-bold text-slate-900">
            Common questions
          </h3>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group/faq rounded-2xl border border-slate-200 bg-white px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-slate-400 transition-transform duration-200 group-open/faq:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
