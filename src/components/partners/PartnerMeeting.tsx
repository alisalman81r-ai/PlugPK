// src/components/partners/PartnerMeeting.tsx
import Link from 'next/link'

import { Reveal } from '@/components/v2/Reveal'
import { Hl, Section, SectionHead, WRAP } from '@/components/v2/ui'

import { PartnerMeetingForm } from './PartnerMeetingForm'

/**
 * The meeting request, on Partner Up (landing-v2's .pt-talk).
 *
 * It used to live on /for-businesses, a second business landing page that
 * contradicted this one. The two pages are one now: /for-businesses redirects
 * here, and this section keeps the `#meeting` anchor every old link points at.
 *
 * The turnaround is stated once and without a number: we reply by email, and a
 * listing is checked before it goes live. Nothing measures either, so no figure
 * of hours or days is promised anywhere on the page.
 */

const COVER = [
  'Getting your sites and chargers onto the map',
  'Keeping your listing accurate as things change',
  'What your dashboard shows about your listing',
  'Anything specific to a larger or multi-site operator',
]

export function PartnerMeeting() {
  return (
    <Section tone="paper" id="meeting" className="scroll-mt-[var(--nav-h)]">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Talk to us"
          title={
            <>
              Rather talk it <Hl>through first?</Hl>
            </>
          }
          lead="A listing is PKR 4,999 a month. Tell us about your sites and we will reply by email to find a time."
        />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal className="rounded-[26px] border border-ink/10 bg-white px-[18px] py-[22px] sm:rounded-[32px] sm:p-[34px]">
            <h3 className="font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium">What we will cover</h3>
            <ul className="mt-6">
              {COVER.map((item, i) => (
                <li key={item} className="flex items-baseline gap-4 border-t border-ink/10 py-4 text-[15.5px] leading-normal text-ink">
                  <span aria-hidden="true" className="font-mono text-xs font-semibold tracking-[0.08em] text-volt-ink">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-[18px] rounded-[18px] bg-chalk bg-[radial-gradient(rgba(11,12,14,.06)_1px,transparent_1.5px)] bg-[length:14px_14px] px-5 py-[18px]">
              <p className="text-sm leading-[1.6] text-muted">
                <b className="text-ink">Already know what you need?</b> You can{' '}
                <Link
                  href="/business/signup"
                  className="font-semibold text-ink underline decoration-volt-2 decoration-2 underline-offset-[3px]"
                >
                  list your charger directly
                </Link>{' '}
                without waiting for a call. Applying is free; every listing is checked before it goes live.
              </p>
            </div>
          </Reveal>

          <PartnerMeetingForm />
        </div>
      </div>
    </Section>
  )
}
