// src/components/auth/SignUpForm.tsx
'use client'

import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import { registerUser } from '@/lib/db/auth-actions'

import { authHref } from './auth-links'
import { ALINK, ActionButton, ArrowEnd, LABEL, Notice } from './form-ui'
import { VerifyEmailForm } from './VerifyEmailForm'

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

/**
 * Shared field classes so every auth input looks identical (.afield .input of
 * landing-v2): 56px tall, 14px corners, an ink border on focus with the volt
 * halo, ember when something is wrong.
 *
 * The ::-ms-reveal / ::-ms-clear rules hide Edge's own eye and clear buttons,
 * which otherwise sit beside the show-password toggle as a second eye.
 */
export const FIELD_CLASS =
  'h-14 w-full appearance-none rounded-[14px] border-[1.5px] bg-white pl-[46px] pr-14 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#9a9ea5] [&::-ms-clear]:hidden [&::-ms-reveal]:hidden'

export const FIELD_OK = 'border-ink/10 hover:border-ink/20 focus:border-ink focus:shadow-focus'

export const FIELD_ERROR = 'border-ember focus:border-ember focus:shadow-[0_0_0_4px_rgba(255,90,31,0.16)]'

/** The icon at the start of a field. */
export const FIELD_ICON = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog'

/** The show/hide password button at the end of a field (.afield__eye). */
export const FIELD_EYE =
  'absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-fog transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:shadow-focus'

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

/* The four-segment meter of the account page (.ameter): ember, amber, lime, green. */
const STRENGTH_META: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  0: { label: '', bar: '', text: '' },
  1: { label: 'Weak', bar: 'bg-ember', text: 'text-[#B42E05]' },
  2: { label: 'Fair', bar: 'bg-[#FFB020]', text: 'text-[#8A5300]' },
  3: { label: 'Good', bar: 'bg-[#9bc53d]', text: 'text-volt-ink' },
  4: { label: 'Strong', bar: 'bg-[#35D07F]', text: 'text-[#157A45]' },
}

export function PasswordStrength({ password }: { password: string }) {
  if (password.length === 0) return null

  const level = passwordStrength(password)
  const meta = STRENGTH_META[level]

  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-4 gap-[5px]">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            aria-hidden="true"
            className={cn('h-[5px] rounded-[3px] transition-colors duration-300', step <= level ? meta.bar : 'bg-stone')}
          />
        ))}
      </div>
      <p className={cn('mt-1.5 text-[13px] font-medium', meta.text)}>{meta.label} password</p>
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#c2410c]">
      <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

/** The agree box (.acheck): a 22px tile that fills volt with an ink tick. */
export function Checkbox({
  checked,
  onChange,
  id,
  invalid = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
  invalid?: boolean
}) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-invalid={invalid || undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-[background-color,border-color] duration-200 before:absolute before:-inset-[11px] before:content-[""] focus-visible:border-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(212,255,58,.55)]',
        checked ? 'border-volt bg-volt' : invalid ? 'border-ember bg-white' : 'border-ink/25 bg-white',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-2.5 -translate-y-px -rotate-45 border-b-2 border-l-2 border-ink transition-transform duration-[250ms] ease-spring',
          checked ? 'scale-100' : 'scale-0',
        )}
      />
    </button>
  )
}

interface Errors {
  fullName?: string
  email?: string
  password?: string
  terms?: string
  general?: string
}

export function SignUpForm({ onSuccess, redirectTo }: SignUpFormProps) {
  const [sentTo, setSentTo] = React.useState<{ email: string; sent: boolean; notice?: string } | null>(null)
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
    else if (name.length > 80) next.fullName = 'Name must be 80 characters or fewer.'

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
    /*
      Agreement is checked here, on submit, rather than by disabling the
      button. A disabled button gave no reason — it just sat there grey —
      and somebody who had filled in every field could not tell what was
      missing. Now the button always works and says what it needs.
    */
    if (!agreed) found.terms = 'Tick the box to agree to the Terms and Privacy Policy.'
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
    // Where the emailed link lands once the address is confirmed.
    if (redirectTo) payload.set('redirect', redirectTo)

    let result: Awaited<ReturnType<typeof registerUser>>
    try {
      result = await registerUser(payload)
    } catch {
      result = { ok: false, message: 'We could not reach the server. Check your connection and try again.' }
    }
    setIsLoading(false)

    if (!result.ok) {
      setSubmitError(result.message ?? 'Could not create your account.')
      return
    }

    // No session yet: the account starts once the emailed code is entered, and
    // then carries on to redirectTo (or vehicle onboarding).
    onSuccess?.()
    setPassword('')
    setSentTo({
      email: result.verifyEmail ?? email.trim().toLowerCase(),
      sent: result.emailSent === true,
      notice: result.message,
    })
  }

  if (sentTo) {
    return (
      <VerifyEmailForm
        email={sentTo.email}
        sent={sentTo.sent}
        notice={sentTo.notice}
        onBack={() => setSentTo(null)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-[18px]">
        <label htmlFor="fullName" className={LABEL}>
          Full name
        </label>
        <div className="relative">
          <User size={18} className={FIELD_ICON} aria-hidden="true" />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Your full name"
            autoComplete="name"
            aria-invalid={touched.fullName && errors.fullName ? true : undefined}
            className={cn(FIELD_CLASS, touched.fullName && errors.fullName ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        {touched.fullName ? <FieldError message={errors.fullName} /> : null}
      </div>

      <div className="mb-[18px]">
        <label htmlFor="email" className={LABEL}>
          Email address
        </label>
        <div className="relative">
          <Mail size={18} className={FIELD_ICON} aria-hidden="true" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={touched.email && errors.email ? true : undefined}
            className={cn(FIELD_CLASS, touched.email && errors.email ? FIELD_ERROR : FIELD_OK)}
          />
        </div>
        {touched.email ? <FieldError message={errors.email} /> : null}
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <div className="relative">
          <Lock size={18} className={FIELD_ICON} aria-hidden="true" />
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
            aria-pressed={showPassword}
            className={FIELD_EYE}
          >
            <MorphIcon active={showPassword} on={EyeOff} off={Eye} size={20} />
          </button>
        </div>
        <PasswordStrength password={password} />
        {touched.password ? <FieldError message={errors.password} /> : null}
      </div>

      <div className="mb-[22px] mt-5">
        <div className="flex min-h-11 items-start gap-3 pt-0.5">
          <Checkbox
            id="terms"
            checked={agreed}
            invalid={Boolean(errors.terms)}
            onChange={(next) => {
              setAgreed(next)
              if (next) setErrors((current) => ({ ...current, terms: undefined }))
            }}
          />
          <label htmlFor="terms" className="cursor-pointer text-sm leading-normal text-muted">
            I agree to the{' '}
            <Link href="/terms" className={ALINK}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className={ALINK}>
              Privacy Policy
            </Link>
          </label>
        </div>
        <FieldError message={errors.terms} />
        {errors.general ? <FieldError message={errors.general} /> : null}
      </div>

      {/* Server-side failures — a duplicate email is the common one, and it
          cannot be caught by the client validation above. */}
      {submitError ? (
        <Notice tone="error" className="mb-4">
          {submitError}
        </Notice>
      ) : null}

      <ActionButton type="submit" size="lg" fullWidth isLoading={isLoading}>
        Create your account
        {isLoading ? null : <ArrowEnd />}
      </ActionButton>

      <p className="mt-6 text-center text-[15px] text-muted">
        Already have an account?{' '}
        <Link href={authHref('/login', redirectTo)} className={ALINK}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
