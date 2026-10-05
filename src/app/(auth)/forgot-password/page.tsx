// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { authHref } from '@/components/auth/auth-links'
import { CopyEmailButton } from '@/components/auth/CopyEmailButton'
import { buttonClasses } from '@/components/ui'
import { ArrowLeft, Mail } from '@/components/ui/icons'
import { SITE_CONFIG } from '@/lib/constants'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'How to get back into your Plug.pk account.',
}

interface PageProps {
  searchParams: { redirect?: string }
}

/*
  The site has no email service, so it cannot send a reset link. This page
  used to show a form that said "check your email" and sent nothing — a dead
  end that looked like it had worked. Resets are done by a person instead:
  the member writes from the address on the account, and an admin sets a
  temporary password on the member's page in the admin portal. Signing in
  with it lands on Settings, which asks for a new one before anything else.

  The turnaround is the same "two working days" the meeting-request form
  promises, because both land in the same small team's inbox; quoting a
  faster figure here would be a promise nobody has checked.
*/
const SUPPORT = SITE_CONFIG.email
const MAILTO = `mailto:${SUPPORT}?subject=${encodeURIComponent('Password reset')}&body=${encodeURIComponent(
  'Hi Plug.pk team,\n\nI cannot sign in to my account. Please send me a temporary password.\n\nThe email on my account is this one.\n',
)}`

const STEP = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-ui-xs font-bold text-plug-blue-700'

export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const redirect = safeRedirect(searchParams.redirect, '')

  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Forgot your password?"
        subtitle="There is no automatic reset yet. A person on our team sets you up with a new one."
      />

      <ol className="space-y-4 text-ui-sm text-slate-600">
        <li className="flex gap-3">
          <span className={STEP}>1</span>
          <span>
            Email <span className="font-semibold text-slate-900">{SUPPORT}</span>{' '}
            <strong>from the address you signed up with</strong>, so we know the account is yours.
          </span>
        </li>
        <li className="flex gap-3">
          <span className={STEP}>2</span>
          <span>We reply with a temporary password. We usually reply within two working days.</span>
        </li>
        <li className="flex gap-3">
          <span className={STEP}>3</span>
          <span>Sign in with it. You will be asked to choose your own straight away.</span>
        </li>
      </ol>

      <div className="mt-8 space-y-3">
        <a href={MAILTO} className={buttonClasses({ variant: 'primary', size: 'lg', fullWidth: true })}>
          <Mail size={18} aria-hidden="true" />
          Open your email app
        </a>
        <CopyEmailButton email={SUPPORT} />
      </div>

      <Link
        href={authHref('/login', redirect)}
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-ui-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to sign in
      </Link>
    </>
  )
}
