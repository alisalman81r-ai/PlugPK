// src/components/ui/Card.tsx
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-2xl', {
  variants: {
    variant: {
      default: 'border border-slate-200 bg-white shadow-card',
      hoverable:
        'border border-slate-200 bg-white shadow-card transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover',
      flat: 'border border-slate-200 bg-white',
      elevated: 'bg-white shadow-xl',
      dark: 'border border-white/8 bg-dark-card',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

export interface CardProps {
  variant?: 'default' | 'hoverable' | 'flat' | 'elevated' | 'dark'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children: React.ReactNode
  onClick?: () => void
  animationDelay?: number
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  onClick,
  animationDelay,
}: CardProps) {
  // Handlers are attached only when onClick is supplied. A Server Component
  // cannot pass a function at all, so Card stays usable as a zero-JS container
  // without needing 'use client'.
  const interactiveProps = onClick
    ? {
        onClick,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick()
          }
        },
      }
    : {}

  return (
    <div
      className={cn(
        cardVariants({ variant, padding }),
        onClick &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className,
      )}
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
      {...interactiveProps}
    >
      {children}
    </div>
  )
}
