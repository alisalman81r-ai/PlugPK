// src/components/ui/Card.tsx
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  radius?: 'md' | 'lg' | 'xl' | '2xl'
  onClick?: () => void
  style?: React.CSSProperties
  animationDelay?: number
}

const cardVariants = cva('bg-white', {
  variants: {
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    },
    shadow: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-card',
      lg: 'shadow-card-hover',
    },
    radius: {
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
      '2xl': 'rounded-[24px]',
    },
    border: {
      true: 'border border-slate-200',
      false: '',
    },
    hover: {
      true: 'cursor-pointer transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover',
      false: '',
    },
  },
  defaultVariants: {
    padding: 'md',
    shadow: 'md',
    radius: 'lg',
    border: true,
    hover: false,
  },
})

export function Card({
  children,
  className,
  hover = false,
  clickable = false,
  padding = 'md',
  shadow = 'md',
  border = true,
  radius = 'lg',
  onClick,
  style,
  animationDelay,
}: CardProps) {
  const mergedStyle =
    animationDelay !== undefined ? { ...style, animationDelay: `${animationDelay}ms` } : style

  // Only attached when an onClick is supplied, which means the caller is inside
  // a client component — a Server Component cannot pass a handler at all, so
  // Card stays usable as a plain server-rendered container.
  const interactiveProps = onClick
    ? {
        onClick,
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
        cardVariants({ padding, shadow, radius, border, hover }),
        clickable && 'cursor-pointer',
        clickable &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className,
      )}
      style={mergedStyle}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...interactiveProps}
    >
      {children}
    </div>
  )
}
