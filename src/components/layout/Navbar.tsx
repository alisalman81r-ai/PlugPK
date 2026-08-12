// src/components/layout/Navbar.tsx
'use client'

import { Menu, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { MobileMenu } from './MobileMenu'

/** True for the link's own route and anything nested beneath it. */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
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
        <nav className="container-plug flex h-full items-center justify-between">
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

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative rounded-lg px-4 py-2 text-ui font-medium transition-all duration-150',
                    active ? 'text-plug-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  {link.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 left-4 right-4 h-0.5 rounded-full bg-plug-blue-600"
                    />
                  ) : null}
                </Link>
              )
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="sm" href="/login">
              Sign In
            </Button>
            <Button variant="primary" size="sm" href="/for-businesses">
              List Your Business
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 lg:hidden"
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

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}
