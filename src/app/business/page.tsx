// src/app/business/page.tsx
import { ArrowRight, Wrench, Zap } from '@/components/ui/icons'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PORTAL_COOKIE } from '@/components/business/portal-mode'
import { EyebrowBadge } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'
import { countPortalSides } from '@/lib/db/service-owner-queries'
import { getCurrentUser } from '@/lib/db/session-actions'

/**
 * The business portal's front door — where every "Business portal" link goes.
 *
 * One portal, two sides. An account that lists only chargers goes straight to
 * the charger side, one that lists only services straight to the service side,
 * and one with both reopens the side it used last (chargers the first time) —
 * the switch in the sidebar moves between them. An account with neither is
 * asked what it would like to list, rather than being dropped into a charger
 * form it may have no use for.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Business portal' }

const SIDES = [
  {
    icon: Zap,
    title: 'List a charger',
    body: 'Hotels, restaurants, offices and homes with EV chargers. Drivers find you on the map, and you can take bookings.',
    href: '/business/signup',
    cta: 'List your charger',
  },
  {
    icon: Wrench,
    title: 'List a service',
    body: 'Workshops, installers, dealers, accessory shops, insurers and roadside assistance. Drivers find you in the services directory.',
    href: '/services/list',
    cta: 'List your service',
  },
]

export default async function BusinessPortalPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/business')

  const { chargers, services } = await countPortalSides(user.id)
  if (chargers > 0 && services === 0) redirect('/business/dashboard')
  if (services > 0 && chargers === 0) redirect('/business/services')
  if (chargers > 0 && services > 0) {
    redirect(cookies().get(PORTAL_COOKIE)?.value === 'services' ? '/business/services' : '/business/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-8 py-5">
        <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
          <Logo tone="light" size="text-xl" />
        </Link>
        <Link href="/dashboard" className="text-sm text-plug-blue-600 hover:underline">
          Your account &rarr;
        </Link>
      </header>

      <div className="mx-auto max-w-[800px] px-4 py-12">
        <div className="mb-10 text-center">
          <EyebrowBadge color="blue">Business portal</EyebrowBadge>
          <h1 className="mt-4 text-4xl font-black text-slate-900">What would you like to list?</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-500">
            Your portal opens here once you have a listing. Charger hosts and service providers both manage theirs
            from this one portal — and if you do both, you can switch between them.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {SIDES.map((side) => {
            const Icon = side.icon
            return (
              <li key={side.title}>
                <Link
                  href={side.href}
                  className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-plug-blue-300 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-plug-blue-50 text-plug-blue-600">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="mt-5 text-xl font-bold text-slate-900">{side.title}</span>
                  <span className="mt-2 flex-1 text-ui-sm leading-relaxed text-slate-500">{side.body}</span>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-700">
                    {side.cta}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
