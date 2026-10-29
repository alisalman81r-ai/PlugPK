// src/app/(main)/services/list/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Lock, MapPinned, Wrench } from '@/components/ui/icons'

import { ServiceApplicationForm } from '@/components/services/ServiceApplicationForm'
import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

/**
 * Apply to be listed in the services directory.
 *
 * The counterpart to /business/signup, which has always existed for charger
 * hosts. Services were admin-created only, so a workshop, installer or insurer
 * had no way in at all — this is that same flow, and it lands in the same admin
 * queue with the same approve-or-reject decision at the end of it.
 *
 * Every claim below maps to something the application does. "Nothing goes live
 * until we check it" is the status gate on EVService; "you appear in search and
 * on the category page" is what the directory does once the row is approved.
 */

// Per visitor: signed out sees the sign-up step, signed in sees the form.
export const dynamic = 'force-dynamic'

const RETURN = encodeURIComponent('/services/list')

export const metadata: Metadata = {
  title: 'List your EV service',
  description:
    'Workshops, installers, dealers and insurers — apply to be listed in the Plug.pk EV services directory. PKR 4,999 a month to list, checked before it goes live.',
  alternates: { canonical: '/services/list' },
}

/** One measure, matching /map, /routes, /community and Partner Up. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

const STEPS = [
  {
    icon: Wrench,
    title: 'Tell us what you do',
    body: 'Your business, who we should talk to, where you are on the map and when you are open. About five minutes.',
  },
  {
    icon: BadgeCheck,
    title: 'We check the details',
    body: 'A person reads every application and confirms the address and the contact details before anything is published.',
  },
  {
    icon: MapPinned,
    title: 'You appear in the directory',
    body: 'Once approved you are on the services page under your category, findable by drivers searching for exactly what you do.',
  },
]

export default async function ListServicePage() {
  const [counts, profile] = await Promise.all([getServiceCategoryCounts(), getCurrentProfile()])
  const listed = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="min-h-below-nav bg-slate-50">
      {/* ── The ask ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-plug-navy-950 pb-28 pt-24 lg:pb-36 lg:pt-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -top-40 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        </div>

        <div className={cn(STAGE, 'relative text-center')}>
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-sky-300">
            EV services
          </span>

          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.035em] text-white">
            Fix, fit or insure EVs?{' '}
            <span className="bg-gradient-to-r from-plug-blue-400 via-plug-cyan-300 to-plug-cyan-400 bg-clip-text text-transparent">
              Get listed
            </span>
            .
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-ui-lg leading-relaxed text-white/60">
            Workshops, home charger installers, dealers, accessory shops, insurers and
            roadside assistance. PKR 4,999 a month to list, and checked by a person before it goes live.
          </p>

          {listed > 0 ? (
            <p className="mt-8 font-mono text-ui-sm text-white/45">
              {listed} {listed === 1 ? 'service' : 'services'} listed so far
            </p>
          ) : null}
        </div>
      </section>

      {/* ── How it works, then the form ──────────────────────────── */}
      <section className="-mt-16 pb-24 lg:-mt-20 lg:pb-32">
        <div className={STAGE}>
          <ol className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                <li key={step.title} className={FRAME}>
                  <div className={cn(FACE, 'p-8')}>
                    <span aria-hidden="true" className={ICON_FRAME}>
                      <Icon size={24} className={ICON_GLYPH} />
                    </span>
                    <span aria-hidden="true" className={cn('mt-8', CAP_RULE)} />
                    <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                      {index + 1}. {step.title}
                    </h2>
                    <p className="mt-3 text-ui leading-relaxed text-slate-500">{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mx-auto mt-12 max-w-3xl lg:mt-16">
            {profile ? (
              <ServiceApplicationForm applicant={{ name: profile.name, email: profile.email }} />
            ) : (
              <div className={FRAME}>
                <div className={cn(FACE, 'p-8 text-center sm:p-10')}>
                  <span
                    aria-hidden="true"
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-plug-blue-300 text-plug-blue-600"
                  >
                    <Lock size={24} />
                  </span>
                  <h2 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
                    Create a free account to apply
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-ui leading-relaxed text-slate-500">
                    Your application belongs to your Plug.pk account, so our team knows who sent it
                    and you can sign in to keep it up to date. It takes a minute; you come straight
                    back here afterwards.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
