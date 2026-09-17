// src/components/admin/AdminShell.tsx
'use client'

import * as React from 'react'

import type { AdminBadgeCounts } from '@/lib/db/admin-badges'
import { AdminNav } from './AdminNav'
import { AdminTopbar } from './AdminTopbar'

/**
 * Holds the one piece of state the sidebar and the page both need.
 *
 * ── Why a client wrapper and not state inside AdminNav ────────────────
 *
 * Collapsing changes the sidebar's width, and the content beside it has to
 * take up the slack. AdminNav and <main> are siblings, so state living inside
 * the nav could never reach the main column — and the layout that renders both
 * is a server component, which cannot hold state at all. This is the smallest
 * thing that owns both: the layout stays a server component and keeps reading
 * cookies for authorisation, and only the chrome is client-side.
 *
 * ── Remembering the choice ────────────────────────────────────────────
 *
 * localStorage, read after mount rather than during render. Reading it during
 * render would make the server and client markup disagree and React would
 * discard the tree; the cost of reading after is one frame in the expanded
 * state, which is the right default to flash.
 *
 * Wrapped in try/catch because storage throws rather than returning null in a
 * private window and wherever site data is blocked, and a sidebar preference
 * is not worth taking the portal down for.
 */

const STORAGE_KEY = 'plugpk.admin.sidebar.collapsed'

export function AdminShell({
  badges,
  children,
}: {
  badges: AdminBadgeCounts
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // No stored preference is the same as not having one.
    }
  }, [])

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

  return (
    <div className="min-h-viewport bg-slate-50 lg:flex">
      <AdminNav badges={badges} collapsed={collapsed} />

      {/* min-w-0 so a wide table inside a page cannot push this column past the
          viewport — a flex child's default min-width is its content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar collapsed={collapsed} onToggleCollapse={toggle} />
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  )
}
