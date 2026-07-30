// src/components/ui/Button.tsx
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'group relative inline-flex select-none items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue active:scale-[0.98] active:bg-blue-800 focus-visible:ring-blue-500',
        secondary:
          'border-[1.5px] border-blue-200 bg-white font-semibold text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-blue-500',
        ghost:
          'bg-transparent font-medium text-slate-700 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        outline:
          'border border-slate-200 bg-transparent font-medium text-slate-700 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
        destructive:
          'bg-red-500 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.98] focus-visible:ring-red-500',
        gradient:
          'bg-gradient-brand font-semibold text-white shadow-blue transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-lg hover:brightness-110 focus-visible:ring-blue-500',
      },
      size: {
        sm: 'h-9 gap-1.5 rounded-[6px] px-3 text-sm',
        md: 'h-11 gap-2 rounded-[8px] px-5 text-[15px]',
        lg: 'h-[52px] gap-2 rounded-[10px] px-7 text-base',
        xl: 'h-[60px] gap-2.5 rounded-[10px] px-9 text-[17px]',
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

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gradient' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  href?: string
  target?: '_blank' | '_self'
  ariaLabel?: string
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      children,
      className,
      onClick,
      type = 'button',
      href,
      target,
      ariaLabel,
    },
    ref,
  ) {
    // `pointer-events-none` removes every hover and active effect, so the
    // disabled and loading states need no per-variant overrides.
    const isInert = disabled || isLoading

    const classes = cn(
      buttonVariants({ variant, size, fullWidth }),
      isLoading && 'pointer-events-none',
      disabled && 'cursor-not-allowed opacity-50',
      isInert && 'pointer-events-none',
      className,
    )

    const content = (
      <>
        {isLoading ? <Spinner size={16} /> : leftIcon}
        <span className={cn(isLoading && 'opacity-70')}>{children}</span>
        {rightIcon ? (
          <span
            className={cn(
              'inline-flex transition-transform duration-200',
              !isInert && 'group-hover:translate-x-0.5',
            )}
          >
            {rightIcon}
          </span>
        ) : null}
      </>
    )

    if (href !== undefined) {
      // A disabled anchor still needs to be unfocusable and announce its state,
      // since <a> has no native disabled attribute.
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={isInert ? undefined : href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className={classes}
          aria-label={ariaLabel}
          aria-disabled={isInert || undefined}
          aria-busy={isLoading || undefined}
          tabIndex={isInert ? -1 : undefined}
          role={isInert ? 'link' : undefined}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        onClick={onClick}
        disabled={isInert}
        className={classes}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
      >
        {content}
      </button>
    )
  },
)
