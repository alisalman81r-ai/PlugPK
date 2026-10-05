// src/components/layout/BottomTabBar.tsx
'use client'

import { Car, MapPin, Route, User, UserCircle, Users, type IconType } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { getCurrentUser } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  href: string
  icon: IconType
}

/**
 * Five tabs, for what a driver opens the site for on a phone.
 *
 * Cars replaced Services: the catalogue is the site's second destination and
 * had no tab at all, while Services is a directory most visits never need. It
 * is still one tap away in the menu.
 */
const TABS: Tab[] = [
  { label: 'Map', href: '/map', icon: MapPin },
  { label: 'Routes', href: '/routes', icon: Route },
  { label: 'Cars', href: '/cars', icon: Car },
  { label: 'Community', href: '/community', icon: Users },
]

/**
 * Matches the tab's own route and anything nested beneath it. Comparing the
 * full segment prevents "/" from matching "/map" and "/route" from matching
 * "/routes".
 */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomTabBar() {
  const pathname = usePathname()

  /*
    The last tab says what it will do. It read "Profile" for everybody, and
    for a visitor with no account that led to a sign-in wall labelled as a
    profile. Signed out it is "Sign in", and it brings them back here.

    Re-asked on navigation while signed out, because this bar lives in the
    layout and is not remounted by the client-side hop back from /login.
  */
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    if (signedIn) return
    let live = true
    getCurrentUser()
      .then((user) => {
        if (live) setSignedIn(user !== null)
      })
      .catch(() => {
        if (live) setSignedIn(false)
      })
    return () => {
      live = false
    }
  }, [pathname, signedIn])

  // The dashboard ships its own mobile tab bar; two fixed bars would stack.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return null

  const onAuthPage = pathname === '/login' || pathname === '/signup'
  const account: Tab =
    signedIn === false
      ? {
          label: 'Sign in',
          href: onAuthPage ? '/login' : `/login?redirect=${encodeURIComponent(pathname)}`,
          icon: User,
        }
      : { label: 'Profile', href: '/dashboard', icon: UserCircle }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {[...TABS, account].map((tab) => {
          const active =
            tab.label === 'Sign in' ? pathname === '/login' : isActivePath(pathname, tab.href.split('?')[0] ?? tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-11 cursor-pointer items-center justify-center transition-all duration-150"
            >
              <span
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-150',
                  active && 'bg-plug-blue-50',
                )}
              >
                <Icon
                  size={22}
                  className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-500')}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    active ? 'text-plug-blue-600' : 'text-slate-500',
                  )}
                >
                  {tab.label}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
