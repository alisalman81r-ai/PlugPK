// src/components/auth/VerifyEmailPanel.tsx
'use client'

import { AlertCircle, CheckCircle2, Loader2, Mail } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/Button'
import { confirmEmail, resendVerificationEmail } from '@/lib/db/auth-actions'
import type { TokenState } from '@/lib/db/email-verification'

/**
 * What /verify-email shows, for each state a link can be in.
 *
 * A valid link is confirmed with a button press, not on page load. Mail
 * providers and security scanners open links in emails to check them; if
 * merely loading the page used the token, a scanner would spend it before the
 * person ever clicked, and they would see "this link has already been used".
 */
export function VerifyEmailPanel({ token, initialState }: { token: string; initialState: TokenState | 'missing' }) {
  const [state, setState] = React.useState<TokenState | 'missing' | 'verified'>(initialState)
  const [isPending, startTransition] = React.useTransition()

  const confirm = () => {
    startTransition(async () => {
      try {
        const { result } = await confirmEmail(token)
        setState(result)
      } catch {
        setState('invalid')
      }
    })
  }

  if (state === 'verified') {
    return (
      <Panel icon="ok" title="Email verified">
        <p>Thanks — your email address is confirmed. You can sign in to your Plug.pk account now.</p>
        <Button href="/login" size="lg" className="mt-6 w-full">
          Sign in
        </Button>
      </Panel>
    )
  }

  if (state === 'valid') {
    return (
      <Panel icon="mail" title="Confirm your email address">
        <p>Press the button to confirm this address belongs to you and finish setting up your account.</p>
        <Button type="button" size="lg" onClick={confirm} disabled={isPending} className="mt-6 w-full">
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying…
            </>
          ) : (
            'Verify my email'
          )}
        </Button>
      </Panel>
    )
  }

  return (
    <Panel
      icon="warn"
      title={state === 'expired' ? 'This link has expired' : 'This link is not valid'}
    >
      <p>
        {state === 'expired'
          ? 'Verification links work for 24 hours. Enter your email below and we will send you a new one.'
          : state === 'missing'
            ? 'Open the verification link from your email to verify your address, or ask for a new one below.'
            : 'It may have been used already, or replaced by a newer link. If your email is already verified, just sign in. Otherwise, ask for a new link below.'}
      </p>
      <ResendForm />
      <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-plug-blue-600 hover:underline">
        Go to sign in
      </Link>
    </Panel>
  )
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: 'ok' | 'mail' | 'warn'
  title: string
  children: React.ReactNode
}) {
  const Icon = icon === 'ok' ? CheckCircle2 : icon === 'mail' ? Mail : AlertCircle
  const tone =
    icon === 'ok'
      ? 'bg-emerald-50 text-emerald-600'
      : icon === 'mail'
        ? 'bg-plug-blue-50 text-plug-blue-600'
        : 'bg-amber-50 text-amber-600'
  return (
    <div className="text-center" role="status" aria-live="polite">
      <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

/** Asks for a new link. The reply is the same whether or not the address has an account. */
function ResendForm() {
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const result = await resendVerificationEmail(email)
        setMessage({ ok: result.ok, text: result.message ?? '' })
      } catch {
        setMessage({ ok: false, text: 'We could not reach the server. Check your connection and try again.' })
      }
    })
  }

  return (
    <form onSubmit={submit} className="mt-6 text-left" noValidate>
      <label htmlFor="resend-email" className="mb-2 block text-sm font-semibold text-slate-700">
        Email address
      </label>
      <input
        id="resend-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus"
      />
      {message ? (
        <p
          className={
            message.ok
              ? 'mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
          }
        >
          {message.text}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" size="lg" disabled={isPending || !email.trim()} className="mt-4 w-full">
        {isPending ? 'Sending…' : 'Send a new link'}
      </Button>
    </form>
  )
}
