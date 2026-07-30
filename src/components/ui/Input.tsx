// src/components/ui/Input.tsx
'use client'

import { AlertCircle, CheckCircle2, Loader2, Search, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const FIELD_BASE =
  'w-full rounded-xl border-[1.5px] bg-white text-[15px] text-slate-900 transition-all duration-150 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const FIELD_FOCUS = 'border-slate-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'

const FIELD_ERROR =
  'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'

const FIELD_SUCCESS = 'border-green-500 focus:border-green-500'

/** Shared label / message block so Input and Textarea stay visually identical. */
function FieldMessage({
  id,
  error,
  success,
  hint,
}: {
  id: string
  error?: string
  success?: string
  hint?: string
}) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1 text-sm text-red-600">
        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        {error}
      </p>
    )
  }

  if (success) {
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1 text-sm text-green-600">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        {success}
      </p>
    )
  }

  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-sm text-slate-500">
        {hint}
      </p>
    )
  }

  return null
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    isLoading = false,
    className,
    id,
    disabled,
    ...rest
  },
  ref,
) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error ?? success ?? hint)

  // Loading takes the right slot, so it and rightIcon can never collide.
  const rightSlot = isLoading ? (
    <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
  ) : (
    rightIcon
  )

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
            {leftIcon}
          </span>
        ) : null}

        <input
          {...rest}
          ref={ref}
          id={inputId}
          disabled={disabled || isLoading}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            FIELD_BASE,
            'h-12 px-4',
            FIELD_FOCUS,
            error && FIELD_ERROR,
            !error && success && FIELD_SUCCESS,
            leftIcon && 'pl-11',
            rightSlot && 'pr-11',
            className,
          )}
        />

        {rightSlot ? (
          <span className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
            {rightSlot}
          </span>
        ) : null}
      </div>

      <FieldMessage id={messageId} error={error} success={success} hint={hint} />
    </div>
  )
})

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  isLoading?: boolean
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search city or station...',
  isLoading = false,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const handleClear = () => {
    if (onClear) {
      onClear()
      return
    }
    onChange('')
  }

  return (
    <div className={cn('relative w-full', className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
        <Search size={20} aria-hidden="true" />
      </span>

      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- opt-in via prop, used for the map search overlay
        autoFocus={autoFocus}
        className={cn(
          'h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-[15px] text-slate-900 shadow-lg transition-all duration-150',
          'placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
          // Hide the browser's own clear affordance so it cannot sit beside ours.
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />

      {isLoading ? (
        <span className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
        </span>
      ) : value.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center rounded-full text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X size={18} />
        </button>
      ) : null}
    </div>
  )
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, success, hint, className, id, ...rest },
  ref,
) {
  const generatedId = React.useId()
  const textareaId = id ?? generatedId
  const messageId = `${textareaId}-message`
  const hasMessage = Boolean(error ?? success ?? hint)

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}

      <textarea
        {...rest}
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          FIELD_BASE,
          'min-h-[120px] resize-y p-4',
          FIELD_FOCUS,
          error && FIELD_ERROR,
          !error && success && FIELD_SUCCESS,
          className,
        )}
      />

      <FieldMessage id={messageId} error={error} success={success} hint={hint} />
    </div>
  )
})
