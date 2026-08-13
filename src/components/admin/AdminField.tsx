// src/components/admin/AdminField.tsx
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Shared field chrome and input styling for every admin form.
 *
 * Two rules this enforces by construction:
 *
 *   Every control has a real <label> tied by id. Placeholder-as-label breaks
 *   for screen readers and vanishes the moment someone starts typing, which
 *   is exactly when a half-filled form needs it most.
 *
 *   Required is marked in text as well as with an asterisk, so it does not
 *   depend on noticing a small red glyph.
 */
export const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-slate-50'

export const TEXTAREA_CLASS =
  'w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus'

export interface AdminFieldProps {
  label: string
  htmlFor: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function AdminField({
  label,
  htmlFor,
  hint,
  required = false,
  children,
  className,
}: AdminFieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-ui-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-ui-xs font-normal text-slate-400">optional</span>
        )}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-ui-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
