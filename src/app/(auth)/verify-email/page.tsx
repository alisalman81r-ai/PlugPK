// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { ConfirmEmailButton } from '@/components/auth/ConfirmEmailButton'
import { buttonClasses } from '@/components/ui'
import { isVerificationTokenLive } from '@/lib/db/email-verification'

export const metadata: Metadata = {
  title: 'Confirm your email',
  // The token is in the URL; keep it out of the Referer header of anything this page loads.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { token?: string }
}

/*
  Where the emailed link lands. Opening the page uses nothing up — the button
  does, through a POST. Mail scanners fetch links to check them, and a page
  that redeemed the token on GET would let one spend it before the person
  ever clicked.
*/
export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''
  const live = token ? await isVerificationTokenLive(token) : false

  if (!live) {
    return (
      <>
        <AuthHeader
          eyebrow="Confirm your email"
          title="This link no longer works"
          subtitle="It has expired, was already used, or a newer one was sent. Sign in with your email and password and we'll offer to send a fresh link. If you already confirmed, you can just sign in."
        />
        <Link href="/login" className={buttonClasses({ size: 'lg', fullWidth: true })}>
          Go to sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <AuthHeader
        eyebrow="Almost there"
        title="Confirm your email"
        subtitle="One click and your account is active. You'll be signed in on this device."
      />
      <ConfirmEmailButton token={token} />
    </>
  )
}
