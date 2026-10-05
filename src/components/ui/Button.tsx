// src/components/ui/Button.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { DISABLED, buttonVariants, type ButtonSize, type ButtonVariant } from './button-styles'

export type { ButtonSize, ButtonVariant, ButtonVariants } from './button-styles'

/* The canonical variants and why there are only four: see button-styles.ts. */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  href?: string
  external?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    href,
    external = false,
    className,
    children,
    disabled = false,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isInert = disabled || isLoading

  const classes = cn(
    buttonVariants({ variant, size, fullWidth }),
    // pointer-events-none removes every hover and active effect in one go, so
    // the inert states need no per-variant hover overrides.
    isInert && 'pointer-events-none cursor-not-allowed',
    // A loading button keeps its colours — it is working, not unavailable.
    disabled && !isLoading && DISABLED[variant],
    className,
  )

  const content = (
    <>
      {isLoading ? (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon ? (
        <span
          className={cn(
            'inline-flex transition-transform duration-200',
            !isInert && 'group-hover:translate-x-[3px]',
          )}
        >
          {rightIcon}
        </span>
      ) : null}
    </>
  )

  if (href !== undefined) {
    // `rest` is typed for a <button>; the two elements share every attribute
    // used here, so the remainder is re-typed rather than widened to `any`.
    const anchorProps = rest as unknown as Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>

    return (
      <Link
        {...anchorProps}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener' : undefined}
        className={classes}
        aria-disabled={isInert || undefined}
        aria-busy={isLoading || undefined}
        tabIndex={isInert ? -1 : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={isInert}
      className={classes}
      aria-busy={isLoading || undefined}
    >
      {content}
    </button>
  )
})
