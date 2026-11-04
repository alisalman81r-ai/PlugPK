// src/components/dashboard/DashboardSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

import { IBookmark, ICal, ICar, IGear, IGrid, IOut, IPen, IRoute, IUsers } from './acct-icons'

/**
 * Counts shown in the side panel. Real numbers: the mock hook that used to
 * supply these is gone.
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
  icon: (p: { size?: number; className?: string }) => React.ReactElement
  exact?: boolean
  badgeKey?: keyof DashboardStats
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: IGrid, exact: true },
  { label: 'My vehicles', href: '/dashboard/vehicles', icon: ICar },
  { label: 'Saved stations', href: '/dashboard/saved', icon: IBookmark },
  { label: 'Saved routes', href: '/dashboard/routes', icon: IRoute },
  { label: 'My bookings', href: '/dashboard/bookings', icon: ICal },
  { label: 'My clubs', href: '/dashboard/clubs', icon: IUsers },
  { label: 'Settings', href: '/dashboard/settings', icon: IGear },
]

export function isDashboardItemActive(pathname: string, item: Pick<DashboardNavItem, 'href' | 'exact'>): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

const AV_FONT: Record<number, number> = { 34: 14, 44: 16, 52: 20, 96: 36 }

/**
 * .av — the account's initial on a volt disc, or its picture. A plain img:
 * these are uploads of unknown size and the optimiser earns nothing here.
 */
export function DashAvatar({ name, src, size, className }: { name: string; src?: string | null; size: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: AV_FONT[size] ?? Math.round(size * 0.38) }}
      className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-volt font-semibold leading-none text-ink', className)}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase() || '?'
      )}
    </span>
  )
}

/** .aprof — the ink card with the account's picture, name and email. */
export function ProfileCard({ user }: { user: DashboardSidebarProps['user'] }) {
  return (
    <div className="relative flex items-center gap-3.5 overflow-hidden rounded-[22px] bg-ink p-4 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[120px] -top-[120px] h-60 w-60 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.22),transparent_70%)]"
      />
      <span className="relative">
        <DashAvatar name={user.name} src={user.avatar} size={52} />
        <i title="Signed in" className="absolute bottom-0.5 right-0 h-[13px] w-[13px] rounded-full border-[2.5px] border-ink bg-[#35D07F]">
          <span className="sr-only">Signed in</span>
        </i>
      </span>

      <div className="min-w-0">
        <b className="block truncate font-display text-[21px] font-normal leading-[1.1]">{user.name}</b>
        <span className="mt-[3px] block truncate text-[13px] text-fog">{user.email}</span>
      </div>

      <Link
        href="/dashboard/settings"
        aria-label="Edit your profile"
        className="relative z-[1] ml-auto grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-white/[0.18] text-white transition-colors duration-200 hover:bg-volt hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
      >
        <IPen size={16} />
      </Link>
    </div>
  )
}

/**
 * .acct__side — the profile card, two counts, the section nav, sign out and
 * the version line. Sticky beside the page above 960px; above the page, with
 * the nav in two columns, below it.
 */
export function DashboardSidebar({ user, stats }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = React.useState(false)

  return (
    <aside aria-label="Your account" className="grid gap-3.5">
      <ProfileCard user={user} />

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { value: stats.totalSaved, label: 'Saved' },
          { value: stats.totalReviews, label: 'Reviews' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ink/10 bg-white p-3.5 text-center">
            <b className="block font-mono text-2xl font-semibold tabular-nums tracking-[-0.01em] text-ink">{stat.value}</b>
            <span className="mt-1 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{stat.label}</span>
          </div>
        ))}
      </div>

      <p className="mx-2 mt-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Dashboard</p>

      <nav aria-label="Dashboard" className="grid grid-cols-2 gap-0.5 min-[961px]:grid-cols-1">
        {DASHBOARD_NAV.map((item) => {
          const active = isDashboardItemActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus max-[640px]:px-2.5 max-[640px]:text-sm',
                active ? 'bg-ink text-white' : 'text-[#33363b] hover:bg-ink/5 hover:text-ink',
              )}
            >
              <Icon size={19} className={cn('shrink-0', active ? 'text-volt' : 'text-muted')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          // Ends the session on the server first: navigating home alone used
          // to leave the cookie in place, so "Sign out" signed nobody out.
          setSigningOut(true)
          await signOut()
          window.location.assign('/')
        }}
        className="mt-1.5 flex min-h-11 w-full items-center gap-3 px-3 pt-2.5 text-left text-[15px] text-[#c2410c] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60 min-[961px]:border-t min-[961px]:border-ink/10"
      >
        <IOut size={19} className="shrink-0" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>

      <p className="mx-3 font-mono text-xs tracking-[-0.01em] text-fog">plugpk v1.0.0 · Beta</p>
    </aside>
  )
}
