// src/components/layout/Navbar.tsx
'use client'

import { ChevronDown, Menu, UserCircle, X } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { NAV_LINKS, NAV_TOOLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { AccountMenu } from './AccountMenu'
import { MobileMenu } from './MobileMenu'

/** True for the link's own route and anything nested beneath it. */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** The signed-in account, as /api/me reports it. */
type NavUser = { name: string; email: string; avatar?: string | null; isAdmin?: boolean; hasBusiness?: boolean }

/**
 * The link treatment: an underline that wipes in from the left on hover and
 * sits drawn for the current page — the same thing the footer links do, so
 * the two navigations wrapping every page agree on what a link does.
 *
 * Scale on the compositor rather than a width transition, so the wipe costs
 * no layout. min-h-11 keeps every item a 44px target.
 */
const LINK =
  'group/nav relative inline-flex min-h-11 items-center whitespace-nowrap px-2 text-ui font-medium transition-colors duration-200 xl:px-3'

function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute bottom-1.5 left-2 right-2 h-0.5 origin-left rounded-full xl:left-3 xl:right-3',
        'bg-plug-cyan-500 transition-transform duration-300 ease-out motion-reduce:transition-none',
        active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100',
      )}
    />
  )
}

/**
 * The range converter and the charging calculator, in one menu.
 *
 * They had a slot each in the bar, between Services and Community, as if they
 * were sections of the site. They are utilities: grouped, they stop crowding
 * the destinations, and the bar has room to put Cars where people look for it.
 */
function ToolsMenu({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const active = NAV_TOOLS.some((tool) => isActivePath(pathname, tool.href))

  React.useEffect(() => setIsOpen(false), [pathname])

  React.useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setIsOpen(false)
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="nav-tools"
        className={cn(LINK, 'gap-1', active || isOpen ? 'text-white' : 'text-white/75 hover:text-white')}
      >
        Tools
        {/* A CSS turn. This chevron and the menu button's bars used to be
            framer-motion components, which put the whole library in the
            chunk every page loads for the sake of two icons. */}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            'transition-transform duration-200 motion-reduce:transition-none',
            isOpen && 'rotate-180',
          )}
        />
        <Underline active={active} />
      </button>

      {isOpen ? (
        <div
          id="nav-tools"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-plug-navy-950 p-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]"
        >
          {NAV_TOOLS.map((tool) => {
            const current = isActivePath(pathname, tool.href)
            return (
              <Link
                key={tool.href}
                href={tool.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors',
                  current ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                {tool.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  /*
    ── The account is fetched, not handed down ─────────────────────────

    The layout used to read the session and pass it in as a prop, which made
    every page under (main) uncacheable — a layout that reads cookies cannot be
    prerendered. Asking here keeps cookies() out of the render path. null until
    the answer arrives means a signed-in visitor sees "Sign In" for a moment;
    that is the accepted price, and it is confined to this effect.
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

  // A route change while the sheet is open would otherwise leave it mounted.
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  /*
    The bar is pine on every page, at every scroll position, and with the
    mobile sheet open. It used to turn white when the sheet opened, so the two
    could read as one white panel — under a dark bar on every other screen.
    The sheet is dark now instead, and nothing has to change colour.

    No frosted glass: backdrop-filter on a fixed full-width bar re-samples
    everything scrolling under it every frame, and was measured as the largest
    single cause of dropped frames while scrolling.
  */
  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] border-b border-white/[0.08] bg-plug-navy-950 transition-shadow duration-300 ease-out',
          // Once content passes under it, a soft shadow separates the bar from
          // a dark band that would otherwise run into it.
          isScrolled && 'shadow-[0_10px_30px_-14px_rgba(0,0,0,0.55)]',
        )}
      >
        <nav className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-3 sm:px-4 lg:px-4 xl:px-6">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 transition-opacity duration-150 hover:opacity-90"
            aria-label="Plug.pk home"
          >
            <Logo tone="dark" size="text-2xl" />
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(LINK, active ? 'text-white' : 'text-white/75 hover:text-white')}
                >
                  {link.label}
                  <Underline active={active} />
                </Link>
              )
            })}
            <ToolsMenu pathname={pathname} />
          </div>

          {/*
            No "Download App · Soon" button. It was the most prominent control
            in the header of every page, for an app that does not exist; the
            app's status lives on the home page's app band and in the footer.
          */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {user ? (
              <AccountMenu user={user} onDark />
            ) : (
              /*
                A real button, not a bare text link: signing in is the one
                action in the header, and as plain white type it read as part
                of the nav. Turquoise with pine type is the brand's accent pair.
              */
              <Button
                size="sm"
                href="/login"
                leftIcon={<UserCircle size={17} aria-hidden="true" />}
                className="min-h-11 bg-plug-cyan-400 px-4 text-plug-navy-950 shadow-[0_6px_18px_-8px_rgba(111,232,182,0.7)] hover:-translate-y-0.5 hover:bg-white hover:text-plug-navy-950 focus-visible:ring-plug-cyan-300 focus-visible:ring-offset-plug-navy-950"
              >
                Sign In
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 lg:hidden"
          >
            {/* The bars turn into the cross with a CSS cross-fade and quarter
                turn, both icons stacked in one cell so the box never shifts. */}
            <Menu
              size={24}
              aria-hidden="true"
              className={cn(
                'absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                isMobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
              )}
            />
            <X
              size={24}
              aria-hidden="true"
              className={cn(
                'absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
              )}
            />
          </button>
        </nav>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </>
  )
}
