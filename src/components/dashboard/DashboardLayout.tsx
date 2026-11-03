// src/components/dashboard/DashboardLayout.tsx
'use client'

import { ArrowLeft, Bookmark, Car, LayoutDashboard, Settings, type IconType } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { ACCT_DELAY, ACCT_RISE } from './dash-ui'
import {
  DASHBOARD_NAV,
  DashboardSidebar,
  ProfileCard,
  isDashboardItemActive,
  type DashboardStats,
} from './DashboardSidebar'

export interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  /**
   * The signed-in account. Passed in from the server page rather than read
   * from a hook: this used to call useDashboard(), which returned MOCK_USER,
   * so every visitor saw the same fixture person's name and email.
   */
  user: { name: string; email: string; city?: string; joinedAt: string; avatar?: string | null }
  stats: DashboardStats
}

interface MobileTab {
  label: string
  href: string
  icon: IconType
  exact?: boolean
}

const MOBILE_TABS: MobileTab[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Vehicles', href: '/dashboard/vehicles', icon: Car },
  { label: 'Saved', href: '/dashboard/saved', icon: Bookmark },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

/** The square back button beside the page title (.ahead__back). */
function HeadBack() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push('/dashboard')
      }}
      aria-label="Back"
      title="Back"
      // .ahead__back: the border darkens over .2s while the button springs 2px left over .3s.
      className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-ink/10 bg-white text-ink [transition:border-color_.2s,translate_.3s_cubic-bezier(.34,1.56,.64,1)] hover:border-ink hover:[translate:-2px_0] focus-visible:outline-none focus-visible:shadow-focus"
    >
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  )
}

/**
 * The account shell (landing-v2's account-settings.html): a 290px side panel
 * — the ink profile card, two counts, the section nav and sign out — and the
 * page's own cards beside it, all on chalk.
 *
 * Below lg the side panel gives way to the profile card and a row of section
 * chips on top, with the dashboard's four-tab bar at the foot of the screen.
 */
export function DashboardLayout({ children, title, subtitle, action, user, stats }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div
      data-theme="light"
      className="min-h-below-nav bg-chalk px-[clamp(16px,3vw,48px)] pb-28 pt-6 sm:pt-8 lg:pb-24"
    >
      <div className="mx-auto grid max-w-[1320px] items-start gap-[clamp(20px,3vw,40px)] lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* .acct__side, .ahead and each .apanel rise in (page-account.css). */}
        <div className={cn('sticky top-[calc(var(--nav-h)+16px)] hidden lg:block', ACCT_RISE)}>
          <DashboardSidebar user={user} stats={stats} />
        </div>

        <div className="min-w-0">
          {/* Phones and tablets: who is signed in, and every section a tap away. */}
          <div className={cn('mb-5 grid gap-3 lg:hidden', ACCT_RISE)}>
            <ProfileCard user={user} />
            <nav aria-label="Dashboard sections" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex w-max gap-2">
                {DASHBOARD_NAV.map((item) => {
                  const active = isDashboardItemActive(pathname, item)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors',
                          active ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink hover:border-ink/30',
                        )}
                      >
                        <Icon size={16} className={active ? 'text-volt' : 'text-muted'} aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          <header className={cn('mb-[22px] flex flex-wrap items-center justify-between gap-4', ACCT_RISE, ACCT_DELAY.head)}>
            <div className="flex min-w-0 items-center gap-[18px]">
              {pathname !== '/dashboard' ? <HeadBack /> : null}
              <div className="min-w-0">
                <h1 className="m-0 font-display text-[clamp(32px,3.4vw,48px)] leading-none text-ink">{title}</h1>
                {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
              </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>

          {children}
        </div>
      </div>

      {/* Dashboard-scoped mobile nav. The global BottomTabBar hides itself on
          /dashboard routes so the two can never stack. */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
      >
        <div className="grid h-16 grid-cols-4">
          {MOBILE_TABS.map((tab) => {
            const active = isDashboardItemActive(pathname, tab)
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-0 items-center justify-center px-0.5"
              >
                <span
                  className={cn(
                    'flex w-full max-w-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-colors duration-150',
                    active && 'bg-ink',
                  )}
                >
                  <Icon size={21} className={cn('shrink-0', active ? 'text-volt' : 'text-muted')} aria-hidden="true" />
                  <span className={cn('max-w-full truncate text-xs font-medium', active ? 'text-white' : 'text-muted')}>
                    {tab.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
