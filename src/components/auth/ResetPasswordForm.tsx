// src/components/auth/ResetPasswordForm.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button, MorphIcon } from '@/components/ui'
import { Eye, EyeOff, Lock } from '@/components/ui/icons'
import { resetPassword } from '@/lib/db/auth-actions'
import { cn } from '@/lib/utils'

import { FIELD_CLASS, FIELD_ERROR, FIELD_OK, FieldError, PASSWORD_PATTERN, PasswordStrength } from './SignUpForm'

export function ResetPasswordForm({ tokenHash }: { tokenHash: string }) {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!PASSWORD_PATTERN.test(password)) {
      setFieldError('Use at least 8 characters with a letter and a number.')
      return
    }
    setFieldError(null)
    setError(null)
    setBusy(true)
    let result: Awaited<ReturnType<typeof resetPassword>>
    try {
      result = await resetPassword(tokenHash, password)
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
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
        New password
      </label>
      <div className="relative">
        <Lock
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="new-password"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Choose a strong password"
          autoComplete="new-password"
          aria-invalid={fieldError ? true : undefined}
          className={cn(FIELD_CLASS, fieldError ? FIELD_ERROR : FIELD_OK)}
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

      {error ? (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{' '}
          <Link href="/forgot-password" className="font-semibold text-plug-blue-600 hover:underline">
            Get a new link
          </Link>
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth isLoading={busy} className="mt-6">
        Set new password
      </Button>
    </form>
  )
}
