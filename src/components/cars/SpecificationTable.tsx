// src/components/cars/SpecificationTable.tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A label/value table, used by the detail page for every spec block.
 *
 * Takes rows that have already been filtered to the ones with values — see
 * fullSpecs() in lib/cars — so this never has to decide whether a blank means
 * "unknown" or "zero". A table that renders "—" for a missing figure invites the
 * reader to treat the gap as data.
 *
 * A <dl> rather than a <table>: these are name/value pairs, not a grid with
 * meaningful rows and columns, and a definition list is what a screen reader
 * announces correctly.
 */

export interface SpecRow {
  label: string
  value: string
}

export interface SpecificationTableProps {
  rows: SpecRow[]
  /** Heading above the block. Omit for an unlabelled table. */
  title?: string
  className?: string
}

export function SpecificationTable({ rows, title, className }: SpecificationTableProps) {
  if (rows.length === 0) return null

  return (
    <div className={className}>
      {/* The display face at full ink, matching the comparison's group
          headings — the same words label the same figures in both places, so
          they should carry the same weight. */}
      {title ? (
        <p className="mb-4 font-display text-lg font-bold tracking-tight text-slate-900">
          {title}
        </p>
      ) : null}

      <dl className="flex flex-col">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              'flex items-baseline justify-between gap-6 py-3',
              index > 0 && 'border-t border-slate-100',
            )}
          >
            <dt className="shrink-0 text-ui-sm text-slate-500">{row.label}</dt>
            <dd className="min-w-0 text-right text-ui-sm font-semibold text-slate-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
