// src/components/auth/PasswordResetFlow.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button, MorphIcon } from '@/components/ui'
import { ArrowRight, Eye, EyeOff, Lock, Mail, RefreshCw } from '@/components/ui/icons'
import { requestPasswordReset, resetPasswordWithCode } from '@/lib/db/auth-actions'
import { cn } from '@/lib/utils'

import {
  EMAIL_PATTERN,
  FIELD_CLASS,
  FIELD_ERROR,
  FIELD_OK,
  FieldError,
  PASSWORD_PATTERN,
  PasswordStrength,
} from './SignUpForm'

const OFFLINE = 'We could not reach the server. Check your connection and try again.'

function Notice({ tone, children }: { tone: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mt-5 rounded-xl border px-4 py-3 text-sm',
        tone === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700',
      )}
    >
      {children}
    </p>
  )
}

/**
 * Forgotten password, in two steps on one screen: the address, then the
 * emailed code with a new password. Step two can also be opened directly
 * (/reset-password?email=…) by someone who already has a code.
 *
 * Step two is shown whatever the server says about the address, so the
 * screen never reveals whether it has an account.
 */
export function PasswordResetFlow({ initialEmail = '', startAtCode = false }: { initialEmail?: string; startAtCode?: boolean }) {
  const router = useRouter()
  const [step, setStep] = React.useState<'email' | 'code'>(startAtCode && initialEmail ? 'code' : 'email')
  const [email, setEmail] = React.useState(initialEmail)
  const [code, setCode] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [note, setNote] = React.useState<string | null>(null)

  const address = email.trim().toLowerCase()

  const sendCode = async () => {
    if (!EMAIL_PATTERN.test(address)) {
      setFieldError('Enter a valid email address.')
      return false
    }
    setFieldError(null)
    setError(null)
    setNote(null)
    setSending(true)
    try {
      const result = await requestPasswordReset(address)
      if (result.ok) setNote(result.message)
      else setError(result.message)
      setSending(false)
      return result.ok
    } catch {
      setError(OFFLINE)
      setSending(false)
      return false
    }
  }

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await sendCode()) {
      setCode('')
      setStep('code')
    }
  }

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault()
    const digits = code.replace(/\D/g, '')
    if (digits.length !== 6) return setFieldError('Enter the 6-digit code from the email.')
    if (!PASSWORD_PATTERN.test(password)) return setFieldError('Use at least 8 characters with a letter and a number.')
    setFieldError(null)
    setError(null)
    setNote(null)
    setBusy(true)
    let result: Awaited<ReturnType<typeof resetPasswordWithCode>>
    try {
      result = await resetPasswordWithCode(address, digits, password)
    } catch {
      result = { ok: false, message: OFFLINE }
    }
    if (result.ok && result.redirectTo) {
      router.push(result.redirectTo)
      router.refresh()
      return
    }
    setBusy(false)
    setError(result.message ?? 'That did not work. Please try again.')
    if (result.needsNewCode) setCode('')
  }

  if (step === 'email') {
    return (
      <form onSubmit={submitEmail} noValidate>
        <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ahmed@example.com"
            autoComplete="email"
            aria-invalid={fieldError ? true : undefined}
            className={cn(FIELD_CLASS, fieldError ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        <FieldError message={fieldError ?? undefined} />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button type="submit" size="lg" fullWidth isLoading={sending} className="mt-6">
          Email me a reset code
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={submitReset} noValidate>
      <p className="text-ui leading-relaxed text-slate-600">
        Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{address}</span>, then
        choose a new password. The code expires in 10 minutes.
      </p>

      <label htmlFor="reset-code" className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
        Reset code
      </label>
      <input
        id="reset-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="123456"
        className={cn(FIELD_CLASS, 'pl-4 pr-4 text-center font-mono text-2xl tracking-[0.5em]', FIELD_OK)}
      />

      <label htmlFor="reset-password" className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
        New password
      </label>
      <div className="relative">
        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="reset-password"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Choose a strong password"
          autoComplete="new-password"
          className={cn(FIELD_CLASS, FIELD_OK)}
        />
        <button
          type="button"
          onClick={() => setShow((shown) => !shown)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-700"
        >
          <MorphIcon active={show} on={EyeOff} off={Eye} size={18} />
        </button>
      </div>
      <PasswordStrength password={password} />
      <FieldError message={fieldError ?? undefined} />

      {error ? <Notice tone="error">{error}</Notice> : null}
      {note ? <Notice tone="ok">{note}</Notice> : null}

      <Button type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">
        Set new password
        <ArrowRight size={18} aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        isLoading={sending}
        onClick={async () => {
          if (await sendCode()) setCode('')
        }}
        className="mt-3"
      >
        <RefreshCw size={18} aria-hidden="true" />
        Send a new code
      </Button>
      <p className="mt-6 text-center text-sm text-slate-500">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
            setNote(null)
            setFieldError(null)
          }}
          className="font-semibold text-plug-blue-600 hover:underline"
        >
          Use a different email
        </button>
      </p>
    </form>
  )
}
