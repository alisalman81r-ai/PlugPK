// src/app/business/page.tsx
import { ArrowRight, Wrench, Zap } from '@/components/ui/icons'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PORTAL_COOKIE } from '@/components/business/portal-mode'
import { SHELL_BAR_LINK, SHELL_LEAD, SHELL_TITLE, ShellChip, StandaloneShell, shellCardRise } from '@/components/auth/StandaloneShell'
import { BtnArrow, Hl, btnClass } from '@/components/v2/ui'
import { countPortalSides } from '@/lib/db/service-owner-queries'
import { getCurrentUser } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

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
    body: 'Workshops, home charger installers, dealers and roadside assistance. Drivers find you in the services directory.',
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
    <StandaloneShell
      aside={
        <Link href="/dashboard" className={SHELL_BAR_LINK}>
          Your account
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <div className="text-center">
        <ShellChip>Business portal</ShellChip>
        <h1 className={SHELL_TITLE}>
          What would you like to <Hl>list?</Hl>
        </h1>
        <p className={SHELL_LEAD}>
          Your portal opens here once you have a listing. Charger hosts and service providers both manage theirs
          from this one portal — and if you do both, you can switch between them.
        </p>
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2">
        {SIDES.map((side, i) => {
          const Icon = side.icon
          const ink = i === 0
          return (
            <li key={side.title} className={shellCardRise(i)}>
              <Link
                href={side.href}
                className={cn(
                  'group/side relative flex h-full flex-col rounded-[28px] border p-7 transition-[translate,box-shadow] duration-[450ms] ease-out hover:shadow-e2 hover:[translate:0_-4px] focus-visible:outline-none focus-visible:shadow-focus',
                  ink ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink shadow-e1',
                )}
              >
                <span aria-hidden="true" className={cn('absolute right-[26px] top-[26px] font-mono text-[13px] font-semibold', ink ? 'text-white/35' : 'text-[#a7aab0]')}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon
                  size={40}
                  aria-hidden="true"
                  className={ink ? 'text-volt drop-shadow-[0_0_10px_rgba(212,255,58,.35)]' : 'text-ink'}
                />
                <span className="mt-[22px] font-display text-2xl leading-[1.15]">{side.title}</span>
                <span className={cn('mt-2.5 flex-1 text-[15px] leading-[1.55]', ink ? 'text-fog' : 'text-muted')}>{side.body}</span>
                <span className={cn(btnClass(ink ? 'volt' : 'ink', 'sm'), 'mt-7 self-start shadow-none')}>
                  {side.cta}
                  <BtnArrow />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </StandaloneShell>
  )
}
