// src/components/layout/ScrollProgress.tsx
'use client'

import * as React from 'react'

/**
 * A thin line along the top of the window showing how far down the page you
 * are — growing as you scroll down, shrinking as you scroll back up.
 *
 * It appears only while the page is moving and fades out shortly after it
 * stops, so it tells you where you are when you are travelling and is gone
 * when you are reading.
 *
 * ── Cheap by construction ─────────────────────────────────────────────
 *
 * The line is drawn full width and scaled on the X axis, so every update is a
 * compositor transform — no layout, no paint. Scroll events are coalesced to
 * one write per animation frame, and the listener is passive. Nothing here
 * sets React state per scroll event: the bar is written to directly through a
 * ref, and state changes only when it shows or hides.
 *
 * Decorative (aria-hidden): the browser's own scrollbar already tells a
 * screen reader user where they are.
 */

/** How long after the last scroll the line stays up before fading. */
const HIDE_AFTER_MS = 900

export function ScrollProgress() {
  const barRef = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let frame = 0
    let hideTimer: number | undefined

    const draw = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(draw)
      setVisible(true)
      window.clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => setVisible(false), HIDE_AFTER_MS)
    }

    // Set the length once without showing it, so the first scroll starts from
    // the right place rather than growing from zero.
    draw()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', draw, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', draw)
      window.clearTimeout(hideTimer)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={
        'pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] transition-opacity duration-300 ' +
        (visible ? 'opacity-100' : 'opacity-0')
      }
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left rounded-r-full bg-gradient-to-r from-plug-cyan-500 to-[#6FE8B6] shadow-[0_0_8px_rgba(111,232,182,0.55)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
