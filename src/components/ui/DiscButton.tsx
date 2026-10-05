// src/components/ui/DiscButton.tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

import { Button } from './Button'

/**
 * A call to action with a leading icon — now a thin wrapper around Button.
 *
 * It used to be a pill whose icon disc slid across on hover, one of the
 * competing primary treatments the design-system audit found. The name is kept
 * so its call sites compile, and each tone maps onto a canonical variant:
 *
 *   dark   (a glass pill on a dark band) → outline-white
 *   light  (a solid ink pill)            → primary
 *
 * Every instance still carries the `disc-cta` class. Surrounding panels hook
 * onto it with `group-has-[.disc-cta:hover]/<name>:` — that is how Partner Up
 * fades its photo in and the community card brings up its chat — so dropping
 * the class would silently break those effects.
 *
 * `width` is accepted and ignored: Button sizes to its label. New code should
 * use <Button href leftIcon> directly.
 */
export interface DiscButtonProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  tone?: 'dark' | 'light'
  /** @deprecated No longer used; the button sizes to its label. */
  width?: string
  className?: string
}

export function DiscButton({ href, icon, children, tone = 'dark', className }: DiscButtonProps) {
  return (
    <Button
      href={href}
      size="lg"
      variant={tone === 'light' ? 'primary' : 'outline-white'}
      leftIcon={<span aria-hidden="true" className="inline-flex">{icon}</span>}
      // Block-level, as the disc pill was, so a call site's mx-auto still centres it.
      className={cn('disc-cta flex w-fit', className)}
    >
      {children}
    </Button>
  )
}
