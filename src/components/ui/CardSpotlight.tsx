// src/components/ui/CardSpotlight.tsx
'use client'

import * as React from 'react'

/**
 * Moves the light across whichever card the pointer is over.
 *
 * Mounted once, in the main layout. It writes two custom properties — --px and
 * --py — onto the .card-frame under the cursor; globals.css does the rest. This
 * component renders nothing.
 *
 * ── Why one listener, delegated ───────────────────────────────────────
 *
 * The obvious build is a wrapper component per card holding its own
 * pointermove handler. That is one listener per card, and the cars catalogue
 * renders forty-eight of them in a grid: forty-eight handlers, forty-eight
 * closures, and every one of them attached and detached as React reconciles
 * the list on a filter change. One listener on the document costs the same
 * whether the page holds four cards or four hundred.
 *
 * It also means no call site changed. Twenty-two components import FRAME and
 * none of them had to learn about this.
 *
 * ── Why it is cheap enough to run on every pointer move ───────────────
 *
 * Three things keep it off the main thread's critical path.
 *
 * The handler is passive and does no layout work of its own beyond one
 * getBoundingClientRect on the card actually under the cursor — not on every
 * card, because closest() walks up from the event target rather than querying
 * the document.
 *
 * Writes are coalesced into one animation frame. A pointer can fire well above
 * 60Hz on a high-polling mouse, and writing a custom property on every one of
 * those events would queue style recalculations faster than they can be
 * consumed.
 *
 * And the properties only affect background-position and colour, so a change
 * repaints the card's own border layer without reflowing anything.
 *
 * ── What it deliberately does not do ──────────────────────────────────
 *
 * No cleanup of the previous card's variables on leave. They are inert once
 * the card is not hovered — the highlight is only visible under :hover — and
 * chasing a leave event to reset two numbers nobody can see is work for
 * nothing.
 *
 * Reduced motion is handled in CSS rather than by refusing to attach here, so
 * the preference is read at paint time and follows the user changing it
 * mid-session without this component remounting.
 */
export function CardSpotlight() {
  React.useEffect(() => {
    let frame = 0
    let pending: { el: HTMLElement; x: number; y: number } | null = null

    const flush = () => {
      frame = 0
      if (!pending) return
      pending.el.style.setProperty('--px', `${pending.x}%`)
      pending.el.style.setProperty('--py', `${pending.y}%`)
      pending = null
    }

    const onMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const card = target.closest<HTMLElement>('.card-frame, .card-frame--featured')
      if (!card) return

      const rect = card.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      pending = {
        el: card,
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      }

      if (!frame) frame = requestAnimationFrame(flush)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
