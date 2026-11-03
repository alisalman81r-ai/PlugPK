// src/components/services/ServiceCardsIntro.tsx
'use client'

import * as React from 'react'

import { useCardIntro } from './services-motion'

/**
 * A grid of service cards that arrives the way the directory's does
 * (page-services.js "first reveal of the cards"): every card waits 48px down
 * and transparent, then they rise in 0.06s apart when the grid's top reaches
 * 88% of the screen. For the server-rendered category pages.
 */
export function ServiceCardsIntro({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useCardIntro(ref)
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
