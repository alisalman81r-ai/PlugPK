// src/components/layout/AccountMenu.tsx
'use client'

import { Building2, ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Avatar, TurnIcon } from '@/components/ui'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

/**
 * Who is signed in, in the header.
 *
 * The header used to show "Sign In" to everybody, signed in or not, so the one
 * place a site normally confirms who you are said nothing — and the only way
 * to sign out was to find the dashboard sidebar.
 */

export interface AccountMenuProps {
  user: { name: string; email: string; avatar?: string | null; isAdmin?: boolean }
  /** Sitting on the dark home hero rather than the white bar. */
  onDark?: boolean
}

/**
 * Where "Dashboard" goes depends on who is reading.
 *
 * It was always /dashboard — the driver dashboard: saved stations, saved
 * routes, vehicles, reviews. For a driver that is right and it is the only
 * dashboard they have. For an operator it is the wrong building: they press
 * Dashboard expecting the console they run the network from and land on a page
 * telling them they have saved no stations.
 *
 * So an operator's Dashboard points at /admin, and the driver pages stay
 * reachable from the portal's own "View live site". The label changes with the
 * destination rather than one word meaning two places.
 *
 * This is presentation only. `isAdmin` arrives from /api/me and decides a menu
 * item; it authorises nothing. Every /admin route re-reads the column from the
 * database on its own request, so a tampered value changes a link and gets a
 * redirect at the other end.
 */
function linksFor(isAdmin: boolean) {
  return [
    isAdmin
      ? { href: '/admin', label: 'Admin dashboard', icon: LayoutDashboard }
      : { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/business/dashboard', label: 'My listings', icon: Building2 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]
}

export function AccountMenu({ user, onDark = false }: AccountMenuProps) {
  const LINKS = linksFor(user.isAdmin === true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // A menu that stays open after you click elsewhere reads as stuck, and one
  // that ignores Escape traps keyboard users inside it.
  React.useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      setIsOpen(false)
      window.location.assign('/')
    } finally {
      // Without this the button is stuck on "Signing out…" for good if the
      // action throws. On success the navigation unmounts it first, so this
      // only ever runs on the path that needs it.
      setIsSigningOut(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border pl-1.5 pr-2.5 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
          onDark ? 'border-white/15 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-50',
          isOpen && (onDark ? 'bg-white/10' : 'bg-slate-50'),
        )}
      >
        <Avatar name={user.name} src={user.avatar} size={28} />
        <span className={cn('max-w-[120px] truncate text-sm font-semibold', onDark ? 'text-white' : 'text-slate-700')}>
          {user.name}
        </span>
        <TurnIcon active={isOpen} className="text-slate-400">
          <ChevronDown size={14} aria-hidden="true" />
        </TurnIcon>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar name={user.name} src={user.avatar} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <link.icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut size={16} className="shrink-0 text-red-400" aria-hidden="true" />
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
