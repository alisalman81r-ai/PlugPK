// src/app/(main)/services/list/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Clock, MapPinned, Wrench } from '@/components/ui/icons'

import { ServiceApplicationForm } from '@/components/services/ServiceApplicationForm'
import { EyebrowBadge } from '@/components/ui'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

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
    <div className="min-h-below-nav bg-slate-50">
      <div className="mx-auto max-w-[800px] px-4 py-12">
        <div className="mb-12 text-center">
          <EyebrowBadge color="blue">Service Registration</EyebrowBadge>
          <h1 className="mt-4 text-4xl font-black text-slate-900">List Your Service on plugpk</h1>
          <p className="mt-3 text-lg text-slate-500">
            Workshops, home charger installers, dealers and roadside assistance
          </p>
          {listed > 0 ? (
            <p className="mt-3 font-mono text-ui-sm text-slate-400">
              {listed} {listed === 1 ? 'service' : 'services'} listed so far
            </p>
          ) : null}
        </div>

        {profile ? (
          <ServiceApplicationForm applicant={{ name: profile.name, email: profile.email }} />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2">
              {WHAT_YOU_NEED.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <Icon size={20} className="text-plug-blue-600" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-ui-sm leading-relaxed text-slate-500">{item.body}</p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="text-xl font-bold text-slate-900">Create a free account to apply</h2>
              <p className="mx-auto mt-2 max-w-md text-ui leading-relaxed text-slate-500">
                Your application belongs to your plugpk account, so our team knows who sent it. It takes a minute, and
                you come straight back here afterwards.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={`/signup?redirect=${RETURN}`}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  Create a free account
                </Link>
                <Link
                  href={`/login?redirect=${RETURN}`}
                  className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-slate-300 bg-white px-6 text-ui font-semibold text-slate-800 transition-colors hover:border-slate-900"
                >
                  I already have an account
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-ui-sm text-slate-500">
              Hosting EV chargers rather than offering a service?{' '}
              <Link href="/business/signup" className="font-semibold text-plug-blue-600 hover:underline">
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
