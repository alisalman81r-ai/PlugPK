// src/components/layout/Navbar.tsx
'use client'

import { ChevronDown, UserCircle } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Logo } from '@/components/ui/Logo'
import { NAV_LINKS, NAV_TOOLS } from '@/lib/constants'
import { useMenuKeyboard } from '@/hooks/useListKeyboard'
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
 * The landing-v2 navbar: a floating pill.
 *
 * Full width at the top of the page; once scrolling starts it tightens into a
 * compact bar. Over a section marked data-theme="light" it turns to paper so
 * it never sits as a dark slab on a light page. A pill slides to the hovered
 * link, the current page carries a volt dot, and a hairline along the bottom
 * shows how far down the page you are.
 *
 * min-h-11 keeps every item a 44px target.
 */
const LINK =
  'relative z-[1] inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-[14.5px] font-medium transition-colors duration-300 xl:px-[15px]'

function ActiveDot({ light }: { light: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('absolute bottom-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full', light ? 'bg-volt-ink' : 'bg-volt')}
    />
  )
}

/** The range converter and the charging calculator, in one menu. */
function ToolsMenu({ pathname, light }: { pathname: string; light: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const active = NAV_TOOLS.some((tool) => isActivePath(pathname, tool.href))
  const menuKeys = useMenuKeyboard(menuRef, isOpen, setIsOpen)

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
    <div ref={ref} className="relative" data-nav-item>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={menuKeys.onTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="nav-tools"
        aria-current={active ? 'page' : undefined}
        className={cn(
          LINK,
          'gap-1',
          light
            ? active || isOpen
              ? 'text-ink'
              : 'text-ink/60 hover:text-ink'
            : active || isOpen
              ? 'text-white'
              : 'text-white/70 hover:text-white',
        )}
      >
        Tools
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn('transition-transform duration-300 motion-reduce:transition-none', isOpen && 'rotate-180')}
        />
        {active ? <ActiveDot light={light} /> : null}
      </button>

      {isOpen ? (
        <div
          id="nav-tools"
          ref={menuRef}
          onKeyDown={menuKeys.onMenuKeyDown}
          className="absolute left-1/2 top-[calc(100%+10px)] z-50 min-w-[220px] -translate-x-1/2 rounded-[18px] border border-white/10 bg-ink-2 p-2 shadow-e2"
        >
          {NAV_TOOLS.map((tool) => {
            const current = isActivePath(pathname, tool.href)
            return (
              <Link
                key={tool.href}
                href={tool.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-full px-[15px] text-[14.5px] font-medium text-white transition-colors focus-visible:bg-white/10 focus-visible:outline-none',
                  current ? 'bg-white/10' : 'hover:bg-white/[0.06]',
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
  const [isLight, setIsLight] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const progressRef = React.useRef<HTMLElement>(null)
  const linksRef = React.useRef<HTMLDivElement>(null)
  const [pill, setPill] = React.useState<{ left: number; width: number } | null>(null)

  /*
    The account is fetched, not handed down: a layout that reads cookies
    cannot be prerendered. null until the answer arrives means a signed-in
    visitor sees "Sign In" for a moment; that is the accepted price.
  */
  const [user, setUser] = React.useState<NavUser | null>(null)

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  /*
    One scroll handler for the three things that follow the scroll: the
    compact state, the light/dark theme of whatever section sits under the bar,
    and the progress hairline. The theme is read from the element under the
    bar's centre, so a page only has to mark its sections data-theme="light";
    anything unmarked counts as dark, which is what the heroes are.
  */
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      setIsScrolled(y > 20)
      const under = document.elementsFromPoint(window.innerWidth / 2, 46).find((el) => !el.closest('header'))
      setIsLight(under?.closest('[data-theme]')?.getAttribute('data-theme') === 'light')
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])

  // A route change while the sheet is open would otherwise leave it mounted.
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  /** Slides the hover pill under the item the pointer is over. */
  const onLinksPointerOver = (event: React.PointerEvent) => {
    const item = (event.target as HTMLElement).closest('[data-nav-item]') as HTMLElement | null
    const box = linksRef.current
    if (!item || !box || !box.contains(item)) return
    setPill({ left: item.offsetLeft, width: item.offsetWidth })
  }

  const light = isLight && !isMobileMenuOpen

  return (
    <>
      <header
        className={cn(
          'fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-5 rounded-full border pl-4 pr-[9px] backdrop-blur-[14px] lg:pl-5',
          'transition-[width,height,top,background-color,border-color,box-shadow] duration-700 ease-out motion-reduce:transition-none',
          isScrolled
            ? 'top-[10px] h-[58px] w-[calc(100%-24px)] lg:w-[min(1080px,calc(100%-24px))]'
            : 'top-[10px] h-[58px] w-[calc(100%-24px)] lg:top-[14px] lg:h-[66px] lg:w-[min(1400px,calc(100%-2*clamp(16px,4vw,64px)))]',
          light
            ? cn('border-ink/[0.08]', isScrolled ? 'bg-paper/90 shadow-[0_24px_50px_-24px_rgba(11,12,14,0.25)]' : 'bg-paper/70')
            : cn('border-white/[0.08]', isScrolled ? 'bg-ink/80 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)]' : 'bg-ink/50'),
        )}
      >
        <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label="plugpk home">
          <Logo tone={light ? 'light' : 'dark'} size="text-[23px]" />
        </Link>

        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <div
            ref={linksRef}
            onPointerOver={onLinksPointerOver}
            onPointerLeave={() => setPill(null)}
            className={cn(
              'relative flex items-center gap-0.5 rounded-full border p-1 transition-colors duration-500',
              light ? 'border-ink/[0.06] bg-ink/[0.035]' : 'border-white/[0.06] bg-white/[0.04]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute bottom-1 top-1 rounded-full transition-[left,width,opacity] duration-500 ease-out motion-reduce:transition-none',
                light ? 'bg-white shadow-[0_1px_2px_rgba(11,12,14,0.08),0_4px_12px_-4px_rgba(11,12,14,0.12)]' : 'bg-white/10',
                pill ? 'opacity-100' : 'opacity-0',
              )}
              style={pill ? { left: pill.left, width: pill.width } : undefined}
            />
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-nav-item
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    LINK,
                    light
                      ? active
                        ? 'text-ink'
                        : 'text-ink/60 hover:text-ink'
                      : active
                        ? 'text-white'
                        : 'text-white/70 hover:text-white',
                  )}
                >
                  {link.label}
                  {active ? <ActiveDot light={light} /> : null}
                </Link>
              )
            })}
            <ToolsMenu pathname={pathname} light={light} />
          </div>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:ml-0 lg:flex">
          {user ? (
            <AccountMenu user={user} onDark={!light} />
          ) : (
            <Link
              href="/login"
              className="inline-flex h-[42px] items-center gap-2.5 rounded-full bg-volt px-[18px] text-sm font-semibold text-ink shadow-volt transition-colors duration-300 hover:bg-white"
            >
              <UserCircle size={18} aria-hidden="true" />
              Sign In
            </Link>
          )}
        </div>

        {/* The burger: a volt disc whose two bars cross into an X. */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          className="relative ml-auto h-[46px] w-[46px] shrink-0 rounded-full bg-volt lg:hidden"
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-[14px] right-[14px] h-0.5 rounded-sm bg-ink transition-all duration-300 ease-out motion-reduce:transition-none',
              isMobileMenuOpen ? 'top-[22px] rotate-45' : 'top-[19px]',
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-[14px] right-[14px] h-0.5 rounded-sm bg-ink transition-all duration-300 ease-out motion-reduce:transition-none',
              isMobileMenuOpen ? 'top-[22px] -rotate-45' : 'top-[26px]',
            )}
          />
        </button>

        <i
          ref={progressRef}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -bottom-px left-[30px] right-[30px] h-0.5 origin-left scale-x-0 rounded-sm',
            light ? 'bg-ink' : 'bg-volt',
          )}
        />
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </>
  )
}
