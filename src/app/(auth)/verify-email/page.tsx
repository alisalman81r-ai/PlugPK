// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

// Titled even though it only redirects, so a tab caught mid-redirect or a
// crawler that records the hop does not show the bare site default.
export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Plug.pk accounts are usable as soon as they are created.',
}

/*
  Sign-up does not send a verification email (there is no email service), and
  nothing linked here; the page showed "verified" without checking anything.
  Accounts are usable as soon as they are created, so this goes to the
  dashboard, which sends a signed-out visitor to sign in.
*/
export default function VerifyEmailPage() {
  redirect('/dashboard')
}
