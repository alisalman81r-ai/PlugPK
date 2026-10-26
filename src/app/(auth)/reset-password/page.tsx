// src/app/(auth)/reset-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { PasswordResetFlow } from '@/components/auth/PasswordResetFlow'
import { ArrowLeft } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Enter the code from your email and choose a new Plug.pk password.',
}

interface PageProps {
  searchParams: { email?: string }
}

/*
  The second step of /forgot-password on its own address, for someone who
  already has a code (another tab, another device). With ?email= it opens on
  the code; without, it starts from the address like /forgot-password.
*/
export default function ResetPasswordPage({ searchParams }: PageProps) {
  const email = typeof searchParams.email === 'string' ? searchParams.email.trim().slice(0, 254) : ''

  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Choose a new password"
        subtitle="Setting a new password signs you out on every other device."
      />
      <PasswordResetFlow initialEmail={email} startAtCode />
      <Link
        href="/login"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-ui-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to sign in
      </Link>
    </>
  )
}
