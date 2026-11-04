// src/components/dashboard/DashboardLayout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { IBack } from './acct-icons'
import { ACCT_DELAY, ACCT_RISE } from './dash-ui'
import { DashboardSidebar, type DashboardStats } from './DashboardSidebar'

export interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
  /**
   * The signed-in account. Passed in from the server page rather than read
   * from a hook: this used to call useDashboard(), which returned MOCK_USER,
   * so every visitor saw the same fixture person's name and email.
   */
  user: { name: string; email: string; city?: string; joinedAt: string; avatar?: string | null }
  stats: DashboardStats
}

/**
 * The account shell (plugpk-account-pages, .acct-main / .acct): a 290px side
 * panel — the ink profile card, two counts, the section nav and sign out —
 * and the page's own cards beside it, all on chalk.
 *
 * At 960px and below the grid is one column: the side panel sits above the
 * page, no longer sticky, with its nav in two columns. There is no bottom tab
 * bar — the design has none, and every section is in that nav.
 *
 * The site layout pads the page below the navbar and paints an ink strip
 * behind it; this pulls the chalk up under the floating navbar instead, as the
 * design's .acct-main does (112px to the first card, 96px on phones).
 */
export function DashboardLayout({ children, title, subtitle, action, user, stats }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div
      data-theme="light"
      className="relative -mt-[var(--nav-h)] min-h-screen bg-chalk px-[clamp(16px,3vw,48px)] pb-24 pt-28 max-[640px]:pt-24"
    >
      <div className="mx-auto grid max-w-[1320px] items-start gap-[clamp(20px,3vw,40px)] min-[961px]:grid-cols-[290px_minmax(0,1fr)]">
        <div className={cn('min-[961px]:sticky min-[961px]:top-[104px]', ACCT_RISE)}>
          <DashboardSidebar user={user} stats={stats} />
        </div>

        <div className="min-w-0">
          <header className={cn('mb-[22px] flex items-center gap-[18px]', ACCT_RISE, ACCT_DELAY.head)}>
            {pathname !== '/dashboard' ? (
              <Link
                href="/dashboard"
                aria-label="Back to your account overview"
                // .ahead__back: the border darkens over .2s while it springs 2px left over .3s.
                className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-ink/10 bg-white text-ink [transition:border-color_.2s,translate_.3s_cubic-bezier(.34,1.56,.64,1)] hover:border-ink hover:[translate:-2px_0] focus-visible:outline-none focus-visible:shadow-focus"
              >
                <IBack size={20} />
              </Link>
            ) : null}
            <div className={cn('min-w-0 flex-1', pathname === '/dashboard' && 'pl-0.5')}>
              <h1 className="m-0 font-display text-[clamp(34px,3.4vw,48px)] font-normal leading-none tracking-[-0.015em] text-ink">{title}</h1>
              {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>

          {children}
        </div>
      </div>
    </div>
  )
}
