// src/components/auth/CheckEmailPanel.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui'
import { Mail, RefreshCw } from '@/components/ui/icons'
import { resendVerification } from '@/lib/db/auth-actions'

/**
 * "Check your email", shown after sign-up and when an unverified account
 * tries to sign in. The account does nothing until the link is opened, so this
 * is the whole of what the person can do next: open it, or ask for another.
 */
export function CheckEmailPanel({ email, onBack }: { email: string; onBack?: () => void }) {
  const [busy, setBusy] = React.useState(false)
  const [note, setNote] = React.useState<{ ok: boolean; text: string } | null>(null)

  const resend = async () => {
    setBusy(true)
    setNote(null)
    try {
      const result = await resendVerification(email)
      setNote({ ok: result.ok, text: result.message })
    } catch {
      setNote({ ok: false, text: 'We could not reach the server. Check your connection and try again.' })
    }
    setBusy(false)
  }

  return (
    <div role="status">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-plug-blue-50 text-plug-blue-600">
        <Mail size={24} aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Check your email</h2>
      <p className="mt-2 text-ui leading-relaxed text-slate-600">
        We sent a link to <span className="font-semibold text-slate-900">{email}</span>. Open it to confirm
        your address — your account stays inactive until you do.
      </p>
      <p className="mt-3 text-ui-sm text-slate-500">
        The link expires in 24 hours. Nothing there? Check spam or promotions, then send another.
      </p>

      {note ? (
        <p
          className={
            note.ok
              ? 'mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800'
              : 'mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
          }
        >
          {note.text}
        </p>
      ) : null}

      <Button type="button" variant="secondary" size="lg" fullWidth isLoading={busy} onClick={resend} className="mt-6">
        <RefreshCw size={18} aria-hidden="true" />
        Send a new link
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        {onBack ? (
          <button type="button" onClick={onBack} className="font-semibold text-plug-blue-600 hover:underline">
            Use a different email
          </button>
        ) : (
          <Link href="/login" className="font-semibold text-plug-blue-600 hover:underline">
            Back to sign in
          </Link>
        )}
      </p>
    </div>
  )
}
