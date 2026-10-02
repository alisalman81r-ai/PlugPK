// src/app/(auth)/verify-email/page.tsx
import { redirect } from 'next/navigation'

/*
  Sign-up does not send a verification email (there is no email service), and
  nothing linked here; the page showed "verified" without checking anything.
  Accounts are usable as soon as they are created, so this goes to the
  dashboard, which sends a signed-out visitor to sign in.
*/
export default function VerifyEmailPage() {
  redirect('/dashboard')
}
