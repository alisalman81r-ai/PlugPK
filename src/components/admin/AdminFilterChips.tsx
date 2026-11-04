// src/components/admin/AdminFilterChips.tsx
import Link from 'next/link'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { buildHref, type ListParams } from './list-params'

export interface FilterOption {
  value: string
  label: React.ReactNode
  /** Rows behind the chip, when the page knows it. */
  count?: number
  /** An icon before the label (the design's segmented tabs carry one). */
  icon?: React.ReactNode
}

export interface AdminFilterChipsProps {
  /** Names the group for screen readers. */
  label: string
  /** Query-string key this group sets. */
  param: string
  options: FilterOption[]
  /** The value in the URL now; `all` when absent. */
  current: string
  path: string
  params: ListParams
  /**
   * `chips` — the design's `.chips`: round pills, an ink fill when chosen.
   * `seg` — the design's `.seg`: a segmented control on a chalk track.
   */
  variant?: 'chips' | 'seg'
  /** A mono kicker before the chips (`.chips__lab`), e.g. "Venue". */
  heading?: string
  /** Value that means "no filter": its link drops the parameter. */
  defaultValue?: string
  className?: string
}

/**
 * A row of filter chips that are links.
 *
 * Each chip is a URL with one parameter changed, so the server reads the
 * filtered page and nothing filters in the browser. A chip carries its count
 * when the page has one; as in the design, a chip with nothing behind it is
 * dimmed and cannot be chosen (unless it is the one in force).
 */
export function AdminFilterChips({
  label,
  param,
  options,
  current,
  path,
  params,
  variant = 'chips',
  heading,
  defaultValue,
  className,
}: AdminFilterChipsProps) {
  return (
    <div role="group" aria-label={label} className={cn(variant === 'seg' ? 'seg' : 'chips', className)}>
      {heading && variant === 'chips' ? <span className="chips__lab">{heading}</span> : null}
      {options.map((option) => {
        const on = current === option.value
        const body = (
          <>
            {option.icon}
            {option.label}
            {option.count !== undefined ? <span className="c">{option.count.toLocaleString('en-PK')}</span> : null}
          </>
        )
        if (option.count === 0 && !on && variant === 'chips') {
          return (
            <span key={option.value} className="chip" aria-disabled="true">
              {body}
            </span>
          )
        }
        return (
          <Link
            key={option.value}
            className="chip"
            href={buildHref(path, params, {
              [param]: defaultValue !== undefined && option.value === defaultValue ? undefined : option.value,
            })}
            aria-current={on ? 'true' : undefined}
            scroll={false}
          >
            {body}
          </Link>
        )
      })}
    </div>
  )
}
