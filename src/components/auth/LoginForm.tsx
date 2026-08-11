// src/components/auth/LoginForm.tsx
'use client'

import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  Checkbox,
  EMAIL_PATTERN,
  FIELD_CLASS,
  FIELD_ERROR,
  FIELD_OK,
  FieldError,
} from './SignUpForm'

export interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

const DEMO_EMAIL = 'demo@plug.pk'
const DEMO_PASSWORD = 'demo123'

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    if (password.length === 0) {
      setFieldError('Enter your password.')
      return
    }

    setFieldError(null)
    setError(null)
    setIsLoading(true)
    // Stands in for the sign-in API.
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)

    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      onSuccess?.()
      router.push(redirectTo)
      return
    }

    setError('Incorrect email or password')
    setAttempts((count) => count + 1)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-5">
        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ahmed@example.com"
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            className={cn(FIELD_CLASS, error ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            className={cn(FIELD_CLASS, error ? FIELD_ERROR : FIELD_OK)}
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
        <FieldError message={fieldError ?? undefined} />
      </div>

      <div className="mb-6 mt-4 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5">
          <Checkbox id="remember" checked={rememberMe} onChange={setRememberMe} />
          <label htmlFor="remember" className="text-sm text-slate-600">
            Remember me
          </label>
        </span>

        <Link
          href="/forgot-password"
          className="text-sm font-medium text-plug-blue-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
          <span className="text-sm text-red-700">
            {error}
            {attempts >= 3 ? (
              <span className="mt-1 block">
                Having trouble?{' '}
                <Link href="/forgot-password" className="text-plug-blue-600 hover:underline">
                  Reset your password
                </Link>
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
        Sign In
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-plug-blue-600 hover:underline">
          Create one free
        </Link>
      </p>
    </form>
  )
}
