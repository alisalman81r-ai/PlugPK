// src/components/admin/AdminShell.tsx
'use client'

import './admin.css'

import { usePathname } from 'next/navigation'
import * as React from 'react'

import type { AdminBadgeCounts } from '@/lib/db/admin-badges'
import { cn } from '@/lib/utils'

import { AdminNav } from './AdminNav'
import { AdminToastProvider } from './AdminToast'
import { AdminTopbar, type AdminUser } from './AdminTopbar'

/**
 * The portal's chrome: the ink sidebar, the chalk workspace and the sticky top
 * bar — `.adm`, `.side`, `.main`, `.top` and `.page` of the landing-v2 admin
 * design (admin.css). Every admin screen renders inside `<main class="page">`.
 *
 * ── For pages ──────────────────────────────────────────────────────────
 *
 * `.page` already carries the design's padding and 1880px measure, so a page
 * renders its AdminHeader (`.phead`) and its content directly — no wrapper
 * with its own px/py. The design's classes (card, chead, tools, seg, chips,
 * t, pill, btn…) are available to every page through admin.css, scoped to
 * `.adm`.
 *
 * ── State held here ───────────────────────────────────────────────────
 *
 * The sidebar collapse (desktop, remembered in localStorage — read after mount
 * so server and client markup agree) and the mobile drawer (`.adm.nav-open`).
 * Both change the sidebar and the column beside it, which are siblings, and the
 * layout that renders them is a server component that only authorises.
 *
 * The signed-in account is read once here from /api/me and shared by the
 * sidebar footer and the profile menu.
 */

const STORAGE_KEY = 'plugpk.admin.sidebar.collapsed'

export function AdminShell({
  badges,
  failedBadges = [],
  children,
}: {
  badges: AdminBadgeCounts
  /** Queues whose count could not be read, shown as unavailable not as clear. */
  failedBadges?: string[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const [user, setUser] = React.useState<AdminUser | null>(null)

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // No stored preference is the same as not having one.
    }
  }, [])

  React.useEffect(() => {
    const abort = new AbortController()
    fetch('/api/me', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
    return () => abort.abort()
  }, [])

  // A route change closes the drawer, or it stays over the page just opened.
  React.useEffect(() => setNavOpen(false), [pathname])

  // While the drawer is open: Escape closes it and the page stops scrolling.
  React.useEffect(() => {
    if (!navOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [navOpen])

  const toggle = React.useCallback(() => {
    setCollapsed((value) => {
      const next = !value
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // The sidebar still collapses; it just will not be remembered.
      }
      return next
    })
  }, [])

  const waiting = React.useMemo(() => Object.values(badges ?? {}).reduce((sum, n) => sum + n, 0), [badges])

  return (
    <div className={cn('adm', navOpen && 'nav-open', collapsed && 'is-collapsed')}>
      <AdminToastProvider>
        <AdminNav
          badges={badges}
          failedBadges={failedBadges}
          collapsed={collapsed}
          open={navOpen}
          onClose={() => setNavOpen(false)}
          user={user}
        />
        <div className="main">
          <AdminTopbar
            collapsed={collapsed}
            onToggleCollapse={toggle}
            onOpenMenu={() => setNavOpen(true)}
            menuOpen={navOpen}
            waiting={waiting}
            user={user}
          />
          <main className="page" id="admin-main">
            {children}
          </main>
        </div>
      </AdminToastProvider>
    </div>
  )
}
