// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { authHref } from '@/components/auth/auth-links'
import { PasswordResetFlow } from '@/components/auth/PasswordResetFlow'
import { ArrowLeft } from '@/components/ui/icons'
import { SITE_CONFIG } from '@/lib/constants'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Plug.pk password with a code sent to your email.',
}

interface PageProps {
  searchParams: { redirect?: string; email?: string }
}

/*
  A reset by emailed six-digit code (auth-actions.ts → requestPasswordReset,
  resetPasswordWithCode). It used to be a manual process — write to support,
  wait for a temporary password — because the site had no email service.
  Support stays as the fallback for someone whose inbox is unreachable; an
  admin can still set a temporary password from the member's page.
*/
export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const redirect = safeRedirect(searchParams.redirect, '')
  const email = typeof searchParams.email === 'string' ? searchParams.email.trim().slice(0, 254) : ''

  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Reset your password"
        subtitle="We'll email you a 6-digit code. Enter it with a new password and you're back in."
      />

      <PasswordResetFlow initialEmail={email} />

      <p className="mt-6 text-ui-xs leading-relaxed text-slate-500">
        No access to that inbox any more? Write to{' '}
        <a
          href={`mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent('Password reset')}`}
          className="font-semibold text-plug-blue-600 hover:underline"
        >
          {SITE_CONFIG.email}
        </a>{' '}
        and we&apos;ll help you back in.
      </p>

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
