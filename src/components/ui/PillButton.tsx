// src/components/ui/PillButton.tsx
import { ArrowUpRight } from '@/components/ui/icons'
import * as React from 'react'

import { Button } from './Button'

/**
 * A link-styled call to action with a trailing arrow — now a thin wrapper
 * around Button.
 *
 * It used to be its own full-round pill with a two-arrow swap animation, one
 * of the five competing "primary" treatments the design-system audit found. It
 * is kept as a name so the call sites on the home page, Partner Up and the
 * community pages keep compiling, and maps each tone onto the canonical
 * variant for the surface it sits on:
 *
 *   dark   (on a light section)  → primary
 *   light  (on a dark section)   → inverse
 *   brand                        → primary; the gradient is no longer a
 *                                  separate primary
 *
 * New code should use <Button href rightIcon> directly.
 */
export interface PillButtonProps {
  href: string
  children: React.ReactNode
  tone?: 'dark' | 'light' | 'brand'
  className?: string
}

export function PillButton({ href, children, tone = 'dark', className }: PillButtonProps) {
  return (
    <Button
      href={href}
      size="lg"
      variant={tone === 'light' ? 'inverse' : 'primary'}
      rightIcon={<ArrowUpRight size={18} aria-hidden="true" />}
      className={className}
    >
      {children}
    </Button>
  )
}
