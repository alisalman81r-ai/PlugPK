// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { ConfirmEmailButton } from '@/components/auth/ConfirmEmailButton'
import { buttonClasses } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Confirm your email',
  // The token is in the URL; keep it out of the Referer header of anything this page loads.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { token_hash?: string; type?: string }
}

/*
  Where Supabase's confirmation email lands (its "Confirm signup" template
  links here with token_hash and type). Opening the page uses nothing up — the
  button does, through a POST. Mail scanners fetch links to check them, and a
  page that redeemed the token on GET would let one spend it before the person
  ever clicked.
*/
export default function VerifyEmailPage({ searchParams }: PageProps) {
  const tokenHash = typeof searchParams.token_hash === 'string' ? searchParams.token_hash : ''
  const type = searchParams.type === 'email' ? 'email' : 'signup'

  if (!tokenHash) {
    return (
      <>
        <AuthHeader
          eyebrow="Confirm your email"
          title="This link is incomplete"
          subtitle="Open the link straight from the email we sent. If it still does not work, sign in with your email and password and we'll offer to send a fresh one."
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
      <ConfirmEmailButton tokenHash={tokenHash} type={type} />
    </>
  )
}
