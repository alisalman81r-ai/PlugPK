// src/components/layout/MobileMenu.tsx
'use client'

import {
  ChevronRight,
  Handshake,
  LogOut,
  MapPin,
  Route,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { Avatar, Button } from '@/components/ui'
import { NAV_LINKS } from '@/lib/constants'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  /** The signed-in account, or null. Mirrors the desktop header. */
  user?: { name: string; email: string; avatar?: string | null } | null
}

/** NAV_LINKS carries no icon component, so routes are mapped to icons here. */
const NAV_ICONS: Record<string, LucideIcon> = {
  '/map': MapPin,
  '/routes': Route,
  '/services': Wrench,
  '/community': Users,
  '/partners': Handshake,
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileMenu({ isOpen, onClose, user = null }: MobileMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    onClose()
    router.push('/')
    router.refresh()
  }
  const pathname = usePathname()

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/20 transition-opacity duration-300 lg:hidden"
        />
      ) : null}

      <div
        id="mobile-menu"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-white pt-[72px] transition-transform duration-[350ms] ease-decelerate lg:hidden',
          isOpen ? 'translate-y-0' : 'pointer-events-none -translate-y-full',
        )}
      >
        <div className="flex h-full flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8">
          <nav>
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)
              const Icon = NAV_ICONS[link.href] ?? MapPin

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  tabIndex={isOpen ? undefined : -1}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 items-center gap-3 border-b border-slate-100 text-lg font-medium transition-colors duration-150',
                    active ? 'rounded-xl bg-blue-50 px-4 text-plug-blue-600' : 'text-slate-700',
                  )}
                >
                  <Icon
                    size={20}
                    className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                    aria-hidden="true"
                  />
                  {link.label}
                  {active ? null : (
                    <ChevronRight size={16} className="ml-auto shrink-0 text-slate-300" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex-1" />

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Avatar name={user.name} src={user.avatar} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
                    <span className="block truncate text-xs text-slate-500">{user.email}</span>
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  href="/dashboard"
                  onClick={onClose}
                  tabIndex={isOpen ? undefined : -1}
                >
                  Dashboard
                </Button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  tabIndex={isOpen ? undefined : -1}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-ui font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                href="/login"
                onClick={onClose}
                tabIndex={isOpen ? undefined : -1}
              >
                Sign In
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              href="/for-businesses"
              onClick={onClose}
              tabIndex={isOpen ? undefined : -1}
            >
              List Your Business
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Pakistan&apos;s EV Ecosystem Platform
          </p>
        </div>
      </div>
    </>
  )
}
