// src/components/ui/Container.tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

type ContainerSize = 'sm' | 'md' | 'lg' | 'full'

const CONTAINER_SIZE: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-[1280px]',
  full: 'max-w-full',
}

export interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: ContainerSize
}

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-8 lg:px-20', CONTAINER_SIZE[size], className)}>
      {children}
    </div>
  )
}

type SectionBackground = 'white' | 'alt' | 'dark' | 'gradient'

const SECTION_BACKGROUND: Record<SectionBackground, string> = {
  white: 'bg-white',
  alt: 'bg-slate-50',
  dark: 'bg-dark-base text-white',
  gradient: 'bg-gradient-hero text-white',
}

export interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: SectionBackground
  id?: string
}

export function Section({ children, className, background = 'white', id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-20 lg:py-[120px]', SECTION_BACKGROUND[background], className)}
    >
      {children}
    </section>
  )
}
