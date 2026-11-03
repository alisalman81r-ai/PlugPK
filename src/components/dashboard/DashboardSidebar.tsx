// src/components/dashboard/DashboardSidebar.tsx
'use client'

import {
  Bookmark,
  CalendarCheck,
  Car,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Route,
  Settings,
  Users,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Avatar } from '@/components/ui'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

/**
 * Counts shown beside the nav items. Real numbers now: the mock hook that
 * used to supply these is gone.
 */
export interface DashboardStats {
  totalSaved: number
  totalReviews: number
  totalRoutes: number
  memberDays: number
}

export interface DashboardSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string | null
    city?: string
    joinedAt: string
  }
  stats: DashboardStats
}

export interface DashboardNavItem {
  label: string
  href: string
  icon: IconType
  exact?: boolean
  badgeKey?: keyof DashboardStats
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'My vehicles', href: '/dashboard/vehicles', icon: Car },
  { label: 'Saved stations', href: '/dashboard/saved', icon: Bookmark, badgeKey: 'totalSaved' },
  { label: 'Saved routes', href: '/dashboard/routes', icon: Route, badgeKey: 'totalRoutes' },
  { label: 'My bookings', href: '/dashboard/bookings', icon: CalendarCheck },
  { label: 'My clubs', href: '/dashboard/clubs', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function isDashboardItemActive(
  pathname: string,
  item: Pick<DashboardNavItem, 'href' | 'exact'>,
): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/** The account's initial on a volt disc, or its picture (.av of landing-v2). */
export function DashAvatar({ name, src, size }: { name: string; src?: string | null; size: number }) {
  return <Avatar name={name} src={src} size={size} className="!bg-none bg-volt font-semibold text-ink" />
}

/** The ink card with the account's picture, name and email (.aprof). */
export function ProfileCard({ user }: { user: DashboardSidebarProps['user'] }) {
  return (
    <div className="relative isolate flex items-center gap-3.5 overflow-hidden rounded-[22px] bg-ink p-4 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[120px] -top-[120px] -z-10 h-60 w-60 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.22),transparent_70%)]"
      />
      <span className="relative shrink-0">
        <DashAvatar name={user.name} src={user.avatar} size={52} />
        <span
          title="Signed in"
          className="absolute bottom-0.5 right-0 h-[13px] w-[13px] rounded-full border-[2.5px] border-ink bg-[#35D07F]"
        >
          <span className="sr-only">Signed in</span>
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[21px] leading-[1.1]">{user.name}</span>
        <span className="mt-[3px] block truncate text-[13px] text-fog">{user.email}</span>
        {user.city ? (
          <span className="mt-1 flex items-center gap-1 text-xs text-fog">
            <MapPin size={11} className="shrink-0" aria-hidden="true" />
            {user.city}
          </span>
        ) : null}
      </span>

      <Link
        href="/dashboard/settings"
        aria-label="Edit your profile"
        className="relative z-[1] grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-white/[0.18] text-white transition-colors hover:bg-volt hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
      >
        <Pencil size={16} aria-hidden="true" />
      </Link>
    </div>
  )
}

export function DashboardSidebar({ user, stats }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside aria-label="Your account" className="grid gap-3.5">
      <ProfileCard user={user} />

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { value: stats.totalSaved, label: 'Saved' },
          { value: stats.totalReviews, label: 'Reviews' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ink/10 bg-white p-3.5 text-center">
            <b className="block font-mono text-2xl font-semibold leading-none tabular-nums text-ink">{stat.value}</b>
            <span className="mt-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mx-2 mt-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Dashboard</p>

      <nav aria-label="Dashboard" className="grid gap-0.5">
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
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus',
                active ? 'bg-ink text-white' : 'text-[#33363b] hover:bg-ink/5 hover:text-ink',
              )}
            >
              <Icon size={19} className={cn('shrink-0', active ? 'text-volt' : 'text-muted')} aria-hidden="true" />
              {item.label}
              {badge > 0 ? (
                <span
                  className={cn(
                    'ml-auto min-w-[22px] rounded-full px-[7px] py-0.5 text-center font-mono text-[11px] font-semibold',
                    active ? 'bg-volt text-ink' : 'bg-chalk text-muted',
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={async () => {
          // This used to navigate home and leave the session cookie in
          // place, so "Sign Out" signed nobody out — the next visit to
          // /dashboard was still logged in.
          await signOut()
          window.location.assign('/')
        }}
        className="mt-1.5 flex min-h-11 w-full items-center gap-3 border-t border-ink/10 px-3 pt-2.5 text-left text-[15px] text-[#c2410c] transition-colors hover:text-ember"
      >
        <LogOut size={19} className="shrink-0" aria-hidden="true" />
        Sign out
      </button>

      <p className="mx-3 font-mono text-xs text-muted">plugpk v1.0.0 · Beta</p>
    </aside>
  )
}
