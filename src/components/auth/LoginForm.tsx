// src/components/auth/LoginForm.tsx
'use client'

import { AlertCircle, Eye, EyeOff, Lock, Mail } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { signIn } from '@/lib/db/session-actions'
import { cn } from '@/lib/utils'
import { authHref } from './auth-links'
import { ALINK, ActionButton, ArrowEnd, LABEL } from './form-ui'
import { VerifyEmailForm } from './VerifyEmailForm'
import {
  EMAIL_PATTERN,
  FIELD_CLASS,
  FIELD_ERROR,
  FIELD_EYE,
  FIELD_ICON,
  FIELD_OK,
  FieldError,
} from './SignUpForm'

export interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(0)
  const [unverified, setUnverified] = React.useState<{ sent: boolean; notice?: string } | null>(null)
  const emailField = React.useRef<HTMLInputElement>(null)
  const passwordField = React.useRef<HTMLInputElement>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Enter a valid email address.')
      // page-auth.js: a refused submit puts the cursor in the first bad field.
      emailField.current?.focus()
      return
    }
    if (password.length === 0) {
      setFieldError('Enter your password.')
      passwordField.current?.focus()
      return
    }

    setFieldError(null)
    setError(null)
    setIsLoading(true)

    // Was a 2 second timer that accepted one hardcoded demo account and
    // rejected every real one. This checks the password against the scrypt
    // hash on the User row and issues a signed session cookie.
    const form = new FormData()
    form.set('email', email.trim())
    form.set('password', password)

    // A thrown action (a dropped connection, a deploy mid-request) must still
    // stop the spinner and say something, rather than leave the form busy.
    let result: Awaited<ReturnType<typeof signIn>>
    try {
      result = await signIn(form)
    } catch {
      result = { ok: false, message: 'We could not reach the server. Check your connection and try again.' }
    }
    setIsLoading(false)

    if (result.ok) {
      onSuccess?.()
      /*
        The server picks the destination when it has one.

        An operator account is sent to /admin, and that decision is made from
        the row that was just authenticated — never from anything this
        component can see. There is no isAdmin in the browser to read, and no
        query parameter to forge: the form is handed a path and follows it.

        Falls back to redirectTo, which is the ?redirect= a gated page sent us
        to, or /dashboard. A normal sign-in returns no destination, so nothing
        about the existing flow changes.
      */
      router.push(result.redirectTo ?? redirectTo)
      // Without this the destination renders the router's cached copy, which
      // was produced while signed out.
      router.refresh()
      return
    }

    if (result.unverified) {
      setUnverified({ sent: result.emailSent === true, notice: result.message })
      return
    }

    setError(result.message ?? 'Incorrect email or password')
    setAttempts((count) => count + 1)
  }

  if (unverified) {
    return (
      <VerifyEmailForm
        email={email.trim().toLowerCase()}
        sent={unverified.sent}
        notice={unverified.notice}
        onBack={() => setUnverified(null)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-[18px]">
        <label htmlFor="login-email" className={LABEL}>
          Email address
        </label>
        <div className="relative">
          <Mail size={18} className={FIELD_ICON} aria-hidden="true" />
          <input
            ref={emailField}
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            className={cn(FIELD_CLASS, error ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className={LABEL}>
          Password
        </label>
        <div className="relative">
          <Lock size={18} className={FIELD_ICON} aria-hidden="true" />
          <input
            ref={passwordField}
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
            aria-pressed={showPassword}
            className={FIELD_EYE}
          >
            {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        </div>
        <FieldError message={fieldError ?? undefined} />
      </div>

      {/*
        "Remember me" was removed rather than wired: it was never sent to the
        server, so ticking it changed nothing. Every session lasts fourteen
        days on this browser, and the line below says so instead.
      */}
      <div className="mb-6 mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[13px] text-muted">You stay signed in on this device for 14 days.</p>
        <Link href={authHref('/forgot-password', redirectTo)} className={cn(ALINK, 'py-2.5 text-sm')}>
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#B42E05]" aria-hidden="true" />
          <span className="text-sm text-[#B42E05]">
            {error}
            {attempts >= 3 ? (
              <span className="mt-1 block">
                <Link href={authHref('/forgot-password', redirectTo)} className={ALINK}>
                  Forgotten it? Reset your password by email
                </Link>
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      <ActionButton type="submit" size="lg" fullWidth isLoading={isLoading}>
        {isLoading ? 'Signing you in…' : 'Sign in'}
        {isLoading ? null : <ArrowEnd />}
      </ActionButton>

      <p className="mt-6 text-center text-[15px] text-muted">
        Don&apos;t have an account?{' '}
        <Link href={authHref('/signup', redirectTo)} className={ALINK}>
          Create one
        </Link>
      </p>
    </form>
  )
}
