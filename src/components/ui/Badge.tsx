// src/components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full align-middle font-medium',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        blue: 'border border-blue-200 bg-blue-50 text-blue-700',
        cyan: 'border border-cyan-200 bg-cyan-50 text-cyan-700',
        green: 'border border-green-200 bg-green-50 text-green-700',
        amber: 'border border-amber-200 bg-amber-50 text-amber-700',
        red: 'border border-red-200 bg-red-50 text-red-700',
        purple: 'border border-purple-200 bg-purple-50 text-purple-700',
        slate: 'border border-slate-200 bg-slate-50 text-slate-600',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Badge({
  variant = 'default',
  size = 'md',
  leftIcon,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {leftIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}
      {children}
    </span>
  )
}

export interface EyebrowBadgeProps {
  children: React.ReactNode
  color?: 'blue' | 'cyan' | 'green' | 'amber'
  className?: string
}

const EYEBROW_COLORS: Record<NonNullable<EyebrowBadgeProps['color']>, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  green: 'border-green-200 bg-green-50 text-green-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function EyebrowBadge({ children, color = 'blue', className }: EyebrowBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-widest',
        EYEBROW_COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
