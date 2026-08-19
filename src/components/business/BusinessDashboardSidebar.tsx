// src/components/business/BusinessDashboardSidebar.tsx
'use client'

import {
  BarChart2,
  Building2,
  LayoutDashboard,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { BusinessAnalytics } from '@/lib/mock-data'
import type { Business } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface BusinessDashboardSidebarProps {
  /**
   * The signed-in owner's real listing, or undefined when the account has
   * none.
   *
   * The mock business and mock analytics props that used to sit here are gone:
   * every page in the portal now reads the database, so there is nothing left
   * to fall back to and nothing invented to show.
   */
  listing?: {
    name: string
    type: string
    city: string
    status: string
  }
}

interface BusinessNavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { label: 'Overview', href: '/business/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Profile', href: '/business/profile', icon: Building2 },
  { label: 'Chargers', href: '/business/chargers', icon: Zap },
  { label: 'Reviews', href: '/business/reviews', icon: Star },
  { label: 'Analytics', href: '/business/analytics', icon: BarChart2 },
]

export function isBusinessItemActive(
  pathname: string,
  item: Pick<BusinessNavItem, 'href' | 'exact'>,
): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function BusinessDashboardSidebar({ listing }: BusinessDashboardSidebarProps) {
  const pathname = usePathname()

  const name = listing?.name ?? 'No listing yet'
  const type = (listing?.type ?? '').replace('-', ' ')
  const city = listing?.city ?? ''
  const isLive = listing?.status === 'approved'

  return (
    <div className="scrollbar-hide sticky top-[64px] flex h-[calc(100vh-64px)] w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="truncate font-bold text-slate-900">{name}</p>
        <p className="mt-0.5 text-xs capitalize text-slate-400">
          {type} · {city}
        </p>

        <span
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
            isLive ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50',
          )}
        >
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-green-500' : 'bg-amber-500')}
          />
          <span
            className={cn(
              'text-[10px] font-semibold',
              isLive ? 'text-green-700' : 'text-amber-700',
            )}
          >
            {isLive ? 'Live on Plug.pk' : 'Under Review'}
          </span>
        </span>
      </div>

      {/* The quick-stats block is gone.
          It printed 1,240 views, 89 clicks and a 4.8 rating from mock data —
          this application records no page views, no navigate clicks and no
          reviews for a business, so those were four invented numbers sitting
          above the owner's real listing. They can return when something
          measures them. */}

      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Business Portal
        </p>

        {BUSINESS_NAV.map((item) => {
          const active = isBusinessItemActive(pathname, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-[42px] items-center gap-3 rounded-xl transition-all duration-150',
                active
                  ? 'border-l-[3px] border-plug-blue-600 bg-blue-50 pl-[9px] pr-3'
                  : 'px-3 hover:bg-slate-50',
              )}
            >
              <Icon
                size={18}
                className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-sm',
                  active ? 'font-semibold text-plug-blue-600' : 'font-medium text-slate-600',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* The "Go Premium — get priority listing and analytics" card is gone.
          Its button pointed at /business/upgrade, which does not exist, and the
          pricing page it referenced was removed when plans were replaced with
          meeting requests. It offered analytics that every owner now gets, in
          exchange for a payment there was no way to make. */}
    </div>
  )
}
