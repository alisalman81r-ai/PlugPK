// src/components/dashboard/DashboardLayout.tsx
'use client'

import { Bookmark, Car, LayoutDashboard, Settings, Star, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { useDashboard } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { DashboardSidebar, isDashboardItemActive } from './DashboardSidebar'

export interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}

interface MobileTab {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const MOBILE_TABS: MobileTab[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Vehicles', href: '/dashboard/vehicles', icon: Car },
  { label: 'Saved', href: '/dashboard/saved', icon: Bookmark },
  { label: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children, title, subtitle, action }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, stats } = useDashboard()

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-slate-50">
      <div className="hidden lg:flex">
        <DashboardSidebar user={user} stats={stats} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {/* pb-24 on mobile clears the dashboard tab bar below. */}
        <div className="scrollbar-hide p-6 pb-24 lg:p-8 lg:pb-8">{children}</div>
      </div>

      {/* Dashboard-scoped mobile nav. The global BottomTabBar hides itself on
          /dashboard routes so the two can never stack. */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {MOBILE_TABS.map((tab) => {
            const active = isDashboardItemActive(pathname, tab)
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex items-center justify-center transition-all duration-150"
              >
                <span
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150',
                    active && 'bg-blue-50 px-4 py-1.5',
                  )}
                >
                  <Icon
                    size={22}
                    className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      active ? 'text-plug-blue-600' : 'text-slate-400',
                    )}
                  >
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
