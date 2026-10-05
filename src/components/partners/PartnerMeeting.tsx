// src/components/partners/PartnerMeeting.tsx
import { CalendarCheck } from '@/components/ui/icons'
import Link from 'next/link'

import { MeetingRequestForm } from '@/components/business/MeetingRequestForm'
import { SectionIntro } from '@/components/shared/SectionIntro'

/** One measure, matching the rest of the page. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * The meeting request, on Partner Up.
 *
 * It used to live on /for-businesses — a second business landing page in an
 * older style that contradicted this one (it promised "Live in 24 hours" and
 * "hundreds of businesses already reaching EV owners" beside an empty partner
 * directory). The two pages are one now: /for-businesses redirects here, and
 * this section keeps the `#meeting` anchor that every old link points at.
 *
 * The turnaround is stated once and without a number: we reply by email, and
 * a listing is checked before it goes live. Nothing measures either, so no
 * figure of hours or days is promised anywhere on the page.
 */
export function PartnerMeeting() {
  return (
    <section id="meeting" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className={STAGE}>
        <SectionIntro
          eyebrow="Talk to us"
          icon={<CalendarCheck size={13} aria-hidden="true" />}
          title="Rather talk it through first?"
          lead="A listing is PKR 4,999 a month. Tell us about your sites and we will reply by email to find a time."
          className="mb-12"
        />

        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h3 className="text-lg font-bold text-slate-900">What we will cover</h3>
            <ul className="mt-5 flex flex-col gap-4">
              {[
                'Getting your sites and chargers onto the map',
                'Keeping your listing accurate as things change',
                'What your dashboard shows about your listing',
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

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-ui-sm leading-relaxed text-slate-600">
                Already know what you need? You can{' '}
                <Link
                  href="/business/signup"
                  className="font-semibold text-plug-blue-600 underline-offset-2 hover:underline"
                >
                  list your charger directly
                </Link>{' '}
                without waiting for a call. Applying is free; every listing is checked before it
                goes live.
              </p>
            </div>
          </div>

          <MeetingRequestForm />
        </div>
      </div>
    </section>
  )
}
