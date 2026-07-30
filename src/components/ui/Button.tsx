// src/components/ui/Button.tsx
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-plug-blue-600 text-white hover:-translate-y-0.5 hover:bg-plug-blue-700 hover:shadow-blue active:scale-[0.98] focus-visible:ring-plug-blue-500',
        secondary:
          'border-[1.5px] border-plug-blue-200 bg-white text-plug-blue-600 hover:border-plug-blue-300 hover:bg-plug-blue-50 focus-visible:ring-plug-blue-500',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        gradient:
          'bg-gradient-brand text-white hover:-translate-y-0.5 hover:shadow-blue-lg hover:brightness-110 focus-visible:ring-plug-blue-500',
        'outline-white':
          'border border-white bg-transparent text-white hover:bg-white/10 focus-visible:ring-white',
      },
      size: {
        sm: 'h-9 rounded-lg px-3.5 text-sm',
        md: 'h-11 rounded-[10px] px-5 text-[15px]',
        lg: 'h-13 rounded-[10px] px-7 text-base',
        xl: 'h-[60px] rounded-[10px] px-9 text-[17px]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gradient' | 'outline-white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  href?: string
  external?: boolean
}

export function Button({
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
}: ButtonProps) {
  const isInert = disabled || isLoading

  const classes = cn(
    buttonVariants({ variant, size, fullWidth }),
    // pointer-events-none removes every hover and active effect in one go, so
    // the inert states need no per-variant overrides.
    isInert && 'pointer-events-none cursor-not-allowed',
    disabled && 'opacity-50',
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
      type={type}
      disabled={isInert}
      className={classes}
      aria-busy={isLoading || undefined}
    >
      {content}
    </button>
  )
}
