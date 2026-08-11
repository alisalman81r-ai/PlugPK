// src/components/dashboard/DashboardSidebar.tsx
'use client'

import {
  Bookmark,
  Car,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Route,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/hooks/useDashboard'

export interface DashboardSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string
    city?: string
    joinedAt: string
  }
  stats: DashboardStats
}

export interface DashboardNavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  badgeKey?: keyof DashboardStats
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'My Vehicles', href: '/dashboard/vehicles', icon: Car },
  { label: 'Saved Stations', href: '/dashboard/saved', icon: Bookmark, badgeKey: 'totalSaved' },
  { label: 'Saved Routes', href: '/dashboard/routes', icon: Route, badgeKey: 'totalRoutes' },
  { label: 'My Reviews', href: '/dashboard/reviews', icon: Star, badgeKey: 'totalReviews' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function isDashboardItemActive(
  pathname: string,
  item: Pick<DashboardNavItem, 'href' | 'exact'>,
): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function DashboardSidebar({ user, stats }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="scrollbar-hide sticky top-[72px] flex h-[calc(100vh-72px)] w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <span className="relative shrink-0">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-xl font-bold text-white"
          >
            {user.name.charAt(0)}
          </span>
          <span
            aria-label="Online"
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 block text-sm font-bold text-slate-900">{user.name}</span>
          <span className="mt-0.5 line-clamp-1 block text-xs text-slate-400">{user.email}</span>
          {user.city ? (
            <span className="mt-1 flex items-center gap-1">
              <MapPin size={10} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="text-[10px] text-slate-400">{user.city}</span>
            </span>
          ) : null}
        </span>

        <Link
          href="/dashboard/settings"
          aria-label="Edit profile"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-blue-300 hover:text-plug-blue-600"
        >
          <Pencil size={12} />
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
          <p className="text-xl font-black text-slate-900">{stats.totalSaved}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">Saved</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
          <p className="text-xl font-black text-slate-900">{stats.totalReviews}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">Reviews</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Dashboard
        </p>

        {DASHBOARD_NAV.map((item) => {
          const active = isDashboardItemActive(pathname, item)
          const Icon = item.icon
          const badge = item.badgeKey ? stats[item.badgeKey] : 0

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

              {badge > 0 ? (
                <span
                  className={cn(
                    'ml-auto min-w-[20px] rounded-full px-2 text-center text-xs font-bold',
                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex h-[42px] w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut size={18} className="shrink-0 text-red-400" aria-hidden="true" />
          Sign Out
        </button>

        <p className="mt-4 text-center text-[10px] text-slate-300">Plug.pk v1.0.0 · Beta</p>
      </div>
    </div>
  )
}
