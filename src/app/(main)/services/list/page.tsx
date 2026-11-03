// src/app/(main)/services/list/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Clock, MapPinned, Wrench } from '@/components/ui/icons'

import { ServiceApplicationForm } from '@/components/services/ServiceApplicationForm'
import { Btn, BtnArrow, Hl } from '@/components/v2/ui'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

/**
 * Apply to be listed in the services directory.
 *
 * The counterpart to /business/signup, and now laid out the same way: a short
 * heading, then the application one step at a time. Services were admin-created
 * only, so a workshop, installer or dealer had no way in at all — this is that
 * same flow, and it lands in the same admin queue with the same approve-or-
 * reject decision at the end of it.
 *
 * Every claim below maps to something the application does. "Nothing goes live
 * until we check it" is the status gate on EVService; "you appear under your
 * category" is what the directory does once the row is approved.
 */

// Per visitor: signed out sees the sign-up step, signed in sees the form.
export const dynamic = 'force-dynamic'

const RETURN = encodeURIComponent('/services/list')

export const metadata: Metadata = {
  title: 'List your EV service',
  description:
    'Workshops, home charger installers, dealers and roadside assistance — apply to be listed in the plugpk EV services directory. PKR 4,999 a month to list, checked before it goes live.',
  alternates: { canonical: '/services/list' },
}

/** What the application asks for, so nobody starts it without the details to hand. */
const WHAT_YOU_NEED = [
  {
    icon: Wrench,
    title: 'What you do',
    body: 'Your category, a sentence or two about your services, and prices if you publish them.',
  },
  {
    icon: MapPinned,
    title: 'Where you are',
    body: 'Your city and a map pin drivers can navigate to — easiest standing at your premises.',
  },
  {
    icon: Clock,
    title: 'When you are open',
    body: 'Your opening hours, and a phone number or email we can reach you on.',
  },
  {
    icon: BadgeCheck,
    title: 'A person checks it',
    body: 'Nothing is published until our team has confirmed the details. PKR 4,999 a month once approved.',
  },
]

export default async function ListServicePage() {
  const [counts, profile] = await Promise.all([getServiceCategoryCounts(), getCurrentProfile()])
  const listed = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <div data-theme="light" className="relative isolate min-h-below-nav overflow-hidden bg-chalk">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 -z-[1] h-[620px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.2),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-[920px] px-4 pb-[72px] pt-[clamp(48px,8vw,96px)] sm:px-8">
        <header className="text-center">
          <p className="inline-flex h-9 items-center gap-2.5 rounded-full bg-ink px-4 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-white before:h-2 before:w-2 before:rounded-[3px] before:bg-volt before:content-['']">
            List your service
          </p>
          <h1 className="mx-auto mt-[26px] max-w-[820px] text-balance font-display text-[clamp(40px,6vw,76px)] leading-[1.02] text-ink">
            Put your EV service in the <Hl>plugpk directory.</Hl>
          </h1>
          <p className="mx-auto mt-[26px] max-w-[700px] text-pretty text-[clamp(16px,1.5vw,19px)] leading-[1.6] text-muted">
            Workshops, home charger installers, dealers and roadside assistance
          </p>
          {listed > 0 ? (
            <p className="mt-3 font-mono text-[13px] font-medium text-muted">
              {listed} {listed === 1 ? 'service' : 'services'} listed so far
            </p>
          ) : null}
        </header>

        {profile ? (
          <div className="mt-12 text-left">
            <ServiceApplicationForm applicant={{ name: profile.name, email: profile.email }} />
          </div>
        ) : (
          <>
            <p className="mb-[18px] mt-14 text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              What you&apos;ll need
            </p>
            <ol className="grid gap-4 sm:grid-cols-2">
              {WHAT_YOU_NEED.map((item, index) => {
                const Icon = item.icon
                const last = index === WHAT_YOU_NEED.length - 1
                return (
                  <li
                    key={item.title}
                    className={cn(
                      'relative rounded-[28px] border p-7 shadow-e1 transition-[translate,box-shadow] duration-[450ms] ease-out hover:-translate-y-1 hover:shadow-e2',
                      last ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink',
                    )}
                  >
                    <span className={cn('absolute right-[26px] top-[26px] font-mono text-[13px] font-semibold', last ? 'text-white/35' : 'text-[#a7aab0]')}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Icon
                      size={40}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={last ? 'text-volt drop-shadow-[0_0_10px_rgba(212,255,58,.35)]' : 'text-ink'}
                    />
                    <h2 className="mt-[22px] font-display text-2xl leading-[1.15]">{item.title}</h2>
                    <p className={cn('mt-2.5 text-[15px] leading-[1.55]', last ? 'text-fog' : 'text-muted')}>{item.body}</p>
                  </li>
                )
              })}
            </ol>

            <div className="mt-11 text-center">
              <h2 className="font-display text-[clamp(24px,2.6vw,30px)] leading-[1.15] text-ink">Create a free account to apply</h2>
              <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted">
                Your application belongs to your plugpk account, so our team knows who sent it. It takes a minute, and
                you come straight back here afterwards.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3.5 sm:flex-row">
                <Btn href={`/signup?redirect=${RETURN}`} variant="ink" size="lg">
                  Create a free account
                  <BtnArrow />
                </Btn>
                <Btn href={`/login?redirect=${RETURN}`} variant="light" size="lg" className="border-[1.5px] border-ink/20">
                  I already have an account
                </Btn>
              </div>
            </div>

            <p className="mx-auto mt-[26px] max-w-[640px] text-center text-sm leading-[1.6] text-muted">
              Hosting EV chargers rather than offering a service?{' '}
              <Link href="/business/signup" className="font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4 hover:decoration-ink">
                List your charger instead
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  )
}
