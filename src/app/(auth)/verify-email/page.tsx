// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from 'next'

import { VerifyEmailPanel } from '@/components/auth/VerifyEmailPanel'
import { inspectVerificationToken } from '@/lib/db/email-verification'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Confirm the email address on your Plug.pk account.',
}

// Reads the token on every request; a cached copy would show a stale state.
export const dynamic = 'force-dynamic'

/**
 * Where the link in a verification email lands: /verify-email?token=…
 *
 * Loading the page only looks the token up (valid, expired or not valid); it
 * does not use it. Using it takes a press of "Verify my email" — see
 * VerifyEmailPanel for why. Nothing here reveals which account a token
 * belongs to or whether any given email address has an account.
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : ''
  const state = token ? await inspectVerificationToken(token) : 'missing'
  return <VerifyEmailPanel token={token} initialState={state} />
}
