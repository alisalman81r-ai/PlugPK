// src/components/layout/Navbar.tsx
'use client'

import { Menu, Smartphone, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button, MorphIcon } from '@/components/ui'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { AccountMenu } from './AccountMenu'
import { MobileMenu } from './MobileMenu'
import { Logo } from '@/components/ui/Logo'

/** True for the link's own route and anything nested beneath it. */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** The signed-in account, as /api/me reports it. */
type NavUser = { name: string; email: string; avatar?: string | null; isAdmin?: boolean }

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  /*
    ── The account is fetched, not handed down ─────────────────────────

    The layout used to read the session and pass it in as a prop, which made
    the header right on the first frame and made every page under (main)
    uncacheable to do it — a layout that reads cookies cannot be prerendered,
    and that applies to everything nested beneath it. See the note in
    (main)/layout.tsx for what that cost, measured.

    Asking here instead keeps cookies() out of the render path. null until the
    answer arrives means a signed-in visitor sees "Sign In" for a moment; that
    is the accepted price, and it is confined to this effect.

    Not cached, and aborted on unmount so a fast route change cannot set state
    on a header that has gone.
  */
  const [user, setUser] = React.useState<NavUser | null>(null)

  React.useEffect(() => {
    const abort = new AbortController()

    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      // An aborted fetch is the expected path on unmount, not a failure, and a
      // header that cannot name you is the same signed-out state it starts in.
      .catch(() => {})

    return () => abort.abort()
  }, [])

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

  /*
    The bar is pine, on every page and at every scroll position.

    It used to turn white once the page scrolled. On the home page that meant
    the header flipped colour a few pixels in, while the dark hero was still
    the thing in view, and it read as the bar changing its mind. A fixed dark
    bar is also the steadier frame for pages whose heroes are dark — /map,
    /cars, /partners — and it sits cleanly over the light ones.

    The one exception is the open mobile sheet, which is white; the bar goes
    white with it so the two read as one panel.
  */
  const onDark = !isMobileMenuOpen

  // A route change while the sheet is open would otherwise leave it mounted.
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          /*
            The frost is only worn at rest.

            backdrop-filter on a fixed, full-width bar is the most expensive
            thing on the page while scrolling: the bar re-samples everything
            passing underneath it, every frame, and the blur radius sets the
            cost. Measured on a production build, dropping it from this header
            alone took /cars from 28 dropped frames during a scroll to 1, and
            the landing page from 26 to 13.

            It is kept where it is visible and free. At the top the bar sits on
            bg-white/[0.85] over the hero, the frost reads, and the page is not
            moving so nothing repaints. Once scrolled the background is
            bg-white/95 — at five percent transparency a 20px blur is not
            something the eye can find, and that is exactly when it would be
            repainting every frame.

            So the look survives and the cost does not.
          */
          'fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] transition-all duration-300 ease-out',
          onDark
            ? cn(
                'border-b border-white/[0.08] bg-plug-navy-950',
                // Once content passes under it, a soft shadow separates the
                // bar from a dark band that would otherwise run into it.
                isScrolled && 'shadow-[0_10px_30px_-14px_rgba(0,0,0,0.55)]',
              )
            : isScrolled
              ? 'border-b border-slate-200/60 bg-white/95 shadow-nav'
              : 'border-b border-slate-200/80 bg-white/[0.85] backdrop-blur-[20px]',
        )}
      >
        <nav className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-3 sm:px-4 lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
            aria-label="Plug.pk home"
          >
            {/* The brand logo, in the tone of whatever the bar is over. */}
            <Logo tone={onDark ? 'dark' : 'light'} size="text-2xl" />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)

              return (
                  /*
                 * The same underline the footer links use, wiping in from the
                 * left on hover and sitting drawn for the current page.
                 *
                 * It replaces a grey pill that appeared behind the label on
                 * hover. Two things were wrong with that: the pill was the only
                 * filled hover state in a design whose stated rule is that
                 * prominence comes from the edge rather than the surface, and
                 * the header and the footer — the two things wrapping every
                 * page — were the only pair of navigations on the site that did
                 * not agree on what a link does when you point at it.
                 *
                 * Scale on the compositor rather than a width transition, so
                 * the wipe costs no layout.
                   */
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group/nav relative whitespace-nowrap px-3 py-2 text-ui font-medium transition-colors duration-200',
                    onDark
                      ? active
                        ? 'text-white'
                        : 'text-white/75 hover:text-white'
                      : active
                        ? 'text-plug-blue-600'
                        : 'text-slate-900 hover:text-plug-blue-600',
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute bottom-1 left-3 right-3 h-0.5 origin-left rounded-full',
                      'bg-plug-cyan-500 transition-transform duration-300 ease-out motion-reduce:transition-none',
                      active
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100',
                    )}
                  />
                </Link>
              )
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {user ? <AccountMenu user={user} onDark={onDark} /> : (
              <Button
                variant="ghost"
                size="sm"
                href="/login"
                className={onDark ? 'text-white hover:bg-white/10 hover:text-white' : 'text-slate-900 hover:text-plug-blue-600'}
              >
                Sign In
              </Button>
            )}

              {/*
              The app is not released. This goes to the Coming Soon banner on
              the home page, and carries the chip so nobody presses it
              expecting a download to start — which matters more now that it
              looks like the header's main action.
              */}
            <Link
              href="/#app"
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors duration-200',
                onDark
                  ? 'bg-plug-cyan-500 text-plug-blue-600 hover:bg-plug-cyan-400'
                  : 'bg-plug-navy-900 text-white hover:bg-plug-navy-800',
              )}
            >
              <Smartphone size={15} className="shrink-0" aria-hidden="true" />
              Download App
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  onDark ? 'bg-plug-blue-600/15 text-plug-blue-600' : 'bg-white/15 text-white/80',
                )}
              >
                Soon
              </span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 lg:hidden',
              onDark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
              {/* The bars and the cross now turn through each other rather than
                one being swapped for the other under a CSS rotate — the old
                version rotated the box while the glyph changed instantly
                inside it, so the rotation never actually belonged to either
                  icon. */}
            <MorphIcon active={isMobileMenuOpen} on={X} off={Menu} size={24} />
          </button>
        </nav>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </>
  )
}
