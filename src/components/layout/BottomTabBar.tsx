// src/components/layout/BottomTabBar.tsx
'use client'

import { MapPin, Route, UserCircle, Users, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

interface Tab {
  label: string
  href: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { label: 'Map', href: '/map', icon: MapPin },
  { label: 'Routes', href: '/routes', icon: Route },
  { label: 'Services', href: '/services', icon: Wrench },
  { label: 'Community', href: '/community', icon: Users },
  { label: 'Profile', href: '/dashboard', icon: UserCircle },
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

  // The dashboard ships its own mobile tab bar; two fixed bars would stack.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return null

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {tabs.map((tab) => {
          const active = isActivePath(pathname, tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className="flex cursor-pointer items-center justify-center transition-all duration-150"
            >
              <span
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150',
                  active && 'bg-blue-50 px-4 py-1.5',
                )}
              >
                <Icon
                  size={22}
                  className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    active ? 'text-plug-blue-600' : 'text-slate-400',
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
