// src/components/layout/MobileMenu.tsx
'use client'

import {
  BatteryCharging,
  Car,
  ChevronRight,
  Gauge,
  Handshake,
  LogOut,
  MapPin,
  Route,
  Users,
  Wrench,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Avatar } from '@/components/ui/Avatar'
import { NAV_LINKS, NAV_TOOLS } from '@/lib/constants'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  /** The signed-in account, or null. Mirrors the desktop header. */
  user?: { name: string; email: string; avatar?: string | null; isAdmin?: boolean } | null
}

/** NAV_LINKS carries no icon component, so routes are mapped to icons here. */
const NAV_ICONS: Record<string, IconType> = {
  '/map': MapPin,
  '/routes': Route,
  '/cars': Car,
  '/charging-calculator': BatteryCharging,
  '/range-converter': Gauge,
  '/services': Wrench,
  '/community': Users,
  '/partners': Handshake,
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The phone's menu sheet.
 *
 * It was white, under a pine header — and the header turned white to match
 * while it was open, so opening the menu changed the colour of the whole top
 * of the screen. The sheet is the header's pine now, so it reads as the bar
 * unfolding rather than a different surface sliding in.
 *
 * Every row is at least 44px tall. There is no "Download App" button: the app
 * is not released, and the row pointed at a banner saying so.
 */
export function MobileMenu({ isOpen, onClose, user = null }: MobileMenuProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      onClose()
      window.location.assign('/')
    } finally {
      setIsSigningOut(false)
    }
  }

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const tab = isOpen ? undefined : -1

  const row = (href: string, label: string) => {
    const active = isActivePath(pathname, href)
    const Icon = NAV_ICONS[href] ?? MapPin
    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        tabIndex={tab}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-12 items-center gap-3 rounded-xl px-3 text-lg font-medium transition-colors duration-150',
          active ? 'bg-white/10 text-white' : 'text-white/85 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <Icon
          size={20}
          className={cn('shrink-0', active ? 'text-plug-cyan-400' : 'text-white/45')}
          aria-hidden="true"
        />
        {label}
        {active ? null : (
          <ChevronRight size={16} className="ml-auto shrink-0 text-white/30" aria-hidden="true" />
        )}
      </Link>
    )
  }

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden"
        />
      ) : null}

      <div
        id="mobile-menu"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-plug-navy-950 pt-[var(--nav-h)] transition-transform duration-[350ms] ease-decelerate motion-reduce:transition-none lg:hidden',
          isOpen ? 'translate-y-0' : 'pointer-events-none -translate-y-full',
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6">
          <nav aria-label="Menu" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => row(link.href, link.label))}

            <p className="mt-5 px-3 pb-1 text-ui-xs font-bold uppercase tracking-[0.16em] text-white/40">
              Tools
            </p>
            {NAV_TOOLS.map((tool) => row(tool.href, tool.label))}
          </nav>

          <div className="flex-1" />

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
                  <Avatar name={user.name} src={user.avatar} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
                    <span className="block truncate text-xs text-white/55">{user.email}</span>
                  </span>
                </div>

                <Link
                  href={user.isAdmin ? '/admin' : '/dashboard'}
                  onClick={onClose}
                  tabIndex={tab}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-ui font-semibold text-plug-navy-950 transition-colors hover:bg-plug-cyan-50"
                >
                  {user.isAdmin ? 'Admin dashboard' : 'Dashboard'}
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  tabIndex={tab}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 text-ui font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  onClick={onClose}
                  tabIndex={tab}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-ui font-semibold text-plug-navy-950 transition-colors hover:bg-plug-cyan-50"
                >
                  Sign In
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(pathname)}`}
                  onClick={onClose}
                  tabIndex={tab}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-white/20 text-ui font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-white/40">
            Pakistan&apos;s EV Ecosystem Platform
          </p>
        </div>
      </div>
    </>
  )
}
