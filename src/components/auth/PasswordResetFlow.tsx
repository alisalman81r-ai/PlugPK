// src/components/auth/PasswordResetFlow.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Eye, EyeOff, Lock, Mail, RefreshCw } from '@/components/ui/icons'
import { requestPasswordReset, resetPasswordWithCode } from '@/lib/db/auth-actions'
import { cn } from '@/lib/utils'

import { ALINK, ActionButton, ArrowEnd, LABEL, Notice } from './form-ui'
import {
  EMAIL_PATTERN,
  FIELD_CLASS,
  FIELD_ERROR,
  FIELD_EYE,
  FIELD_ICON,
  FIELD_OK,
  FieldError,
  PASSWORD_PATTERN,
  PasswordStrength,
} from './SignUpForm'

const OFFLINE = 'We could not reach the server. Check your connection and try again.'

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
        <label htmlFor="reset-email" className={LABEL}>
          Email address
        </label>
        <div className="relative">
          <Mail size={18} className={FIELD_ICON} aria-hidden="true" />
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={fieldError ? true : undefined}
            className={cn(FIELD_CLASS, fieldError ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        <FieldError message={fieldError ?? undefined} />
        {error ? (
          <Notice tone="error" className="mt-5">
            {error}
          </Notice>
        ) : null}
        <ActionButton type="submit" size="lg" fullWidth isLoading={sending} className="mt-6">
          Email me a reset code
          {sending ? null : <ArrowEnd />}
        </ActionButton>
      </form>
    )
  }

  return (
    <form onSubmit={submitReset} noValidate>
      <p className="text-[15px] leading-relaxed text-muted">
        Enter the 6-digit code sent to <span className="font-semibold text-ink">{address}</span>, then choose a new
        password. The code expires in 10 minutes.
      </p>

      <label htmlFor="reset-code" className={`${LABEL} mt-6`}>
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

      <label htmlFor="reset-password" className={`${LABEL} mt-[18px]`}>
        New password
      </label>
      <div className="relative">
        <Lock size={18} className={FIELD_ICON} aria-hidden="true" />
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
          aria-pressed={show}
          className={FIELD_EYE}
        >
          {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      <PasswordStrength password={password} />
      <FieldError message={fieldError ?? undefined} />

      {error ? (
        <Notice tone="error" className="mt-5">
          {error}
        </Notice>
      ) : null}
      {note ? (
        <Notice tone="ok" className="mt-5">
          {note}
        </Notice>
      ) : null}

      <ActionButton type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">
        Set new password
        {busy ? null : <ArrowEnd />}
      </ActionButton>
      <ActionButton
        tone="line"
        size="lg"
        fullWidth
        isLoading={sending}
        leftIcon={<RefreshCw size={18} aria-hidden="true" />}
        onClick={async () => {
          if (await sendCode()) setCode('')
        }}
        className="mt-3"
      >
        Send a new code
      </ActionButton>
      <p className="mt-6 text-center text-[15px] text-muted">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
            setNote(null)
            setFieldError(null)
          }}
          className={`${ALINK} min-h-11`}
        >
          Use a different email
        </button>
      </p>
    </form>
  )
}
