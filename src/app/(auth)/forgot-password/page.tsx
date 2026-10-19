// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { authHref } from '@/components/auth/auth-links'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { ArrowLeft } from '@/components/ui/icons'
import { SITE_CONFIG } from '@/lib/constants'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Get a link to set a new password for your Plug.pk account.',
}

interface PageProps {
  searchParams: { redirect?: string }
}

/*
  Supabase sends the reset email; its link comes back to /reset-password.
  Writing to support still works for someone who cannot receive the email —
  an admin can set a temporary password from the member's page.
*/
export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const redirect = safeRedirect(searchParams.redirect, '')

  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Forgot your password?"
        subtitle="Enter the email you signed up with and we'll send you a link to choose a new one."
      />

      <ForgotPasswordForm />

      <p className="mt-6 text-ui-sm text-slate-500">
        No email arriving, even in spam? Write to{' '}
        <a href={`mailto:${SITE_CONFIG.email}`} className="font-semibold text-plug-blue-600 hover:underline">
          {SITE_CONFIG.email}
        </a>{' '}
        from that address and we&apos;ll help you back in.
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
