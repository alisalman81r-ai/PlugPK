// src/components/layout/AccountMenu.tsx
'use client'

import { Building2, ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { signOut } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'

/**
 * Who is signed in, in the header.
 *
 * The header used to show "Sign In" to everybody, signed in or not, so the one
 * place a site normally confirms who you are said nothing — and the only way
 * to sign out was to find the dashboard sidebar.
 */

export interface AccountMenuProps {
  user: { name: string; email: string }
}

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/business/dashboard', label: 'My listings', icon: Building2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // A menu that stays open after you click elsewhere reads as stuck, and one
  // that ignores Escape traps keyboard users inside it.
  React.useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
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

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsOpen(false)
    // refresh, not just push: the header is server-rendered, so the page has to
    // be re-read for it to stop showing this menu.
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border border-slate-200 pl-1.5 pr-2.5 transition-colors duration-150',
          'hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
          isOpen && 'bg-slate-50',
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate text-sm font-semibold text-slate-700">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="p-1.5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <link.icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut size={16} className="shrink-0 text-red-400" aria-hidden="true" />
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
