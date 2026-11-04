// src/components/admin/QuickActions.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon, type AdmIconName } from './admin-icons'

/**
 * The five things an operator creates, behind the design's "Quick add" menu
 * (`.menu`): a line button, and a list that fades and drops in under it.
 * Every item goes to a create form that exists.
 */
const ACTIONS: { href: string; label: string; icon: AdmIconName }[] = [
  { href: '/admin/stations/new', label: 'Station', icon: 'bolt' },
  { href: '/admin/connectors/new', label: 'Connector', icon: 'plug' },
  { href: '/admin/businesses/new', label: 'Business', icon: 'building' },
  { href: '/admin/services/new', label: 'Service', icon: 'wrench' },
  { href: '/admin/cars/new', label: 'Car', icon: 'car' },
]

export function QuickActions() {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)

  // Closes on an outside click and on Escape.
  React.useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className={cn('menu', open && 'is-open')}>
      <button
        className="btn btn--line"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AdmIcon name="plus" />
        Quick add
        <AdmIcon name="down" />
      </button>
      <div className="menu__list" role="menu">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href} role="menuitem" onClick={() => setOpen(false)}>
            <AdmIcon name={action.icon} />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
