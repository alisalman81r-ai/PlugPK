// src/components/admin/InfoHint.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'

/**
 * "What is this box for?", answered in place — the design's `.help` (a small
 * `?` in a ring beside a title), opening a note card.
 *
 * Panels show exactly what the database can answer; the explanation of what
 * they mean sits beside them rather than inside them, instead of sample
 * numbers. A hint should say what it counts, where it comes from, and what to
 * do about it — in that order.
 *
 * A button, not a title attribute: `title` needs a still mouse, never appears
 * on touch and is invisible to a keyboard. This opens on click or Enter and
 * closes on Escape or an outside click.
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
    <span ref={containerRef} className={cn('hint', className)}>
      <button
        type="button"
        className="help"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={`What is “${label}”?`}
      >
        ?
      </button>

      {isOpen ? (
        <span role="note" className={cn('hint__pop', align === 'right' ? 'hint__pop--r' : 'hint__pop--l')}>
          <span className="hint__head">
            <span className="hint__lab">{label}</span>
            <button type="button" className="hint__x" onClick={() => setIsOpen(false)} aria-label="Close">
              <AdmIcon name="x" />
            </button>
          </span>
          <span className="hint__body">{children}</span>
        </span>
      ) : null}
    </span>
  )
}
