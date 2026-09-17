// src/components/admin/AdminTopbar.tsx
'use client'

import { Bell, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, Search, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Global chrome for the portal: where you are, and who you are.
 *
 * ── Three controls, and what each one is actually allowed to do ───────
 *
 * SEARCH has no backend. There is no search index, no API route and no query
 * that spans stations, connectors, members and cars — so this does not pretend
 * to search. It opens a panel that says so and offers the list pages instead,
 * which is the thing a person reaching for search actually wants: a way to get
 * to the records. Typing filters those destinations, not the data.
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

/** The account, as /api/me reports it. Null when signed in by shared password. */
type AdminUser = { name: string; email: string; avatar?: string | null }

/** Where search would take you, once there is something to search. */
const DESTINATIONS = [
  { label: 'Stations', href: '/admin/stations' },
  { label: 'Connectors', href: '/admin/connectors' },
  { label: 'Members', href: '/admin/members' },
  { label: 'Cars', href: '/admin/cars' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Businesses', href: '/admin/businesses' },
]

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
  'absolute right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_-12px_rgba(15,23,42,0.22)]'

export interface AdminTopbarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AdminTopbar({ collapsed, onToggleCollapse }: AdminTopbarProps) {
  const crumbs = useCrumbs()

  const [openPanel, setOpenPanel] = React.useState<'search' | 'bell' | 'profile' | null>(null)
  const close = React.useCallback(() => setOpenPanel(null), [])
  const shell = useDismiss(openPanel !== null, close)

  const [query, setQuery] = React.useState('')
  const [user, setUser] = React.useState<AdminUser | null>(null)

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  const matches = DESTINATIONS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  )

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
          <span className="hidden text-ui-sm sm:inline">Jump to…</span>
        </button>

        {openPanel === 'search' ? (
          <div className={cn(POPOVER, 'w-72 p-2')} role="dialog" aria-label="Jump to a section">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter sections…"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-ui-sm outline-none focus:border-plug-blue-400"
            />

            {/*
              Stated plainly rather than hidden. Somebody typing a station name
              here needs to know why nothing matched — that search is not built,
              not that their station is missing.
            */}
            <p className="px-1 pb-1 pt-2 text-ui-xs leading-snug text-slate-400">
              Record search isn&apos;t connected yet — this jumps to sections.
            </p>

            <ul className="max-h-64 overflow-y-auto">
              {matches.length > 0 ? (
                matches.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block rounded-lg px-2.5 py-1.5 text-ui-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-plug-blue-600"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-2.5 py-2 text-ui-xs text-slate-400">No section matches that.</li>
              )}
            </ul>
          </div>
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
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-plug-navy-900 text-ui-xs font-bold text-white"
          >
            {user ? user.name.slice(0, 1).toUpperCase() : <User size={14} />}
          </span>
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
                {/* Says what is true in both cases. Signing in with the shared
                    password carries no identity at all, and showing a made-up
                    address would be the one place this portal claimed to know
                    who was using it. */}
                {user?.email ?? 'Signed in with the shared password'}
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
