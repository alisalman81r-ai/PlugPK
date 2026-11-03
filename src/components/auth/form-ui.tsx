// src/components/auth/form-ui.tsx
/**
 * The landing-v2 form pieces shared by the account screens — sign in, sign up,
 * password help, onboarding and the dashboard (page-auth.css and
 * page-account.css of the design).
 *
 *   LABEL       .afield > label     Poppins 500, ink
 *   ALINK       .alink              ink link that draws a volt underline on hover
 *   ActionButton                   the v2 pill button with a loading state
 *   Notice                         a status or error line in a soft tinted box
 */

// No 'use client': server pages read these class strings too, and nothing
// here holds state.
import * as React from 'react'

import { btnClass, type BtnSize, type BtnVariant } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

export const LABEL = 'mb-2 block text-sm font-medium text-ink'

export const ALINK =
  'font-semibold text-ink no-underline bg-[linear-gradient(#D4FF3A,#D4FF3A)] bg-[length:0_2px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-300 ease-out hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] focus-visible:outline-none'

/** The quiet "back" link under a card (.aback). */
export const ABACK =
  'group/aback inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-spring hover:[&_svg]:-translate-x-[3px]'

/** Outlined white pill (.btn--line of the account page). */
export const LINE_BTN = 'border border-ink/10 bg-white text-ink hover:border-ink hover:bg-white'

/** Red pill for destructive actions (.btn--danger). */
export const DANGER_BTN = 'bg-[#c2410c] text-white hover:bg-ember hover:text-white'

export interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: BtnVariant
  size?: BtnSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  fullWidth?: boolean
  /** Replaces the variant's colours, for the line and danger looks. */
  tone?: 'line' | 'danger'
  className?: string
}

/** A v2 pill button that can show it is working. */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
    variant = 'ink',
    size = 'md',
    isLoading = false,
    leftIcon,
    fullWidth = false,
    tone,
    disabled,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        btnClass(variant, size),
        tone === 'line' && LINE_BTN,
        tone === 'danger' && DANGER_BTN,
        fullWidth && 'w-full',
        // A loading button is working, not unavailable: it keeps full colour.
        isLoading && 'disabled:opacity-100',
        'focus-visible:outline-none focus-visible:shadow-focus',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  )
})

/** The arrow that nudges right when its button is hovered. */
export function ArrowEnd() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="transition-transform duration-300 ease-spring group-hover/btn:translate-x-1">
      <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Notice({
  tone,
  children,
  className,
}: {
  tone: 'ok' | 'error' | 'warn'
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-[14px] border px-4 py-3 text-sm leading-relaxed',
        tone === 'ok' && 'border-[#BFEBD1] bg-[#E9F8EF] text-[#157A45]',
        tone === 'error' && 'border-[#FFCDBC] bg-[#FFECE6] text-[#B42E05]',
        tone === 'warn' && 'border-[#FFE0A3] bg-[#FFF6E3] text-[#8A5300]',
        className,
      )}
    >
      {children}
    </p>
  )
}
