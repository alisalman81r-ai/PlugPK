// src/components/auth/CheckYourEmail.tsx
'use client'

import { CheckCircle2, Loader2, Mail } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/Button'
import { resendVerificationEmail } from '@/lib/db/auth-actions'

/**
 * "Check your email" — shown after sign-up, and on the sign-in page when an
 * account has not been verified yet. One place for the resend control, so
 * both say the same thing and share the same cooldown.
 */
export function CheckYourEmail({
  email,
  sent = true,
  signInHref = '/login',
  heading = 'Check your email',
  onBack,
}: {
  email: string
  /** False when the first email could not be sent; the copy says so. */
  sent?: boolean
  signInHref?: string
  heading?: string
  /** When given, "Back to sign in" calls this instead of following a link. */
  onBack?: () => void
}) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)

  // A visible countdown, matching the server's one-minute gap between sends.
  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    setStatus('sending')
    setMessage(null)
    try {
      const result = await resendVerificationEmail(email)
      setStatus(result.ok ? 'done' : 'error')
      setMessage(result.message ?? null)
      if (result.ok) setCooldown(60)
    } catch {
      setStatus('error')
      setMessage('We could not reach the server. Check your connection and try again.')
    }
  }

  return (
    <div className="text-center" role="status" aria-live="polite">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-plug-blue-50 text-plug-blue-600">
        <Mail size={26} aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{heading}</h2>

      {sent ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          We sent a verification link to <span className="font-semibold text-slate-900">{email}</span>.
          Open it to verify your address, then sign in. The link works once and expires in 24 hours.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your account for <span className="font-semibold text-slate-900">{email}</span> is ready, but we could not
          send the verification email just now. Please try sending it again in a minute.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500">Not there? Check your spam or promotions folder.</p>

      {message ? (
        <p
          className={
            status === 'error'
              ? 'mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
              : 'mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800'
          }
        >
          {status === 'done' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => void resend()}
          disabled={status === 'sending' || cooldown > 0}
          className="w-full"
        >
          {status === 'sending' ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            'Resend verification email'
          )}
        </Button>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm font-semibold text-plug-blue-600 hover:underline">
            Back to sign in
          </button>
        ) : (
          <Link href={signInHref} className="text-sm font-semibold text-plug-blue-600 hover:underline">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  )
}
