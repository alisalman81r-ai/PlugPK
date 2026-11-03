// src/components/layout/MobileMenu.tsx
'use client'

import { LogOut } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { Avatar } from '@/components/ui/Avatar'
import { gsap, prefersReduced } from '@/lib/gsap'
import { NAV_LINKS, NAV_TOOLS } from '@/lib/constants'
import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  /** The signed-in account, or null. Mirrors the desktop header. */
  user?: { name: string; email: string; avatar?: string | null; isAdmin?: boolean } | null
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The phone's menu: a full-screen ink sheet that opens as a circle growing out
 * of the burger, with the destinations set large in Power Grotesk.
 *
 * Every row is at least 44px tall. There is no "Download App" button: the app
 * is not released.
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

  const sheetRef = React.useRef<HTMLDivElement>(null)

  /* The page holds still under the sheet, and the sheet's rows rise in one
     after another as the circle opens (pages.js: .mnav > * from y 30). */
  React.useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    const lenis = getLenis()
    if (isOpen) lenis?.stop()
    else lenis?.start()
    if (isOpen && !prefersReduced() && sheetRef.current) {
      const rows = sheetRef.current.querySelectorAll('[data-mnav-row]')
      gsap.from(rows, { y: 30, autoAlpha: 0, stagger: 0.04, duration: 0.6, ease: 'expo.out', delay: 0.15 })
    }
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

  /* Destinations in Power Grotesk, large; the tools in Poppins, as in the design. */
  const row = (href: string, label: string, small = false) => {
    const active = isActivePath(pathname, href)
    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        tabIndex={tab}
        data-mnav-row=""
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 transition-colors duration-150',
          small
            ? 'text-xl font-medium leading-[1.6] text-white/75 hover:text-white'
            : 'pg-medium font-display text-[38px] leading-[1.2] text-white hover:text-volt',
          active && 'text-volt',
        )}
      >
        {label}
        {active ? <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-volt" /> : null}
      </Link>
    )
  }

  return (
    <div
      id="mobile-menu"
      aria-hidden={!isOpen}
      className={cn(
        'fixed inset-0 z-[45] flex flex-col bg-ink transition-[clip-path] duration-700 ease-out motion-reduce:transition-none lg:hidden',
        isOpen
          ? '[clip-path:circle(150%_at_calc(100%-50px)_46px)]'
          : 'pointer-events-none [clip-path:circle(0_at_calc(100%-50px)_46px)]',
      )}
    >
      <div ref={sheetRef} data-lenis-prevent="" className="flex h-full flex-col overflow-y-auto px-[clamp(16px,4vw,64px)] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[100px]">
        <nav aria-label="Menu" className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => row(link.href, link.label))}

          <p data-mnav-row="" className="mb-1 mt-5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Tools</p>
          {NAV_TOOLS.map((tool) => row(tool.href, tool.label, true))}
        </nav>

        <div className="flex-1" />

        <div data-mnav-row="" className="mt-8 flex flex-col gap-3">
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
                className="flex h-12 w-full items-center justify-center rounded-full bg-volt text-base font-semibold text-ink transition-colors hover:bg-white"
              >
                {user.isAdmin ? 'Admin dashboard' : 'Dashboard'}
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                tabIndex={tab}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-400/40 text-ui font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
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
                className="flex h-12 w-full items-center justify-center rounded-full bg-volt text-base font-semibold text-ink transition-colors hover:bg-white"
              >
                Sign In
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent(pathname)}`}
                onClick={onClose}
                tabIndex={tab}
                className="flex h-12 w-full items-center justify-center rounded-full border border-white/20 text-base font-semibold text-white transition-colors hover:border-volt hover:text-volt"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
