// src/components/business/BusinessDashboardSidebar.tsx
'use client'

import { Banknote, type IconType } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { AdmIcon, AdmMark, type AdmIconName } from '@/components/admin/admin-icons'
import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

import { useGlide } from './biz-motion'
// Three states (under review / live / not approved) and the ?listing= links.
import { listingHref, listingState } from './listing-state'
import { PORTAL_COOKIE, type PortalMode } from './portal-mode'

export type { PortalMode }

export interface PortalListingSummary {
  id: string
  name: string
  status: string
}

/** The account, as /api/me reports it. */
export type PortalUser = { name: string; email: string }

export interface BusinessDashboardSidebarProps {
  /**
   * The listing the portal is showing, or undefined when the account has
   * none. Every page in the portal reads the database; nothing here is a
   * fixture, and there are no quick-stats — nothing measured them.
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
   * between pages.
   */
  listings?: PortalListingSummary[]
  /** Which side of the portal is showing: charger listings or service listings. */
  mode?: PortalMode
  /** The account lists both, so the Chargers | Services switch is shown. */
  canSwitch?: boolean
  /** Closes the mobile drawer after a link is followed. */
  onNavigate?: () => void
  /** Icon-only desktop mode, owned by the shell. */
  collapsed?: boolean
  /** The signed-in account, for the footer. */
  user?: PortalUser | null
}

export function rememberPortal(mode: PortalMode): void {
  document.cookie = `${PORTAL_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/** The Chargers | Services switch, for an account that lists both. A volt pill slides between the two. */
export function PortalSwitch({ mode, className }: { mode: PortalMode; className?: string }) {
  return (
    <div role="tablist" aria-label="Portal" className={cn('biz-switch', className)} data-on={mode}>
      <span className="biz-switch__pill" aria-hidden="true" />
      {(
        [
          { value: 'chargers', label: 'Chargers', href: '/business/dashboard', icon: 'bolt' },
          { value: 'services', label: 'Services', href: '/business/services', icon: 'wrench' },
        ] as const
      ).map((side) => (
        <Link
          key={side.value}
          href={side.href}
          role="tab"
          aria-selected={side.value === mode}
          onClick={() => rememberPortal(side.value)}
        >
          <AdmIcon name={side.icon} />
          {side.label}
        </Link>
      ))}
    </div>
  )
}

interface BusinessNavItem {
  label: string
  href: string
  icon: AdmIconName | IconType
  exact?: boolean
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { label: 'Overview', href: '/business/dashboard', icon: 'grid', exact: true },
  { label: 'Profile', href: '/business/profile', icon: 'building' },
  { label: 'Chargers', href: '/business/chargers', icon: 'bolt' },
  { label: 'Bookings', href: '/business/bookings', icon: 'calok' },
  { label: 'Payout accounts', href: '/business/payouts', icon: Banknote },
  { label: 'Application', href: '/business/application', icon: 'shield' },
  { label: 'Reviews', href: '/business/reviews', icon: 'star' },
  { label: 'Analytics', href: '/business/analytics', icon: 'trend' },
]

/** The services side: where an application stands, and the listing itself. */
export const SERVICE_NAV: BusinessNavItem[] = [
  { label: 'Overview', href: '/business/services', icon: 'grid', exact: true },
  { label: 'Profile', href: '/business/services/profile', icon: 'building' },
]

export function navFor(mode: PortalMode): BusinessNavItem[] {
  return mode === 'services' ? SERVICE_NAV : BUSINESS_NAV
}

export function isBusinessItemActive(pathname: string, item: Pick<BusinessNavItem, 'href' | 'exact'>): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function NavIcon({ icon }: { icon: AdmIconName | IconType }) {
  if (typeof icon === 'string') return <AdmIcon name={icon} />
  const Icon = icon
  return <Icon size={20} aria-hidden="true" />
}

const PILL: Record<string, { pill: string; dot: string }> = {
  pending: { pill: 'pill--warn', dot: 'dot--warn' },
  approved: { pill: 'pill--ok', dot: 'dot--ok' },
  rejected: { pill: 'pill--bad', dot: 'dot--bad' },
}

/** The design's pill for a listing's review state. */
export function ListingStatePill({ status, className }: { status: string | undefined; className?: string }) {
  const tone = PILL[status ?? 'pending'] ?? { pill: 'pill--warn', dot: 'dot--warn' }
  return (
    <span className={cn('pill', tone.pill, className)}>
      <i className={cn('dot', tone.dot)} aria-hidden="true" />
      {listingState(status).label}
    </span>
  )
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
    <div className={cn('mt-3 block', className)}>
      <span aria-hidden="true" className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[.38]">
        Showing listing
      </span>
      <ThemedSelect
        tone="dark"
        aria-label="Showing listing"
        value={currentId ?? ''}
        onChange={(id) => router.push(`${pathname}?listing=${encodeURIComponent(id)}`)}
        className="h-[38px] rounded-[10px] border pl-2.5 pr-2.5 text-[13px]"
        wrapperClassName="w-full"
        options={listings.map((item) => ({ value: item.id, label: `${item.name} · ${listingState(item.status).label}` }))}
      />
    </div>
  )
}

/**
 * The portal's ink sidebar — the admin design's `.side`, with the owner's
 * listing card, the Chargers | Services switch, and one volt indicator that
 * glides to the page you are on.
 */
export function BusinessDashboardSidebar({
  listing,
  listings = [],
  mode = 'chargers',
  canSwitch = false,
  onNavigate,
  collapsed = false,
  user = null,
}: BusinessDashboardSidebarProps) {
  const pathname = usePathname()
  const navRef = React.useRef<HTMLElement>(null)
  const indRef = React.useRef<HTMLSpanElement>(null)
  const nav = navFor(mode)
  useGlide(navRef, indRef, '.side__link[aria-current="page"]', 'y', [pathname, mode, collapsed])

  const name = user?.name ?? 'Owner'
  const add = mode === 'services' ? 'List another service' : 'List another location'

  return (
    <>
      <Link
        className="side__brand"
        href={nav[0]?.href ?? '/business'}
        aria-label="plugpk business portal home"
        title={collapsed ? 'plugpk business' : undefined}
        onClick={onNavigate}
      >
        <AdmMark />
        <span className="side__word">
          plug<b>pk</b>
        </span>
        <span className="side__chip">BUSINESS</span>
      </Link>

      <div className="biz-side__block">
        {canSwitch ? <PortalSwitch mode={mode} /> : null}
        <div className="biz-card">
          <p className="biz-card__name">{listing?.name ?? 'No listing yet'}</p>
          {listing ? (
            <>
              <p className="biz-card__sub">
                {[listing.type.replace('-', ' '), listing.city].filter(Boolean).join(' · ')}
              </p>
              <ListingStatePill status={listing.status} />
            </>
          ) : null}
          <ListingSwitcher listings={listings} currentId={listing?.id} />
        </div>
      </div>

      <nav ref={navRef} className="side__nav" aria-label="Business portal" data-lenis-prevent>
        <span ref={indRef} className="biz-ind" aria-hidden="true" />
        <p className="side__group">{mode === 'services' ? 'Service portal' : 'Business portal'}</p>
        {nav.map((item) => {
          const active = isBusinessItemActive(pathname, item)
          return (
            <Link
              key={item.href}
              className="side__link"
              href={listingHref(item.href, listing?.id, listings.length)}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
            >
              <NavIcon icon={item.icon} />
              <span className="side__label">{item.label}</span>
            </Link>
          )
        })}
        <p className="side__group">Grow</p>
        <Link
          className="side__link side__link--add"
          href={mode === 'services' ? '/services/list' : '/business/signup'}
          title={collapsed ? add : undefined}
          onClick={onNavigate}
        >
          <AdmIcon name="plus" />
          <span className="side__label">{add}</span>
        </Link>
      </nav>

      <div className="side__foot">
        <div className="side__me">
          <span className="av" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <b>{name}</b>
            <span>{user?.email ?? ''}</span>
          </div>
        </div>
        <Link className="side__link" href="/dashboard" title={collapsed ? 'Driver dashboard' : undefined} onClick={onNavigate}>
          <AdmIcon name="user" />
          <span className="side__label">Driver dashboard</span>
        </Link>
        <button
          type="button"
          className="side__link"
          title={collapsed ? 'Sign out' : undefined}
          onClick={async () => {
            await signOut().catch(() => null)
            window.location.assign('/')
          }}
        >
          <AdmIcon name="out" />
          <span className="side__label">Sign out</span>
        </button>
      </div>
    </>
  )
}
