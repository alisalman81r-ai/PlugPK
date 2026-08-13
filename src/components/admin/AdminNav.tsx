// src/components/admin/AdminNav.tsx
'use client'

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Stations', href: '/admin/stations', icon: Zap },
  { label: 'Services', href: '/admin/services', icon: Wrench },
  { label: 'Community', href: '/admin/community', icon: MessageSquare },
]

function isActive(pathname: string, href: string): boolean {
  // Overview would otherwise match every admin route.
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin"
      className="sticky top-0 flex h-viewport w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-2">
          <Zap size={18} className="fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
          <span className="font-bold text-slate-900">plug.pk</span>
          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </Link>
      </div>

      <ul className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-ui font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                  active
                    ? 'bg-blue-50 text-plug-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-slate-100 p-3">
        <Link
          href="/"
          className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-ui-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <ExternalLink size={15} className="shrink-0" aria-hidden="true" />
          View live site
        </Link>

        {/* A POST, not a link: signing out changes server state, and a GET
            that mutates would be followed by any prefetcher. */}
        <form action="/api/admin/signout" method="post">
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-ui-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut size={15} className="shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
