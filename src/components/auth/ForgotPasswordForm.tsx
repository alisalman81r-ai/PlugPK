// src/components/auth/ForgotPasswordForm.tsx
'use client'

import { Mail } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AuthHeader } from './AuthHeader'
import { EMAIL_PATTERN, FIELD_CLASS, FIELD_ERROR, FIELD_OK, FieldError } from './SignUpForm'

const RESEND_COOLDOWN = 60

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setError(null)
    setIsLoading(true)
    // Stands in for the reset-email API.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubmitted(true)
    setCooldown(RESEND_COOLDOWN)
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setCooldown(RESEND_COOLDOWN)
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <span className="mb-6 inline-flex rounded-3xl bg-blue-50 p-4">
          <Mail size={56} className="text-plug-blue-600" aria-hidden="true" />
        </span>

        <h1 className="text-2xl font-black text-slate-900">Check your email</h1>

        <p className="mt-2 text-slate-500">
          We sent a reset link to{' '}
          <span className="font-medium text-slate-900">{email.trim()}</span>
          <br />
          Check your inbox and spam folder.
        </p>

        <p className="mt-8 text-sm text-slate-500">
          Didn&apos;t receive it?{' '}
          {cooldown > 0 ? (
            <span className="text-slate-400">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="font-medium text-plug-blue-600 hover:underline disabled:opacity-60"
            >
              Resend email
            </button>
          )}
        </p>

        <p className="mt-4">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900">
            &larr; Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthHeader
        title="Forgot your password?"
        subtitle="Enter your email and we will send you a reset link."
      />

      <div className="mb-6">
        <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ahmed@example.com"
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            className={cn(FIELD_CLASS, error ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        <FieldError message={error ?? undefined} />
      </div>

      <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
        Send Reset Link
      </Button>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Back to sign in
        </Link>
      </p>
    </form>
  )
}
