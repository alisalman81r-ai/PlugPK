// src/components/business/BusinessDashboardSidebar.tsx
'use client'

import {
  BarChart2,
  Building2,
  LayoutDashboard,
  Plus,
  Star,
  Zap,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

// Three states (under review / live / not approved) and the ?listing= links.
import { listingHref, listingState } from './listing-state'

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

export function BusinessDashboardSidebar({ listing, listings = [] }: BusinessDashboardSidebarProps) {
  const pathname = usePathname()

  const name = listing?.name ?? 'No listing yet'
  const type = (listing?.type ?? '').replace('-', ' ')
  const city = listing?.city ?? ''
  const state = listingState(listing?.status)

  return (
    <div className="scrollbar-hide sticky top-[64px] flex h-[calc(100vh-64px)] w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
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
          Business Portal
        </p>

        {BUSINESS_NAV.map((item) => {
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
        href="/business/signup"
        className="mt-4 flex h-[42px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Plus size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        List another location
      </Link>

      {/* The "Go Premium — get priority listing and analytics" card is gone.
          Its button pointed at /business/upgrade, which does not exist, and the
          pricing page it referenced was removed when plans were replaced with
          meeting requests. It offered analytics that every owner now gets, in
          exchange for a payment there was no way to make. */}
    </div>
  )
}
