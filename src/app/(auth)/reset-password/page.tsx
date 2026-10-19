// src/app/(auth)/reset-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { buttonClasses } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Choose a new password for your Plug.pk account.',
  // The token is in the URL; keep it out of the Referer header of anything this page loads.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { token_hash?: string }
}

/*
  Where Supabase's "Reset password" email lands, with a token_hash. The token
  is redeemed only when the new password is submitted, so a mail scanner
  opening the link spends nothing.
*/
export default function ResetPasswordPage({ searchParams }: PageProps) {
  const tokenHash = typeof searchParams.token_hash === 'string' ? searchParams.token_hash : ''

  if (!tokenHash) {
    return (
      <>
        <AuthHeader
          eyebrow="Password help"
          title="This link is incomplete"
          subtitle="Open the link straight from the reset email, or ask for a new one."
        />
        <Link href="/forgot-password" className={buttonClasses({ size: 'lg', fullWidth: true })}>
          Get a new link
        </Link>
      </>
    )
  }

  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Choose a new password"
        subtitle="You'll be signed in on this device, and signed out everywhere else."
      />
      <ResetPasswordForm tokenHash={tokenHash} />
    </>
  )
}
