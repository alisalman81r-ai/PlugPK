// src/components/admin/AdminField.tsx
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Field chrome and input styling for every admin form — the design's `.fld`
 * (label over control) and `.in` (52px, 14px radius, ink border and volt ring
 * on focus).
 *
 * Every control has a real <label> tied by id, and required is marked in text
 * as well as with an asterisk.
 *
 * FIELD_CLASS / TEXTAREA_CLASS are the `.in` look as Tailwind, so a form can
 * still add or override a utility through cn().
 */
export const FIELD_CLASS =
  'h-[52px] w-full rounded-[14px] border-[1.5px] border-ink/[0.09] bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-[0_0_0_4px_rgba(212,255,58,0.45)] disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted aria-[invalid=true]:border-ember'

export const TEXTAREA_CLASS =
  'min-h-[140px] w-full resize-y rounded-[14px] border-[1.5px] border-ink/[0.09] bg-white px-4 py-3.5 text-base leading-relaxed text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-[0_0_0_4px_rgba(212,255,58,0.45)] aria-[invalid=true]:border-ember'

export interface AdminFieldProps {
  label: string
  htmlFor: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  /** A validation message, shown in the design's `.ferr`. */
  error?: string | null
}

export function AdminField({ label, htmlFor, hint, required = false, children, className, error }: AdminFieldProps) {
  return (
    <div className={cn('fld', error && 'is-bad', className)}>
      <label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="freq" aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className="fnote"> optional</span>
        )}
      </label>
      {children}
      {hint ? <p className="fhint">{hint}</p> : null}
      {error ? (
        <p className="ferr" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
