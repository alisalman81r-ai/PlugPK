// src/components/ui/Input.tsx
'use client'

import { Check, Search, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  rightElement?: React.ReactNode
  variant?: 'default' | 'search' | 'filled'
  inputSize?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  onClear?: () => void
  showClear?: boolean
}

const SIZE_CLASSES: Record<NonNullable<InputProps['inputSize']>, string> = {
  sm: 'h-10 rounded-[6px] text-sm',
  md: 'h-12 rounded-[8px] text-[15px]',
  lg: 'h-14 rounded-[10px] text-base',
}

const VARIANT_CLASSES: Record<NonNullable<InputProps['variant']>, string> = {
  default: 'border-[1.5px] border-slate-200 bg-white',
  search: 'border-[1.5px] border-slate-200 bg-slate-50 focus:shadow-lg',
  filled: 'border-[1.5px] border-transparent bg-slate-100 focus:bg-white',
}

const ICON_SIZE = 18

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    rightElement,
    variant = 'default',
    inputSize = 'md',
    isLoading = false,
    onClear,
    showClear = false,
    className,
    id,
    disabled,
    value,
    defaultValue,
    onChange,
    ...props
  },
  ref,
) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  // The clear button needs to know whether the field has content in both
  // controlled and uncontrolled usage.
  const isControlled = value !== undefined
  const [uncontrolledHasValue, setUncontrolledHasValue] = React.useState(
    () => defaultValue !== undefined && String(defaultValue).length > 0,
  )
  const hasValue = isControlled ? String(value).length > 0 : uncontrolledHasValue

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledHasValue(event.target.value.length > 0)
      }
      onChange?.(event)
    },
    [isControlled, onChange],
  )

  const isDisabled = disabled || isLoading
  const resolvedLeftIcon = leftIcon ?? (variant === 'search' ? <Search size={ICON_SIZE} /> : null)
  const showClearButton = showClear && hasValue && !isDisabled

  // A single right-hand slot with a fixed precedence, so two indicators can
  // never overlap: loading, then caller-supplied element, then clear, then the
  // success tick, then a plain icon.
  let rightSlot: React.ReactNode = null
  // Interactive slots must keep pointer events; decorative ones let clicks fall
  // through to the input underneath.
  let rightSlotIsInteractive = false
  if (isLoading) {
    rightSlot = <Spinner size={ICON_SIZE} className="text-slate-400" />
  } else if (rightElement) {
    rightSlot = rightElement
    rightSlotIsInteractive = true
  } else if (showClearButton) {
    rightSlotIsInteractive = true
    rightSlot = (
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear input"
        className="inline-flex text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        <X size={16} />
      </button>
    )
  } else if (success) {
    rightSlot = <Check size={ICON_SIZE} className="text-green-500" />
  } else if (rightIcon) {
    rightSlot = rightIcon
  }

  const message = error ?? success ?? hint

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {resolvedLeftIcon ? (
          <span className="pointer-events-none absolute left-[14px] top-1/2 flex -translate-y-1/2 items-center text-slate-400">
            {resolvedLeftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={isDisabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            'w-full text-slate-900 transition-all duration-150 placeholder:text-slate-400 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            SIZE_CLASSES[inputSize],
            VARIANT_CLASSES[variant],
            variant === 'search' && 'rounded-xl',
            'px-4',
            resolvedLeftIcon && 'pl-11',
            rightSlot && 'pr-11',
            // Focus ring, then error / success which must win over it.
            'focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            error &&
              'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]',
            !error &&
              success &&
              'border-green-400 focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.12)]',
            className,
          )}
          {...props}
        />

        {rightSlot ? (
          <span
            className={cn(
              'absolute right-[14px] top-1/2 flex -translate-y-1/2 items-center',
              !rightSlotIsInteractive && 'pointer-events-none',
            )}
          >
            {rightSlot}
          </span>
        ) : null}
      </div>

      {message ? (
        <p
          id={messageId}
          className={cn(
            'mt-1.5',
            error
              ? 'text-sm text-red-600'
              : success
                ? 'text-sm text-green-600'
                : 'text-xs text-slate-500',
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
})
