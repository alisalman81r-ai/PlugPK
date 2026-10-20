// src/components/auth/VerifyEmailForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { ArrowRight, Mail, RefreshCw } from '@/components/ui/icons'
import { resendVerification, verifyEmailCode } from '@/lib/db/auth-actions'
import { cn } from '@/lib/utils'

import { FIELD_CLASS, FIELD_ERROR, FIELD_OK } from './SignUpForm'

/**
 * Enter the six-digit code from the email. Shown after sign-up, when an
 * unconfirmed account signs in, and on /verify-email. The account can do
 * nothing until the code is entered, so this is the whole of what the person
 * can do next: enter it, ask for another, or start again with another address.
 */
export function VerifyEmailForm({
  email,
  sent,
  notice,
  onBack,
}: {
  email: string
  /** Whether the code email went out. False shows the failure and the resend. */
  sent: boolean
  /** The server's message about the send, shown until the first action. */
  notice?: string
  onBack?: () => void
}) {
  const router = useRouter()
  const [code, setCode] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(sent ? null : notice ?? null)
  const [note, setNote] = React.useState<string | null>(null)

  const verify = async (event: React.FormEvent) => {
    event.preventDefault()
    const digits = code.replace(/\D/g, '')
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from the email.')
      return
    }
    setBusy(true)
    setError(null)
    setNote(null)
    let result: Awaited<ReturnType<typeof verifyEmailCode>>
    try {
      result = await verifyEmailCode(email, digits)
    } catch {
      result = { ok: false, message: 'We could not reach the server. Check your connection and try again.' }
    }
    if (result.redirectTo) {
      router.push(result.redirectTo)
      router.refresh()
      return
    }
    setBusy(false)
    setError(result.message ?? 'That did not work. Please try again.')
    if (result.needsNewCode) setCode('')
  }

  const resend = async () => {
    setSending(true)
    setError(null)
    setNote(null)
    try {
      const result = await resendVerification(email)
      if (result.ok) setNote(result.message)
      else setError(result.message)
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    }
    setCode('')
    setSending(false)
  }

  return (
    <form onSubmit={verify} noValidate>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-plug-blue-50 text-plug-blue-600">
        <Mail size={24} aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Enter your code</h2>
      <p className="mt-2 text-ui leading-relaxed text-slate-600">
        {sent ? 'We sent a 6-digit code to ' : 'Your code goes to '}
        <span className="font-semibold text-slate-900">{email}</span>. Your account stays inactive until you
        enter it.
      </p>
      <p className="mt-2 text-ui-sm text-slate-500">
        It expires in 10 minutes. Nothing there? Check spam or promotions, then send a new one.
      </p>

      <label htmlFor="verify-code" className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
        Verification code
      </label>
      <input
        id="verify-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="123456"
        aria-invalid={error ? true : undefined}
        className={cn(
          FIELD_CLASS,
          'pl-4 pr-4 text-center font-mono text-2xl tracking-[0.5em]',
          error ? FIELD_ERROR : FIELD_OK,
        )}
      />

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {note}
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">
        Verify email
        <ArrowRight size={18} aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        isLoading={sending}
        onClick={resend}
        className="mt-3"
      >
        <RefreshCw size={18} aria-hidden="true" />
        Send a new code
      </Button>

      {onBack ? (
        <p className="mt-6 text-center text-sm text-slate-500">
          <button type="button" onClick={onBack} className="font-semibold text-plug-blue-600 hover:underline">
            Use a different email
          </button>
        </p>
      ) : null}
    </form>
  )
}
