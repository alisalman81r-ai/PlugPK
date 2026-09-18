// src/components/admin/InfoHint.tsx
'use client'

import { HelpCircle, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * "What is this box for?", answered in place.
 *
 * ── Why this exists instead of sample numbers ─────────────────────────
 *
 * The obvious way to make an empty panel legible is to fill it with plausible
 * figures. This product has refused that everywhere else and refuses it here:
 * a dashboard an operator cannot trust is worse than one with a gap in it,
 * because the gap is obvious and the invention is not. Somebody would read a
 * demo figure as a reading, and there is no way to tell which is which after
 * the fact.
 *
 * So the panels keep showing exactly what the database can answer, and the
 * explanation of what they mean sits beside them rather than inside them.
 *
 * ── What each hint should say ─────────────────────────────────────────
 *
 * Three things, in this order, because that is the order an operator asks
 * them in:
 *
 *   what it counts   — in plain words, not the column name
 *   where it comes   — which table or query, so a wrong number is traceable
 *   what to do       — the action it should prompt, or that it is FYI
 *
 * A hint that only restates the label is worse than none: it adds a control
 * to press and answers nothing.
 *
 * ── Why a button and not a title attribute ────────────────────────────
 *
 * `title` needs a mouse held still for a second, never appears on touch, and
 * is invisible to a keyboard. This is a button: it opens on click or Enter,
 * closes on Escape or an outside click, and reads to a screen reader as what
 * it is.
 */

export interface InfoHintProps {
  /** What this box is for. Two or three sentences at most. */
  children: React.ReactNode
  /** Named in the accessible label, so the button is not one of forty "more info"s. */
  label: string
  className?: string
  /** Which side to open towards, where the default would leave the card. */
  align?: 'left' | 'right'
}

export function InfoHint({ children, label, className, align = 'right' }: InfoHintProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <span ref={containerRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={`What is “${label}”?`}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
          isOpen
            ? 'bg-plug-blue-600 text-white'
            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500',
        )}
      >
        <HelpCircle size={14} aria-hidden="true" />
      </button>

      {isOpen ? (
        <span
          role="note"
          className={cn(
            // z-20 clears the sticky topbar's shadow but stays under modals.
            'absolute top-7 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-e3',
            align === 'right' ? 'left-0' : 'right-0',
          )}
        >
          <span className="mb-1.5 flex items-start justify-between gap-2">
            <span className="text-ui-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {label}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="-mr-1 -mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
          <span className="block text-ui-sm leading-relaxed text-slate-600 [&_b]:font-semibold [&_b]:text-slate-900">
            {children}
          </span>
        </span>
      ) : null}
    </span>
  )
}
