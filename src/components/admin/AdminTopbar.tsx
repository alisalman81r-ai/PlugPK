// src/components/admin/AdminTopbar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'

/**
 * The design's `.top`: where you are, search, notifications and who you are.
 *
 * SEARCH hands the words to a list. Every admin list searches the database
 * through its own ?q=, so the box sends the query to the section you are
 * standing in, and the "Search in" menu under it lets you pick another. Ctrl K
 * (Cmd K) focuses it, as in the design.
 *
 * NOTIFICATIONS has no backend, so the bell carries no count and its panel says
 * so, pointing at the dashboard's alerts, which are real.
 *
 * PROFILE is real: the account comes from /api/me (read by AdminShell) and
 * sign-out posts to /api/admin/signout.
 */

/** The account, as /api/me reports it. */
export type AdminUser = { name: string; email: string; avatar?: string | null }

/** The lists that accept ?q=, in the order an operator most often wants them. */
const DESTINATIONS = [
  { label: 'Members', href: '/admin/members' },
  { label: 'Stations', href: '/admin/stations' },
  { label: 'Businesses', href: '/admin/businesses' },
  { label: 'Connectors', href: '/admin/connectors' },
  { label: 'Cars', href: '/admin/cars' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Meetings', href: '/admin/meetings' },
  { label: 'Community', href: '/admin/community' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Activity', href: '/admin/activity' },
]

function defaultSection(pathname: string): string {
  return DESTINATIONS.find((item) => pathname.startsWith(item.href))?.href ?? '/admin/members'
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEGMENT_LABEL: Record<string, string> = { settings: 'Account settings', new: 'New' }

/**
 * "Admin / Stations / Details", from the URL, so a new route gets a correct
 * trail without being registered. The mobile app's two pages sit under
 * "Mobile app", as in the design.
 */
function useCrumbs() {
  const pathname = usePathname()
  return React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean).slice(1)
    if (parts[0] === 'app') {
      const root = { label: 'Mobile app', href: '/admin/app' }
      return parts[1] === 'releases'
        ? [root, { label: 'App updates', href: '/admin/app/releases' }]
        : [root, { label: 'App activity', href: '/admin/app' }]
    }
    const root = { label: 'Admin', href: '/admin' }
    if (parts.length === 0) return [root, { label: 'Dashboard', href: '/admin' }]
    return [
      root,
      ...parts.map((part, index) => ({
        label:
          SEGMENT_LABEL[part] ??
          (UUID.test(part) ? 'Details' : part.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())),
        href: `/admin/${parts.slice(0, index + 1).join('/')}`,
      })),
    ]
  }, [pathname])
}

type Panel = 'scope' | 'bell' | 'profile' | null

export interface AdminTopbarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  /** Opens the mobile drawer. */
  onOpenMenu?: () => void
  menuOpen?: boolean
  /** Everything waiting across the queues, carried on the mobile menu button. */
  waiting?: number
  user?: AdminUser | null
}

export function AdminTopbar({
  collapsed,
  onToggleCollapse,
  onOpenMenu,
  menuOpen = false,
  waiting = 0,
  user = null,
}: AdminTopbarProps) {
  const crumbs = useCrumbs()
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = React.useRef<HTMLElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [panel, setPanel] = React.useState<Panel>(null)
  const [searching, setSearching] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [section, setSection] = React.useState('/admin/members')

  React.useEffect(() => setSection(defaultSection(pathname)), [pathname])

  // Outside pointer and Escape close whatever is open.
  React.useEffect(() => {
    if (!panel && !searching) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel(null)
        setSearching(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel(null)
        setSearching(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [panel, searching])

  // Ctrl K / Cmd K focuses the search, as in the design.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearching(true)
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = (event: React.FormEvent) => {
    event.preventDefault()
    const words = query.trim().slice(0, 100)
    router.push(words ? `${section}?q=${encodeURIComponent(words)}` : section)
    setQuery('')
    setPanel(null)
    setSearching(false)
    inputRef.current?.blur()
  }

  const toggle = (next: Exclude<Panel, null>) => setPanel((value) => (value === next ? null : next))
  const name = user?.name ?? 'Admin'
  const initial = name.slice(0, 1).toUpperCase()
  const sectionLabel = DESTINATIONS.find((d) => d.href === section)?.label ?? 'Members'

  return (
    <header ref={rootRef} className={cn('top', searching && 'is-searching')}>
      <button
        className="top__menu"
        type="button"
        onClick={onOpenMenu}
        aria-label={waiting > 0 ? `Open menu, ${waiting} awaiting review` : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="admin-nav"
      >
        <AdmIcon name="menu" />
        {waiting > 0 ? (
          <span className="top__count" aria-hidden="true">
            {waiting > 99 ? '99+' : waiting}
          </span>
        ) : null}
      </button>

      <button
        className="ibtn top__collapse"
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <AdmIcon name="sidebar" />
      </button>

      <nav className="crumb" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <React.Fragment key={`${crumb.href}-${index}`}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {last ? (
                <b aria-current="page">{crumb.label}</b>
              ) : (
                <Link href={crumb.href}>{crumb.label}</Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <form
        className={cn('menu top__find', panel === 'scope' && 'is-open')}
        role="search"
        aria-label="Search the portal"
        onSubmit={search}
      >
        <label className="top__search">
          <AdmIcon name="search" />
          <span className="sr">Search {sectionLabel}</span>
          <input
            ref={inputRef}
            id="gsearch"
            type="search"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setPanel('scope')}
            placeholder="Search stations, members, posts"
            autoComplete="off"
          />
          <kbd>Ctrl K</kbd>
        </label>
        <div className="menu__list top__scope">
          <label htmlFor="admin-search-section" className="top__scope-lab">
            Search in
          </label>
          <select
            id="admin-search-section"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="top__scope-sel"
          >
            {DESTINATIONS.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="top__scope-note">Press Enter to search {sectionLabel.toLowerCase()}.</p>
        </div>
      </form>

      <button
        className="ibtn top__findbtn"
        type="button"
        aria-label="Search the portal"
        aria-expanded={searching}
        onClick={() => {
          setSearching((value) => !value)
          setPanel('scope')
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <AdmIcon name="search" />
      </button>

      {/* ── Notifications ────────────────────────────────────────────── */}
      <div className={cn('menu', panel === 'bell' && 'is-open')}>
        <button
          className="ibtn"
          type="button"
          aria-label="Notifications, none new"
          aria-expanded={panel === 'bell'}
          aria-haspopup="dialog"
          onClick={() => toggle('bell')}
        >
          <AdmIcon name="bell" />
        </button>
        <div className="menu__list top__bell" role="dialog" aria-label="Notifications">
          <b>No new notifications.</b>
          <p>Nothing writes notifications yet. Live faults appear under Active alerts on the dashboard.</p>
          <Link className="link" href="/admin" onClick={() => setPanel(null)}>
            Open dashboard
            <AdmIcon name="arrow" />
          </Link>
        </div>
      </div>

      {/* ── Profile ──────────────────────────────────────────────────── */}
      <div className={cn('menu pmenu', panel === 'profile' && 'is-open')}>
        <button
          className="top__me"
          type="button"
          aria-haspopup="true"
          aria-expanded={panel === 'profile'}
          onClick={() => toggle('profile')}
        >
          <span className="av" aria-hidden="true">
            {initial}
          </span>
          <span>{name.split(' ')[0]}</span>
          <AdmIcon name="down" />
        </button>
        <div className="menu__list" role="menu">
          <div className="pmenu__me">
            <span className="av" aria-hidden="true">
              {initial}
            </span>
            <div>
              <b>{name}</b>
              <span>{user?.email ?? ''}</span>
            </div>
          </div>
          <nav>
            <Link href="/admin" role="menuitem" onClick={() => setPanel(null)}>
              <AdmIcon name="grid" />
              Admin dashboard
            </Link>
            <Link href="/admin/settings" role="menuitem" onClick={() => setPanel(null)}>
              <AdmIcon name="gear" />
              Settings
            </Link>
          </nav>
          <nav>
            <form action="/api/admin/signout" method="post">
              <button type="submit" className="out" role="menuitem">
                <AdmIcon name="out" />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </div>
    </header>
  )
}
