// src/components/auth/SignUpForm.tsx
'use client'

import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { registerUser } from '@/lib/db/auth-actions'

export interface SignUpFormProps {
  onSuccess?: () => void
  /**
   * Where to go once the account exists. Vehicle onboarding by default, but a
   * visitor who came here to list a business is sent back to that form.
   */
  redirectTo?: string
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

/** Shared field classes so every auth input looks identical. */
export const FIELD_CLASS =
  'h-12 w-full rounded-xl border-[1.5px] bg-white pl-11 pr-11 text-ui text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400'

export const FIELD_OK =
  'border-slate-200 focus:border-plug-blue-500 focus:shadow-focus'

export const FIELD_ERROR =
  'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export function passwordStrength(password: string): StrengthLevel {
  if (password.length === 0) return 0
  if (password.length < 8) return 1
  const hasLetterAndDigit = PASSWORD_PATTERN.test(password)
  if (!hasLetterAndDigit) return 2
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  if (password.length >= 12 && hasSpecial) return 4
  return 3
}

const STRENGTH_META: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  0: { label: '', bar: '', text: '' },
  1: { label: 'Weak', bar: 'bg-red-500', text: 'text-red-600' },
  2: { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
  3: { label: 'Good', bar: 'bg-plug-blue-600', text: 'text-plug-blue-600' },
  4: { label: 'Strong', bar: 'bg-green-500', text: 'text-green-600' },
}

export function PasswordStrength({ password }: { password: string }) {
  if (password.length === 0) return null

  const level = passwordStrength(password)
  const meta = STRENGTH_META[level]

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            aria-hidden="true"
            className={cn(
              'h-[3px] flex-1 rounded-full transition-all duration-300',
              step <= level ? meta.bar : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p className={cn('mt-1.5 text-xs font-medium', meta.text)}>{meta.label} password</p>
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
      <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export function Checkbox({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150',
        checked ? 'border-plug-blue-600 bg-plug-blue-600' : 'border-slate-300 bg-white',
      )}
    >
      {checked ? <Check size={12} className="text-white" aria-hidden="true" /> : null}
    </button>
  )
}

interface Errors {
  fullName?: string
  email?: string
  password?: string
  general?: string
}

export function SignUpForm({ onSuccess, redirectTo }: SignUpFormProps) {
  const router = useRouter()

  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [agreed, setAgreed] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Errors>({})
  const [touched, setTouched] = React.useState({
    fullName: false,
    email: false,
    password: false,
  })

  const validate = React.useCallback((): Errors => {
    const next: Errors = {}

    const name = fullName.trim()
    if (name.length === 0) next.fullName = 'Enter your full name.'
    else if (name.length < 2) next.fullName = 'Name must be at least 2 characters.'
    else if (name.length > 50) next.fullName = 'Name must be 50 characters or fewer.'

    if (email.trim().length === 0) next.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.'

    if (password.length === 0) next.password = 'Create a password.'
    else if (!PASSWORD_PATTERN.test(password))
      next.password = 'Use at least 8 characters with a letter and a number.'

    return next
  }, [fullName, email, password])

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((current) => ({ ...current, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const found = validate()
    setErrors(found)
    setTouched({ fullName: true, email: true, password: true })
    if (Object.keys(found).length > 0) return

    setIsLoading(true)
    setSubmitError(null)

    // A real record now, not a timer. The homepage owner count reads this
    // table, so a sign-up here is what moves that number.
    const payload = new FormData()
    payload.set('name', fullName)
    payload.set('email', email)
    payload.set('password', password)

    const result = await registerUser(payload)
    setIsLoading(false)

    if (!result.ok) {
      setSubmitError(result.message ?? 'Could not create your account.')
      return
    }

    onSuccess?.()
    router.push(redirectTo ?? '/onboarding/vehicle')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-5">
        <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
          Full Name
        </label>
        <div className="relative">
          <User
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Ahmed Khan"
            autoComplete="name"
            aria-invalid={touched.fullName && errors.fullName ? true : undefined}
            className={cn(FIELD_CLASS, touched.fullName && errors.fullName ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        {touched.fullName ? <FieldError message={errors.fullName} /> : null}
      </div>

      <div className="mb-5">
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="ahmed@example.com"
            autoComplete="email"
            aria-invalid={touched.email && errors.email ? true : undefined}
            className={cn(FIELD_CLASS, touched.email && errors.email ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        {touched.email ? <FieldError message={errors.email} /> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-invalid={touched.password && errors.password ? true : undefined}
            className={cn(FIELD_CLASS, touched.password && errors.password ? FIELD_ERROR : FIELD_OK)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordStrength password={password} />
        {touched.password ? <FieldError message={errors.password} /> : null}
      </div>

      <div className="mt-5 flex items-start gap-3">
        <Checkbox id="terms" checked={agreed} onChange={setAgreed} />
        <label htmlFor="terms" className="text-sm text-slate-600">
          I agree to the{' '}
          <Link href="/terms" className="text-plug-blue-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-plug-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      {errors.general ? <FieldError message={errors.general} /> : null}

      {/* Server-side failures — a duplicate email is the common one, and it
          cannot be caught by the client validation above. */}
      {submitError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={!agreed}
        className="mt-6"
      >
        Create Your Account
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-plug-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
