// src/components/business/BusinessDashboardSidebar.tsx
'use client'

import {
  Banknote,
  BarChart2,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

// Three states (under review / live / not approved) and the ?listing= links.
import { listingHref, listingState } from './listing-state'
import { PORTAL_COOKIE, type PortalMode } from './portal-mode'

export type { PortalMode }

export interface PortalListingSummary {
  id: string
  name: string
  status: string
}

export interface BusinessDashboardSidebarProps {
  /**
   * The listing the portal is showing, or undefined when the account has
   * none.
   *
   * The mock business and mock analytics props that used to sit here are gone:
   * every page in the portal now reads the database, so there is nothing left
   * to fall back to and nothing invented to show.
   */
  listing?: {
    id?: string
    name: string
    type: string
    city: string
    status: string
  }
  /**
   * Every listing on the account. With more than one, the sidebar offers a
   * switcher and every link carries `?listing=` so the choice survives moving
   * between pages — the portal used to manage only the newest listing.
   */
  listings?: PortalListingSummary[]
  /** Which side of the portal is showing: charger listings or service listings. */
  mode?: PortalMode
  /** The account lists both, so the Chargers | Services switch is shown. */
  canSwitch?: boolean
}

export function rememberPortal(mode: PortalMode): void {
  document.cookie = `${PORTAL_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/** The Chargers | Services switch, for an account that lists both. */
export function PortalSwitch({ mode, className }: { mode: PortalMode; className?: string }) {
  return (
    <div role="tablist" aria-label="Portal" className={cn('grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1', className)}>
      {(
        [
          { value: 'chargers', label: 'Chargers', href: '/business/dashboard', icon: Zap },
          { value: 'services', label: 'Services', href: '/business/services', icon: Wrench },
        ] as const
      ).map((side) => {
        const on = side.value === mode
        return (
          <Link
            key={side.value}
            href={side.href}
            role="tab"
            aria-selected={on}
            onClick={() => rememberPortal(side.value)}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors',
              on ? 'bg-white text-plug-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <side.icon size={15} aria-hidden="true" />
            {side.label}
          </Link>
        )
      })}
    </div>
  )
}

interface BusinessNavItem {
  label: string
  href: string
  icon: IconType
  exact?: boolean
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { label: 'Overview', href: '/business/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Profile', href: '/business/profile', icon: Building2 },
  { label: 'Chargers', href: '/business/chargers', icon: Zap },
  { label: 'Bookings', href: '/business/bookings', icon: CalendarCheck },
  { label: 'Payout accounts', href: '/business/payouts', icon: Banknote },
  { label: 'Application', href: '/business/application', icon: ShieldCheck },
  { label: 'Reviews', href: '/business/reviews', icon: Star },
  { label: 'Analytics', href: '/business/analytics', icon: BarChart2 },
]

/** The services side: where an application stands, and the listing itself. */
export const SERVICE_NAV: BusinessNavItem[] = [
  { label: 'Overview', href: '/business/services', icon: LayoutDashboard, exact: true },
  { label: 'Profile', href: '/business/services/profile', icon: Building2 },
]

export function navFor(mode: PortalMode): BusinessNavItem[] {
  return mode === 'services' ? SERVICE_NAV : BUSINESS_NAV
}

export function isBusinessItemActive(
  pathname: string,
  item: Pick<BusinessNavItem, 'href' | 'exact'>,
): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * Switches which listing the portal is showing, staying on the same page.
 * Renders nothing when there is only one listing to show.
 */
export function ListingSwitcher({
  listings,
  currentId,
  className,
}: {
  listings: PortalListingSummary[]
  currentId?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  if (listings.length < 2) return null

  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Showing listing
      </span>
      <select
        value={currentId}
        onChange={(event) =>
          router.push(`${pathname}?listing=${encodeURIComponent(event.target.value)}`)
        }
        className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus-visible:border-plug-blue-500"
      >
        {listings.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {listingState(item.status).label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function BusinessDashboardSidebar({ listing, listings = [], mode = 'chargers', canSwitch = false }: BusinessDashboardSidebarProps) {
  const pathname = usePathname()

  const name = listing?.name ?? 'No listing yet'
  const type = (listing?.type ?? '').replace('-', ' ')
  const city = listing?.city ?? ''
  const state = listingState(listing?.status)

  return (
    <div className="scrollbar-hide sticky top-[64px] flex h-[calc(100vh-64px)] w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
      {canSwitch ? <PortalSwitch mode={mode} className="mb-4" /> : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="truncate font-bold text-slate-900">{name}</p>
        <p className="mt-0.5 text-xs capitalize text-slate-400">
          {type} · {city}
        </p>

        {listing ? (
          <span className={cn('mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', state.pill)}>
            <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', state.dot)} />
            <span className="text-[10px] font-semibold">{state.label}</span>
          </span>
        ) : null}

        <ListingSwitcher listings={listings} currentId={listing?.id} className="mt-4" />
      </div>

      {/* The quick-stats block is gone.
          It printed 1,240 views, 89 clicks and a 4.8 rating from mock data —
          this application records no page views, no navigate clicks and no
          reviews for a business, so those were four invented numbers sitting
          above the owner's real listing. They can return when something
          measures them. */}

      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {mode === 'services' ? 'Service portal' : 'Business Portal'}
        </p>

        {navFor(mode).map((item) => {
          const active = isBusinessItemActive(pathname, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={listingHref(item.href, listing?.id, listings.length)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-[42px] items-center gap-3 rounded-xl transition-all duration-150',
                active
                  ? 'border-l-[3px] border-plug-blue-600 bg-plug-blue-50 pl-[9px] pr-3'
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

      <Link
        href={mode === 'services' ? '/services/list' : '/business/signup'}
        className="mt-4 flex h-[42px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Plus size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        {mode === 'services' ? 'List another service' : 'List another location'}
      </Link>

      {/* The "Go Premium — get priority listing and analytics" card is gone.
          Its button pointed at /business/upgrade, which does not exist, and the
          pricing page it referenced was removed when plans were replaced with
          meeting requests. It offered analytics that every owner now gets, in
          exchange for a payment there was no way to make. */}
    </div>
  )
}
