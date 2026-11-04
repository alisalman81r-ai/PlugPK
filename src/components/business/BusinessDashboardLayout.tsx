// src/components/business/BusinessDashboardLayout.tsx
'use client'

import '@/components/admin/admin.css'
import './business.css'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { AdminBackButton } from '@/components/admin/AdminBackButton'
import { AdmIcon } from '@/components/admin/admin-icons'
import { cn } from '@/lib/utils'

import { usePageEntrance } from './biz-motion'
import {
  BusinessDashboardSidebar,
  navFor,
  rememberPortal,
  type PortalListingSummary,
  type PortalMode,
  type PortalUser,
} from './BusinessDashboardSidebar'

export interface BusinessDashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  /**
   * The signed-in owner's listing. Absent when the account has none, which is
   * why every field is read through it rather than from a fixture.
   */
  listing?: { id: string; name: string; type: string; city: string; status: string }
  /** Every listing on the account, for the switcher. */
  listings?: PortalListingSummary[]
  /** Charger listings or service listings; chargers unless a services page says so. */
  mode?: PortalMode
  /** The account lists both, so the Chargers | Services switch is shown. */
  canSwitch?: boolean
  /** The public page of the listing shown, when it is live. */
  publicHref?: string
}

const STORAGE_KEY = 'plugpk.business.sidebar.collapsed'

/**
 * The business portal's chrome, in the admin portal's design: the ink sidebar
 * (`.side`), the chalk workspace with its sticky glass top bar (`.top`), and
 * the page head (`.phead`). admin.css supplies the design and is scoped to
 * `.adm`; business.css adds the owner's pieces under `.biz`.
 *
 * Pages render their content as children. It lands in `.biz-body`, a grid
 * with the design's 18px gap, and every direct child rises in on a stagger
 * when the page opens. The design's classes — card, chead, kpi, pill, btn,
 * seg, chips, t (tables), empty, note — are available to every page.
 *
 * Below 980px the sidebar is a drawer, opened from the top bar.
 */
export function BusinessDashboardLayout({
  children,
  title,
  subtitle,
  action,
  listing,
  listings = [],
  mode = 'chargers',
  canSwitch = false,
  publicHref,
}: BusinessDashboardLayoutProps) {
  const pathname = usePathname()
  const nav = navFor(mode)
  const pageRef = React.useRef<HTMLElement>(null)
  const sideRef = React.useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const [drawer, setDrawer] = React.useState(false)
  const [user, setUser] = React.useState<PortalUser | null>(null)

  usePageEntrance(pageRef, `${pathname}|${listing?.id ?? ''}`)

  // The side last opened is where /business reopens.
  React.useEffect(() => {
    if (canSwitch) rememberPortal(mode)
  }, [canSwitch, mode])

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // No stored preference is the same as not having one.
    }
    const query = window.matchMedia('(max-width: 980px)')
    const update = () => setDrawer(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ? { name: data.user.name, email: data.user.email } : null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  // A route change closes the drawer.
  React.useEffect(() => setNavOpen(false), [pathname])

  // A closed drawer is off screen: out of the tab order and the a11y tree too.
  React.useEffect(() => {
    const side = sideRef.current
    if (!side) return
    if (drawer && !navOpen) side.setAttribute('inert', '')
    else side.removeAttribute('inert')
  }, [drawer, navOpen])

  // While the drawer is open: Escape closes it and the page stops scrolling.
  React.useEffect(() => {
    if (!navOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [navOpen])

  const toggleCollapse = () =>
    setCollapsed((value) => {
      const next = !value
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Still collapses; just not remembered.
      }
      return next
    })

  // Only an approved listing has a public page to open; a pending one would 404.
  const viewHref =
    publicHref ?? (mode === 'chargers' && listing && listing.status === 'approved' ? `/station/${listing.id}` : undefined)
  const iconOnly = collapsed && !drawer
  const home = nav[0]?.href ?? '/business'

  return (
    <div className={cn('adm biz', navOpen && 'nav-open', collapsed && 'is-collapsed')}>
      <aside ref={sideRef} className="side" aria-label="Business navigation" id="business-nav">
        <BusinessDashboardSidebar
          listing={listing}
          listings={listings}
          mode={mode}
          canSwitch={canSwitch}
          collapsed={iconOnly}
          onNavigate={() => setNavOpen(false)}
          user={user}
        />
      </aside>
      <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="main">
        <header className="top">
          <button
            className="top__menu"
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="business-nav"
          >
            <AdmIcon name="menu" />
          </button>
          <button
            className="ibtn top__collapse"
            type="button"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <AdmIcon name="sidebar" />
          </button>

          <nav className="crumb" aria-label="Breadcrumb">
            <span className="biz-crumb__tag">{mode === 'services' ? 'SERVICES' : 'BUSINESS'}</span>
            {listing ? (
              <span className="biz-crumb__root">
                <Link href={home}>{listing.name}</Link>
              </span>
            ) : null}
            {listing ? (
              <span className="biz-crumb__root" aria-hidden="true">
                /
              </span>
            ) : null}
            <b aria-current="page">{title}</b>
          </nav>

          <div className="top__acts">
            {viewHref ? (
              <Link href={viewHref} className="btn btn--line btn--sm top__view" aria-label="View your public listing">
                <AdmIcon name="ext" />
                <span>View listing</span>
              </Link>
            ) : null}
          </div>
        </header>

        <main ref={pageRef} className="page" id="business-main">
          <div className="phead">
            <div className="phead__row">
              <AdminBackButton fallbackHref={pathname === home ? '/dashboard' : home} />
              <div className="min-w-0">
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
            </div>
            {action ? <div className="phead__actions">{action}</div> : null}
          </div>
          <div className="biz-body">{children}</div>
        </main>
      </div>
    </div>
  )
}
