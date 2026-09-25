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
import { Logo, LogoMark } from '@/components/ui/Logo'

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
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    heading: 'Network',
    items: [
      { label: 'Stations', href: '/admin/stations', icon: Zap },
      { label: 'Connectors', href: '/admin/connectors', icon: Plug },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Members', href: '/admin/members', icon: Users },
      { label: 'Businesses', href: '/admin/businesses', icon: Building2 },
      { label: 'Meetings', href: '/admin/meetings', icon: CalendarClock },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Cars', href: '/admin/cars', icon: Car },
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Community', href: '/admin/community', icon: MessageSquare },
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
  collapsed = false,
}: {
  onNavigate?: () => void
  badges: AdminBadgeCounts
  /**
   * Icon-only mode, desktop sidebar only.
   *
   * The drawer never sets it: a sheet that slides over the page to show eight
   * unlabelled icons would be a worse version of the thing it replaced.
   */
  collapsed?: boolean
}) {
  const pathname = usePathname()

  return (
    <>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-slate-200',
          collapsed ? 'justify-center px-2' : 'gap-2 px-5',
        )}
      >
        {/* Collapsed keeps the mark and drops the words. The bolt alone is
            still the brand; a truncated wordmark is just damage. */}
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          title={collapsed ? 'plug.pk admin' : undefined}
        >
          {collapsed ? (
            <>
              <LogoMark color="#159E89" className="h-5 w-5 shrink-0" />
              <span className="sr-only">plug.pk admin</span>
            </>
          ) : (
            <>
              <Logo tone="light" size="text-base" />
              <span className="rounded-md bg-plug-navy-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Admin
              </span>
            </>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5 last:mb-0">
            {collapsed ? (
              // A hairline keeps the grouping legible without a label that
              // would not fit. The heading stays in the tree for screen
              // readers, which do not care how wide the sidebar is.
              <div className="mb-2 flex justify-center" aria-hidden="true">
                <span className="h-px w-6 bg-slate-200" />
              </div>
            ) : null}
            <p
              className={cn(
                'mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400',
                collapsed && 'sr-only',
              )}
            >
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
                      /* The label as a tooltip when it is the only way to read
                         the row. Native title rather than a custom tooltip: it
                         needs no library, no portal and no timer, and it is the
                         one place a browser default is better than anything
                         built here. */
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'relative flex h-10 items-center rounded-lg text-ui font-medium transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                        active
                          ? 'bg-plug-navy-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>

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
                            'flex shrink-0 items-center justify-center rounded-full',
                            'font-mono text-[11px] font-bold tabular-nums leading-none',
                            /* Collapsed there is no room for digits beside a
                               centred icon, so the badge becomes a dot pinned
                               to the corner. It still says something is
                               waiting, which is the badge's whole job; the
                               count itself is one click away. The screen
                               reader text below is unchanged either way. */
                            collapsed
                              ? 'absolute right-1.5 top-1.5 h-2 w-2'
                              : 'ml-auto h-5 min-w-[1.25rem] px-1.5',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-plug-blue-600 text-white',
                          )}
                        >
                          {collapsed ? null : (
                            <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
                          )}
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
        {/* Collapsed these become icons too. Left as they were, the labels
           wrapped onto three lines inside a 64px column and the footer read
           as broken rather than as narrow. */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'View live site' : undefined}
          className={cn(
            'flex h-9 items-center rounded-lg text-ui-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
          )}
        >
          <ExternalLink size={15} className="shrink-0" aria-hidden="true" />
          <span className={collapsed ? 'sr-only' : undefined}>View live site</span>
        </Link>

        {/* POST, not a link: sign-out changes server state, and a GET that
            mutates would be followed by any prefetcher. */}
        <form action="/api/admin/signout" method="post">
          <button
            type="submit"
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'flex h-9 w-full items-center rounded-lg text-ui-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
            )}
          >
            <LogOut size={15} className="shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : undefined}>Sign out</span>
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
  /** Desktop icon-only mode. Owned by AdminShell so main can widen with it. */
  collapsed?: boolean
}

export function AdminNav({ badges, collapsed = false }: AdminNavProps) {
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
      {/* Desktop: a permanent column, 248px or 64px. */}
      <nav
        aria-label="Admin"
        className={cn(
          'sticky top-0 hidden h-viewport shrink-0 flex-col border-r border-slate-200 bg-white lg:flex',
          /* Width transitions, nothing else. Animating the labels in and out
             would mean text reflowing mid-slide, which reads as a glitch
             rather than as a panel resizing. */
          'transition-[width] duration-200 ease-out motion-reduce:transition-none',
          collapsed ? 'w-[64px]' : 'w-[248px]',
        )}
      >
        <NavContent badges={badges ?? {}} collapsed={collapsed} />
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
          <Logo tone="light" size="text-base" />
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
