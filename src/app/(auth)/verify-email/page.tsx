// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from 'next'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { VerifyEmailStart } from '@/components/auth/VerifyEmailStart'

export const metadata: Metadata = {
  title: 'Confirm your email',
}

interface PageProps {
  searchParams: { email?: string }
}

/*
  Enter the six-digit code that was emailed after sign-up, from any device.
  Sign-up and sign-in show the same form in place; this page is for someone
  who closed the tab, and takes ?email= to fill the address in.
*/
export default function VerifyEmailPage({ searchParams }: PageProps) {
  const email = typeof searchParams.email === 'string' ? searchParams.email.trim().toLowerCase().slice(0, 254) : ''

  return (
    <>
      <AuthHeader
        eyebrow="Confirm your email"
        title="Verify your account"
        subtitle="Enter the 6-digit code we emailed you. No code, or it expired? You can send a new one."
      />
      <VerifyEmailStart initialEmail={email} />
    </>
  )
}
