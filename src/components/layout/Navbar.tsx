// src/components/layout/Navbar.tsx
'use client'

import { Menu, Smartphone, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { AccountMenu } from './AccountMenu'
import { MobileMenu } from './MobileMenu'

/** True for the link's own route and anything nested beneath it. */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export interface NavbarProps {
  /** The signed-in account, or null. Supplied by the layout. */
  user: { name: string; email: string; avatar?: string | null } | null
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    // Run once so a restored scroll position renders the correct state.
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // A route change while the sheet is open would otherwise leave it mounted.
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-[72px] backdrop-blur-[20px] transition-all duration-300 ease-out',
          isScrolled
            ? 'border-b border-slate-200/60 bg-white/95 shadow-nav'
            : 'border-b border-slate-200/80 bg-white/[0.85]',
        )}
      >
        <nav className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
            aria-label="Plug.pk home"
          >
            <Zap size={22} className="shrink-0 fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-slate-900">plug</span>
              <span className="text-plug-blue-600">.pk</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative whitespace-nowrap rounded-lg px-3 py-2 text-ui font-medium transition-all duration-150',
                    active ? 'text-plug-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  {link.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-plug-blue-600"
                    />
                  ) : null}
                </Link>
              )
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {/*
              The app is not released. This goes to the Coming Soon banner on
              the home page, and the chip says so here too, so nobody presses
              it expecting a download to start.
            */}
            <Link
              href="/#app"
              className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Smartphone size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              Download App
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Soon
              </span>
            </Link>

            {user ? (
              <AccountMenu user={user} />
            ) : (
              <>
                {/* Kept beside Sign Up: without it a returning visitor has to
                    go through the sign-up page to find the way back in. */}
                <Button variant="ghost" size="sm" href="/login">
                  Sign In
                </Button>
                <Button variant="primary" size="sm" href="/signup">
                  Sign Up
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 xl:hidden"
          >
            <span
              className={cn(
                'inline-flex transition-transform duration-200',
                isMobileMenuOpen && 'rotate-90',
              )}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </span>
          </button>
        </nav>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </>
  )
}
