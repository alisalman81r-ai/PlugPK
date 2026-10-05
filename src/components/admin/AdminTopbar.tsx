// src/components/admin/AdminTopbar.tsx
'use client'

import { Bell, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, Search, User } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Global chrome for the portal: where you are, and who you are.
 *
 * ── Three controls, and what each one is actually allowed to do ───────
 *
 * SEARCH hands the words to a list. Every admin list now searches the
 * database through its own ?q= parameter, so this asks which list and sends
 * the query there — Members, Stations, Businesses and the rest each search
 * the columns that make sense for them. There is still no single index across
 * every table, and the panel does not pretend there is: it says which section
 * it will search.
 *
 * NOTIFICATIONS has no backend either, and the temptation here is a red "3".
 * There is no notification table, nothing writes one, and a hardcoded count is
 * a lie that never resolves — the badge would still read 3 after everything was
 * dealt with. So the bell carries no count and its panel says nothing is wired,
 * pointing at the alerts panel on the dashboard, which is real and derived from
 * station and connector rows.
 *
 * PROFILE is real. The account comes from /api/me, the same endpoint the public
 * navbar uses, and sign-out posts to the existing /api/admin/signout. There is
 * no admin profile or settings route in this application, so neither is in the
 * menu.
 */

/** The account, as /api/me reports it. */
type AdminUser = { name: string; email: string; avatar?: string | null }

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
]

/** The section you are in is the one you most likely mean to search. */
function defaultSection(pathname: string): string {
  return DESTINATIONS.find((item) => pathname.startsWith(item.href))?.href ?? '/admin/members'
}

/**
 * The page name, from the URL.
 *
 * Derived rather than passed down, so a new admin route gets a correct title
 * without anyone remembering to register it here.
 */
function useCrumbs() {
  const pathname = usePathname()
  return React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean).slice(1)
    if (parts.length === 0) return [{ label: 'Dashboard', href: '/admin' }]

    return parts.map((part, index) => ({
      // Ids and slugs read better with their hyphens opened out.
      label: part.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      href: `/admin/${parts.slice(0, index + 1).join('/')}`,
    }))
  }, [pathname])
}

/** Closes a popover on outside pointer and on Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return ref
}

const POPOVER =
  'absolute right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_-12px_rgba(5,36,30,0.22)]'

export interface AdminTopbarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AdminTopbar({ collapsed, onToggleCollapse }: AdminTopbarProps) {
  const crumbs = useCrumbs()
  const router = useRouter()
  const pathname = usePathname()

  const [openPanel, setOpenPanel] = React.useState<'search' | 'bell' | 'profile' | null>(null)
  const close = React.useCallback(() => setOpenPanel(null), [])
  const shell = useDismiss(openPanel !== null, close)

  const [query, setQuery] = React.useState('')
  const [section, setSection] = React.useState('/admin/members')

  // Opening the panel picks the section you are standing in.
  React.useEffect(() => {
    if (openPanel === 'search') setSection(defaultSection(pathname))
  }, [openPanel, pathname])

  const search = (event: React.FormEvent) => {
    event.preventDefault()
    const words = query.trim().slice(0, 100)
    router.push(words ? `${section}?q=${encodeURIComponent(words)}` : section)
    setQuery('')
    close()
  }
  const [user, setUser] = React.useState<AdminUser | null>(null)

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  return (
    <div
      ref={shell}
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6"
    >
      {/* Collapse lives here rather than in the sidebar so it keeps its place
          when the sidebar is only icons wide. Hidden below lg, where the
          sidebar is a drawer and has nothing to collapse. */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 lg:block"
      >
        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </button>

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 truncate">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={crumb.href} className="flex shrink-0 items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-slate-300">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" className="text-ui-sm font-semibold text-slate-900">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-ui-sm text-slate-500 transition-colors hover:text-plug-blue-600"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'search' ? null : 'search')}
          aria-expanded={openPanel === 'search'}
          aria-haspopup="dialog"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 sm:w-56 sm:justify-start"
        >
          <Search size={15} aria-hidden="true" />
          <span className="hidden text-ui-sm sm:inline">Search…</span>
        </button>

        {openPanel === 'search' ? (
          <form
            onSubmit={search}
            role="search"
            aria-label="Search the portal"
            className={cn(POPOVER, 'w-[min(20rem,calc(100vw-2rem))] p-3')}
          >
            <label htmlFor="admin-search-section" className="mb-1 block text-ui-xs font-semibold text-slate-500">
              Search in
            </label>
            <select
              id="admin-search-section"
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="mb-2 h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-ui-sm text-slate-700 outline-none focus:border-plug-blue-400"
            >
              {DESTINATIONS.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, city…"
                aria-label="Search for"
                maxLength={100}
                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 text-ui-sm outline-none focus:border-plug-blue-400"
              />
              <button
                type="submit"
                className="h-9 shrink-0 rounded-lg bg-plug-blue-600 px-3 text-ui-sm font-semibold text-white hover:bg-plug-blue-700"
              >
                Go
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* ── Notifications ──────────────────────────────────────────── */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'bell' ? null : 'bell')}
          aria-expanded={openPanel === 'bell'}
          aria-haspopup="dialog"
          aria-label="Notifications"
          title="Notifications"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <Bell size={17} aria-hidden="true" />
        </button>

        {openPanel === 'bell' ? (
          <div className={cn(POPOVER, 'w-64 p-4')} role="dialog" aria-label="Notifications">
            <p className="text-ui-sm font-semibold text-slate-800">No new notifications</p>
            <p className="mt-1 text-ui-xs leading-relaxed text-slate-500">
              Nothing writes notifications yet. Live faults appear under Active alerts on the
              dashboard.
            </p>
            <Link
              href="/admin"
              onClick={close}
              className="mt-3 inline-block text-ui-xs font-semibold text-plug-blue-600 hover:text-plug-blue-700"
            >
              Open dashboard
            </Link>
          </div>
        ) : null}
      </div>

      {/* ── Profile ────────────────────────────────────────────────── */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'profile' ? null : 'profile')}
          aria-expanded={openPanel === 'profile'}
          aria-haspopup="menu"
          className="flex items-center gap-1.5 rounded-lg p-1 pr-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          {user ? (
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-plug-navy-900 text-ui-xs font-bold text-white"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <User size={20} aria-hidden="true" className="text-slate-600" />
          )}
          <span className="hidden max-w-[8rem] truncate text-ui-sm font-medium text-slate-700 sm:inline">
            {user?.name ?? 'Admin'}
          </span>
          <ChevronDown size={14} aria-hidden="true" className="text-slate-400" />
        </button>

        {openPanel === 'profile' ? (
          <div className={cn(POPOVER, 'w-56')} role="menu">
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="truncate text-ui-sm font-semibold text-slate-900">
                {user?.name ?? 'Admin'}
              </p>
              <p className="truncate text-ui-xs text-slate-500">
                {/* Every operator signs in with their own account now; the
                    address only goes missing while /api/me is loading. */}
                {user?.email ?? ''}
              </p>
            </div>

            <form action="/api/admin/signout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-ui-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-red-600"
              >
                <LogOut size={15} aria-hidden="true" className="text-slate-400" />
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}
