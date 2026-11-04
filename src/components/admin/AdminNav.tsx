// src/components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import type { AdminBadgeCounts } from '@/lib/db/admin-badges'
import { cn } from '@/lib/utils'

import { AdmIcon, AdmMark, type AdmIconName } from './admin-icons'
import type { AdminUser } from './AdminTopbar'

interface NavItem {
  label: string
  href: string
  icon: AdmIconName
}

/**
 * Grouped by what an operator is doing, not by data model: the design's
 * sidebar (admin.js, NAV). Only routes that exist appear here.
 */
const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'grid' },
      { label: 'Activity', href: '/admin/activity', icon: 'pulse' },
    ],
  },
  {
    heading: 'Network',
    items: [
      { label: 'Stations', href: '/admin/stations', icon: 'bolt' },
      { label: 'Connectors', href: '/admin/connectors', icon: 'plug' },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Members', href: '/admin/members', icon: 'users' },
      { label: 'Businesses', href: '/admin/businesses', icon: 'building' },
      { label: 'Meetings', href: '/admin/meetings', icon: 'cal' },
      { label: 'Bookings', href: '/admin/bookings', icon: 'calok' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Cars', href: '/admin/cars', icon: 'car' },
      { label: 'Services', href: '/admin/services', icon: 'wrench' },
      { label: 'Community', href: '/admin/community', icon: 'chat' },
      { label: 'Reviews', href: '/admin/reviews', icon: 'star' },
    ],
  },
  {
    heading: 'Mobile app',
    items: [
      { label: 'App activity', href: '/admin/app', icon: 'phone' },
      { label: 'App updates', href: '/admin/app/releases', icon: 'refresh' },
    ],
  },
]

/**
 * Which entry is the current page. `/admin`, `/admin/cars` and `/admin/app`
 * match exactly (they have children), except that a child with no entry of
 * its own — a car's detail page — still lights its parent.
 */
const EXACT_ONLY = new Set(['/admin', '/admin/cars', '/admin/app'])
const CHILD_ROUTES = new Set<string>(['/admin/app/releases'])

function isActive(pathname: string, href: string): boolean {
  if (EXACT_ONLY.has(href)) {
    if (pathname === href) return true
    if (href === '/admin') return false
    return pathname.startsWith(`${href}/`) && !CHILD_ROUTES.has(pathname)
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Below the design's 980px breakpoint the sidebar is a drawer. */
function useIsDrawer() {
  const [drawer, setDrawer] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 980px)')
    const update = () => setDrawer(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return drawer
}

export interface AdminNavProps {
  /** Outstanding work per href, from getAdminBadgeCounts(). Absent keys mean nothing is waiting. */
  badges?: AdminBadgeCounts
  /** Hrefs whose count failed, from getAdminQueueState(). */
  failedBadges?: string[]
  /** Desktop icon-only mode. Owned by AdminShell so the main column widens with it. */
  collapsed?: boolean
  /** The mobile drawer is open (`.adm.nav-open`). */
  open?: boolean
  onClose?: () => void
  /** The signed-in account, for the footer. */
  user?: AdminUser | null
}

export function AdminNav({ badges, failedBadges = [], collapsed = false, open = false, onClose, user }: AdminNavProps) {
  const pathname = usePathname()
  const drawer = useIsDrawer()
  const asideRef = React.useRef<HTMLElement>(null)
  // Icon-only is a desktop mode: the drawer always shows its labels.
  const iconOnly = collapsed && !drawer

  // A closed drawer is off screen: take it out of the tab order and the
  // accessibility tree too, or keyboard users tab through invisible links.
  React.useEffect(() => {
    const aside = asideRef.current
    if (!aside) return
    if (drawer && !open) aside.setAttribute('inert', '')
    else aside.removeAttribute('inert')
  }, [drawer, open])

  const name = user?.name ?? 'Admin'

  return (
    <>
      <aside ref={asideRef} className="side" aria-label="Admin navigation" id="admin-nav">
        <Link
          className="side__brand"
          href="/admin"
          aria-label="plugpk admin home"
          title={iconOnly ? 'plugpk admin' : undefined}
          onClick={onClose}
        >
          <AdmMark />
          <span className="side__word">
            plug<b>pk</b>
          </span>
          <span className="side__chip">ADMIN</span>
        </Link>

        <nav className="side__nav" aria-label="Admin" data-lenis-prevent>
          {SECTIONS.map((section) => (
            <React.Fragment key={section.heading}>
              <p className="side__group">{section.heading}</p>
              {section.items.map((item) => {
                const active = isActive(pathname, item.href)
                const count = badges?.[item.href] ?? 0
                const unavailable = failedBadges.includes(item.href)
                return (
                  <Link
                    key={item.href}
                    className="side__link"
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    title={iconOnly ? item.label : undefined}
                  >
                    <AdmIcon name={item.icon} />
                    <span className="side__label">{item.label}</span>
                    {unavailable ? (
                      <span className="side__badge side__badge--warn" title="This count could not be read">
                        <span aria-hidden="true">?</span>
                        <span className="sr">count unavailable</span>
                      </span>
                    ) : count ? (
                      <span className="side__badge side__badge--hot">
                        <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
                        <span className="sr">{count === 1 ? '1 item awaiting review' : `${count} items awaiting review`}</span>
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </React.Fragment>
          ))}
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
          <Link
            className="side__link"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={iconOnly ? 'View live site' : undefined}
          >
            <AdmIcon name="ext" />
            <span className="side__label">View live site</span>
          </Link>
          {/* POST, not a link: sign-out changes server state, and a GET that
              mutates would be followed by any prefetcher. */}
          <form action="/api/admin/signout" method="post">
            <button type="submit" className="side__link" title={iconOnly ? 'Sign out' : undefined}>
              <AdmIcon name="out" />
              <span className="side__label">Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <div className={cn('scrim')} onClick={onClose} aria-hidden="true" />
    </>
  )
}
