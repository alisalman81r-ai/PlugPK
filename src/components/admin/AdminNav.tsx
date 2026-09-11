// src/components/admin/AdminNav.tsx
'use client'

import {
  Building2,
  Car,
  Database,
  GitCompare,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  CalendarClock,
  MessageSquare,
  Plug,
  RefreshCw,
  Menu,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import type { AdminBadgeCounts } from '@/lib/db/admin-badges'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  heading: string
  items: NavItem[]
}

/**
 * Grouped by what an operator is actually doing, not by data model. Network
 * is the physical estate; Content is what the public reads.
 *
 * Only routes that exist appear here. The brief asked for Bookings,
 * Transactions, Revenue, Notifications and Settings — none of those exist in
 * this application, and a nav entry leading to an empty screen is worse than
 * no entry at all. Members was on that list too and now has a page behind it,
 * so it has one here.
 */
const SECTIONS: NavSection[] = [
  {
    heading: 'Network',
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Stations', href: '/admin/stations', icon: Zap },
      { label: 'Connectors', href: '/admin/connectors', icon: Plug },
    ],
  },
  {
    heading: 'People',
    items: [{ label: 'Members', href: '/admin/members', icon: Users }],
  },
  {
    heading: 'Catalogue',
    // Its own group rather than an eighth entry under Content. Everything under
    // Content is database-backed and editable here; cars are an authored module
    // and read-only, and grouping them together would imply an Edit button that
    // does not exist. See the cars page for why.
    items: [{ label: 'Cars', href: '/admin/cars', icon: Car }],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Community', href: '/admin/community', icon: MessageSquare },
      { label: 'Businesses', href: '/admin/businesses', icon: Building2 },
      { label: 'Meetings', href: '/admin/meetings', icon: CalendarClock },
    ],
  },
]

/**
 * Which nav entry is the current page.
 *
 * Two entries need exact matching rather than a prefix test, and both for the
 * same reason: they have children with their own entries. `/admin` would
 * otherwise match every admin route, and `/admin/cars` lit up alongside Review
 * and Sources — three highlighted rows telling the operator nothing about where
 * they were.
 *
 * A car detail page (/admin/cars/byd-seal) still highlights Cars, because it has
 * no entry of its own and Cars is where it belongs.
 */
const EXACT_ONLY = new Set(['/admin', '/admin/cars'])

function isActive(pathname: string, href: string): boolean {
  if (EXACT_ONLY.has(href)) {
    if (pathname === href) return true
    // A child with its own nav entry must not also light its parent.
    if (href === '/admin') return false
    return pathname.startsWith(`${href}/`) && !CHILD_ROUTES.has(pathname)
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Routes under /admin/cars that have their own entry.
 *
 * Empty since the crawler was removed: Review, Sources and Updates were its
 * three screens and went with it. Kept rather than deleted because /admin/cars
 * still has a child route — /admin/cars/[slug] — and this set is what stops the
 * parent entry highlighting for a child that owns its own nav item. The moment
 * one is added back, this is where it goes.
 */
const CHILD_ROUTES = new Set<string>([])

function NavContent({
  onNavigate,
  badges,
}: {
  onNavigate?: () => void
  badges: AdminBadgeCounts
}) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2">
          <Zap size={18} className="fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">plug.pk</span>
          <span className="rounded-md bg-plug-navy-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {section.heading}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                const count = badges[item.href] ?? 0

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex h-10 items-center gap-3 rounded-lg px-3 text-ui font-medium transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                        active
                          ? 'bg-plug-navy-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      {item.label}

                      {/*
                        The count of what is waiting on that page.

                        `ml-auto` rather than a fixed position, so it sits hard
                        against the right edge whatever the label's length, and
                        the row keeps one layout whether or not a badge is
                        present.

                        The number is repeated for screen readers as words,
                        because "3" announced after "Businesses" is ambiguous —
                        it could be a position in the list. The digits
                        themselves are hidden from the accessibility tree so it
                        is not read twice.

                        Capped at 99+, since the badge is a prompt to open the
                        page rather than a figure to work from, and a four-digit
                        number would push the label out of the row.
                      */}
                      {count ? (
                        <span
                          className={cn(
                            'ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5',
                            'font-mono text-[11px] font-bold tabular-nums leading-none',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-plug-blue-600 text-white',
                          )}
                        >
                          <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
                          <span className="sr-only">
                            {count === 1 ? '1 item awaiting review' : `${count} items awaiting review`}
                          </span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-ui-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <ExternalLink size={15} className="shrink-0" aria-hidden="true" />
          View live site
        </Link>

        {/* POST, not a link: sign-out changes server state, and a GET that
            mutates would be followed by any prefetcher. */}
        <form action="/api/admin/signout" method="post">
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-ui-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut size={15} className="shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}

export interface AdminNavProps {
  /**
   * Outstanding work per href, from getAdminBadgeCounts(). Absent keys mean
   * nothing is waiting; the layout omits zeroes rather than sending them.
   */
  badges?: AdminBadgeCounts
}

export function AdminNav({ badges }: AdminNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const totalWaiting = React.useMemo(
    () => Object.values(badges ?? {}).reduce((sum, value) => sum + value, 0),
    [badges],
  )
  const pathname = usePathname()

  // A route change should close the drawer, otherwise it stays over the page
  // the operator just navigated to.
  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Escape closes it, and the body stops scrolling behind the overlay.
  React.useEffect(() => {
    if (!isOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Desktop: a permanent column. */}
      <nav
        aria-label="Admin"
        className="sticky top-0 hidden h-viewport w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex"
      >
        <NavContent badges={badges ?? {}} />
      </nav>

      {/* Mobile: a bar with the trigger. The old fixed 248px column consumed
          three quarters of a 320px screen. */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        {/*
          The trigger carries the total.

          Every badge below lives inside the drawer, which is closed by default
          on a phone — so without this the one place the operator can see there
          is work is the one place they have to already know to look. The dot
          shows the same figure the rows add up to.
        */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={
            totalWaiting > 0
              ? `Open admin navigation, ${totalWaiting} awaiting review`
              : 'Open admin navigation'
          }
          aria-expanded={isOpen}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <Menu size={20} />
          {totalWaiting > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-plug-blue-600 px-1 font-mono text-[10px] font-bold leading-none text-white ring-2 ring-white"
            >
              {totalWaiting > 99 ? '99+' : totalWaiting}
            </span>
          ) : null}
        </button>

        <Link href="/admin" className="flex items-center gap-2">
          <Zap size={16} className="fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">plug.pk</span>
          <span className="rounded-md bg-plug-navy-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </Link>
      </div>

      {/* Overlay + drawer. Rendered always so the slide has something to
          animate from, and made inert when closed. */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <nav
        aria-label="Admin"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col bg-white shadow-e4 transition-transform duration-250 ease-out lg:hidden',
          'motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close admin navigation"
          tabIndex={isOpen ? undefined : -1}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <X size={18} />
        </button>

        <NavContent onNavigate={() => setIsOpen(false)} badges={badges ?? {}} />
      </nav>
    </>
  )
}
