// src/components/auth/VerifyEmailStart.tsx
'use client'

import * as React from 'react'

import { Button } from '@/components/ui'
import { Mail } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import { EMAIL_PATTERN, FIELD_CLASS, FIELD_ERROR, FIELD_OK, FieldError } from './SignUpForm'
import { VerifyEmailForm } from './VerifyEmailForm'

/** /verify-email: which address, then the code form for it. */
export function VerifyEmailStart({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = React.useState(initialEmail)
  const [chosen, setChosen] = React.useState(EMAIL_PATTERN.test(initialEmail) ? initialEmail : '')
  const [fieldError, setFieldError] = React.useState<string | null>(null)

  if (chosen) return <VerifyEmailForm email={chosen} sent={false} onBack={() => setChosen('')} />

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const value = email.trim().toLowerCase()
        if (!EMAIL_PATTERN.test(value)) return setFieldError('Enter a valid email address.')
        setFieldError(null)
        setChosen(value)
      }}
    >
      <label htmlFor="verify-email" className="mb-2 block text-sm font-semibold text-slate-700">
        Email Address
      </label>
      <div className="relative">
        <Mail
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ahmed@example.com"
          autoComplete="email"
          className={cn(FIELD_CLASS, fieldError ? FIELD_ERROR : FIELD_OK)}
        />
      </div>
      <FieldError message={fieldError ?? undefined} />
      <Button type="submit" size="lg" fullWidth className="mt-6">
        Continue
      </Button>
    </form>
  )
}
