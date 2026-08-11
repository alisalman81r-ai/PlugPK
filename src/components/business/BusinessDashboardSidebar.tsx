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
  business: Business
  analytics: BusinessAnalytics
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
  { label: 'Upgrade', href: '/business/upgrade', icon: TrendingUp },
]

export function isBusinessItemActive(
  pathname: string,
  item: Pick<BusinessNavItem, 'href' | 'exact'>,
): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function BusinessDashboardSidebar({ business, analytics }: BusinessDashboardSidebarProps) {
  const pathname = usePathname()
  const chargerCount = business.stations[0]?.connectors.length ?? 0

  const quickStats = [
    { value: analytics.thisMonth.profileViews.toLocaleString('en-PK'), label: 'Views' },
    { value: String(analytics.thisMonth.navigateClicks), label: 'Clicks' },
    { value: analytics.thisMonth.avgRating.toFixed(1), label: 'Rating' },
    { value: String(chargerCount), label: 'Chargers' },
  ]

  return (
    <div className="scrollbar-hide sticky top-[64px] flex h-[calc(100vh-64px)] w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="truncate font-bold text-slate-900">{business.name}</p>
        <p className="mt-0.5 text-xs capitalize text-slate-400">
          {business.type.replace('-', ' ')} · {business.address.city}
        </p>

        <span
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
            business.isVerified
              ? 'border-green-200 bg-green-50'
              : 'border-amber-200 bg-amber-50',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              business.isVerified ? 'bg-green-500' : 'bg-amber-500',
            )}
          />
          <span
            className={cn(
              'text-[10px] font-semibold',
              business.isVerified ? 'text-green-700' : 'text-amber-700',
            )}
          >
            {business.isVerified ? 'Live on Plug.pk' : 'Under Review'}
          </span>
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
          >
            <p className="font-mono text-lg font-black text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

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

      {!business.isPremium ? (
        <div className="mt-6 rounded-2xl bg-gradient-brand p-4">
          <p className="flex items-center gap-1.5 font-bold text-white">
            <Zap size={16} aria-hidden="true" />
            Go Premium
          </p>
          <p className="mt-1 text-xs text-white/70">Get priority listing and analytics</p>
          <Link
            href="/business/upgrade"
            className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-white text-xs font-bold text-plug-blue-600 transition-colors hover:bg-blue-50"
          >
            Upgrade Now &rarr;
          </Link>
        </div>
      ) : null}
    </div>
  )
}
