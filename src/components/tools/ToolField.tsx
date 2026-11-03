// src/components/tools/ToolField.tsx
'use client'

import * as React from 'react'

import { FLABEL } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * A labelled number field for the EV tools, in landing-v2's .field / .input:
 * a mono uppercase label, a 54px field with the figure in JetBrains Mono, an
 * optional prefix (Rs) and unit (kWh, kW, / kWh), and an error line that
 * replaces the hint rather than stacking under it.
 */
export interface ToolFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  label: React.ReactNode
  /** Sentence-case label instead of the mono kicker. */
  plainLabel?: boolean
  prefix?: string
  unit?: string
  error?: string
  hint?: React.ReactNode
  className?: string
  inputClassName?: string
}

export const ToolField = React.forwardRef<HTMLInputElement, ToolFieldProps>(function ToolField(
  { label, plainLabel = false, prefix, unit, error, hint, className, inputClassName, id, ...input },
  ref,
) {
  const auto = React.useId()
  const fieldId = id ?? auto
  const noteId = `${fieldId}-note`
  const note = error ?? hint

  return (
    <div className={cn('grid gap-2', className)}>
      <label htmlFor={fieldId} className={plainLabel ? 'text-sm font-semibold text-ink' : FLABEL}>
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix ? (
          <span aria-hidden="true" className="pointer-events-none absolute left-4 font-mono text-sm font-medium text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={cn(
            'h-[54px] w-full appearance-none rounded-[14px] border-[1.5px] bg-white font-mono text-base font-semibold text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-fog focus:border-ink focus:shadow-focus [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            error ? 'border-[#FFB59C] focus:border-[#B42E05]' : 'border-ink/10 hover:border-ink/25',
            prefix ? 'pl-[46px]' : 'pl-4',
            unit ? (unit.length > 3 ? 'pr-[74px]' : 'pr-[58px]') : 'pr-4',
            inputClassName,
          )}
          {...input}
        />
        {unit ? (
          <span aria-hidden="true" className="pointer-events-none absolute right-4 font-mono text-sm font-medium text-muted">
            {unit}
          </span>
        ) : null}
      </div>
      {note ? (
        <p id={noteId} className={cn('text-[13px] leading-[1.5]', error ? 'text-[#B42E05]' : 'text-muted')}>
          {note}
        </p>
      ) : null}
    </div>
  )
})
