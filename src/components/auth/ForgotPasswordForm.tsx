// src/components/auth/ForgotPasswordForm.tsx
'use client'

import * as React from 'react'

import { Button } from '@/components/ui'
import { Mail } from '@/components/ui/icons'
import { requestPasswordReset } from '@/lib/db/auth-actions'
import { cn } from '@/lib/utils'

import { EMAIL_PATTERN, FIELD_CLASS, FIELD_ERROR, FIELD_OK, FieldError } from './SignUpForm'

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [note, setNote] = React.useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    setFieldError(null)
    setNote(null)
    setBusy(true)
    try {
      const result = await requestPasswordReset(email.trim())
      setNote({ ok: result.ok, text: result.message })
    } catch {
      setNote({ ok: false, text: 'We could not reach the server. Check your connection and try again.' })
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} noValidate>
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
          aria-invalid={fieldError ? true : undefined}
          className={cn(FIELD_CLASS, fieldError ? FIELD_ERROR : FIELD_OK)}
        />
      </div>
      <FieldError message={fieldError ?? undefined} />

      {note ? (
        <p
          role="status"
          className={
            note.ok
              ? 'mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800'
              : 'mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
          }
        >
          {note.text}
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">
        Email me a reset link
      </Button>
    </form>
  )
}
