// src/components/ui/SectionHeader.tsx
import * as React from 'react'

import { cn } from '@/lib/utils'
import { EyebrowBadge } from './Badge'

export interface SectionHeaderProps {
  eyebrow?: string
  eyebrowColor?: 'blue' | 'cyan' | 'green' | 'amber'
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  titleGradient?: boolean
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  eyebrow,
  eyebrowColor = 'blue',
  title,
  subtitle,
  align = 'left',
  titleGradient = false,
  action,
  className,
}: SectionHeaderProps) {
  const isCentered = align === 'center'

  return (
    <div
      className={cn(
        isCentered
          ? 'mx-auto max-w-2xl text-center'
          : 'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn(!isCentered && 'max-w-2xl')}>
        {eyebrow ? (
          <div className="mb-5">
            <EyebrowBadge color={eyebrowColor}>{eyebrow}</EyebrowBadge>
          </div>
        ) : null}

        <h2
          className={cn(
            'text-[28px] font-bold leading-tight md:text-display-md',
            titleGradient ? 'gradient-text' : 'text-slate-900',
          )}
        >
          {title}
        </h2>

        {subtitle ? (
          <p className={cn('mt-4 max-w-2xl text-lg leading-relaxed text-slate-500', isCentered && 'mx-auto')}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className={cn('shrink-0', isCentered && 'mt-6 flex justify-center')}>{action}</div>
      ) : null}
    </div>
  )
}
