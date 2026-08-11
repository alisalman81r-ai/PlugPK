// src/components/auth/ResetPasswordForm.tsx
'use client'

import { Check, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AuthHeader } from './AuthHeader'
import {
  FIELD_CLASS,
  FIELD_ERROR,
  FIELD_OK,
  FieldError,
  PASSWORD_PATTERN,
  PasswordStrength,
} from './SignUpForm'

const FIELD_SUCCESS = 'border-green-400 focus:border-green-400'

export function ResetPasswordForm() {
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [touchedConfirm, setTouchedConfirm] = React.useState(false)
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({})

  const matches = password.length > 0 && password === confirmPassword
  const mismatch = touchedConfirm && confirmPassword.length > 0 && !matches
  const canSubmit = PASSWORD_PATTERN.test(password) && matches && !isLoading

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const next: { password?: string; confirm?: string } = {}
    if (!PASSWORD_PATTERN.test(password))
      next.password = 'Use at least 8 characters with a letter and a number.'
    if (!matches) next.confirm = 'Passwords do not match'

    setErrors(next)
    setTouchedConfirm(true)
    if (Object.keys(next).length > 0) return

    setIsLoading(true)
    // Stands in for the password-reset API.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="animate-scale-in text-center">
        <CheckCircle2 size={56} className="mx-auto text-green-500" aria-hidden="true" />
        <h1 className="mt-6 text-2xl font-black text-slate-900">Password updated!</h1>
        <p className="mt-2 text-slate-500">You can now sign in with your new password.</p>
        <div className="mt-8">
          <Button href="/login" size="lg" fullWidth>
            Sign In Now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthHeader
        title="Create new password"
        subtitle="Choose a strong password for your account."
      />

      <div className="mb-5">
        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
          New Password
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            className={cn(FIELD_CLASS, errors.password ? FIELD_ERROR : FIELD_OK)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordStrength password={password} />
        <FieldError message={errors.password} />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Confirm Password
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={() => setTouchedConfirm(true)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-invalid={mismatch ? true : undefined}
            className={cn(
              FIELD_CLASS,
              'pr-20',
              mismatch ? FIELD_ERROR : matches ? FIELD_SUCCESS : FIELD_OK,
            )}
          />

          <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {matches ? (
              <Check size={18} className="text-green-500" aria-label="Passwords match" />
            ) : null}
            <button
              type="button"
              onClick={() => setShowConfirm((shown) => !shown)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="text-slate-400 transition-colors hover:text-slate-700"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </div>
        <FieldError message={mismatch ? 'Passwords do not match' : errors.confirm} />
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={!canSubmit}
        className="mt-6"
      >
        Update Password
      </Button>
    </form>
  )
}
