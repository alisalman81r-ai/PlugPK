// src/components/admin/QuickActions.tsx
'use client'

import { Car, ChevronDown, Plug, Plus, Store, Wrench, Zap } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * The five things an operator creates, behind one control.
 *
 * ── Every item goes somewhere that exists ─────────────────────────────
 *
 * The brief also asked for "Create Announcement". There is no route or form
 * for one — the community screen moderates posts written by members and has
 * no authoring path — so it is not in this menu. A disabled item, or one
 * pointing at a page that 404s, teaches an operator to stop trusting the menu;
 * the honest version is five working items and a note in the handover.
 */

const ACTIONS = [
  { href: '/admin/stations/new', label: 'Add station', icon: Zap },
  { href: '/admin/connectors/new', label: 'Add connector', icon: Plug },
  { href: '/admin/services/new', label: 'Add service', icon: Wrench },
  { href: '/admin/cars/new', label: 'Add car', icon: Car },
  { href: '/admin/businesses/new', label: 'Add business', icon: Store },
] as const

export function QuickActions() {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)

  /*
    Closes on outside click and on Escape.

    A menu that traps focus or can only be closed by choosing something is the
    fastest way to make a dashboard feel cheap, and Escape is the key people
    reach for without thinking.
  */
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
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-ui-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
      >
        <Plus size={15} aria-hidden="true" />
        Quick add
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.22)]"
        >
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-ui-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-plug-blue-600"
              >
                <Icon size={15} aria-hidden="true" className="text-slate-400" />
                {action.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
