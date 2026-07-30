// src/components/ui/Skeleton.tsx
import { cn } from '@/lib/utils'

type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full'

const RADIUS: Record<SkeletonRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export interface SkeletonProps {
  className?: string
  rounded?: SkeletonRadius
}

/**
 * The gradient, background-size and shimmer animation live in the `.shimmer-bg`
 * utility in globals.css, which keeps this free of inline styles.
 */
export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('shimmer-bg', RADIUS[rounded], className)} />
}

export interface StationCardSkeletonProps {
  className?: string
}

export function StationCardSkeleton({ className }: StationCardSkeletonProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card', className)}
      role="status"
      aria-label="Loading station"
    >
      <Skeleton rounded="sm" className="h-[200px] w-full rounded-none" />

      <div className="p-5">
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-4 h-4 w-1/2" />

        <div className="mb-4 flex gap-2">
          <Skeleton rounded="full" className="h-6 w-16" />
          <Skeleton rounded="full" className="h-6 w-16" />
        </div>

        <Skeleton className="mb-5 h-4 w-1/3" />
        <Skeleton rounded="lg" className="h-11 w-full" />
      </div>
    </div>
  )
}

export interface NavSkeletonProps {
  className?: string
}

export function NavSkeleton({ className }: NavSkeletonProps) {
  return (
    <div
      className={cn('flex h-16 items-center justify-between border-b border-slate-200 px-4', className)}
      role="status"
      aria-label="Loading navigation"
    >
      <Skeleton rounded="lg" className="h-8 w-28" />

      <div className="hidden items-center gap-6 md:flex">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="flex items-center gap-3">
        <Skeleton rounded="lg" className="h-9 w-20" />
        <Skeleton rounded="full" className="h-9 w-9" />
      </div>
    </div>
  )
}

export interface TextSkeletonProps {
  lines?: number
  lastLineWidth?: 'full' | '3/4' | '1/2'
  className?: string
}

const LAST_LINE_WIDTH: Record<NonNullable<TextSkeletonProps['lastLineWidth']>, string> = {
  full: 'w-full',
  '3/4': 'w-3/4',
  '1/2': 'w-1/2',
}

export function TextSkeleton({
  lines = 3,
  lastLineWidth = '3/4',
  className,
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading text">
      {Array.from({ length: Math.max(lines, 1) }, (_, index) => index).map((index, _, all) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === all.length - 1 ? LAST_LINE_WIDTH[lastLineWidth] : 'w-full')}
        />
      ))}
    </div>
  )
}
