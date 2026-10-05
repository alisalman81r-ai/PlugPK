// src/app/(auth)/reset-password/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

// Titled even though it only redirects, so a tab caught mid-redirect or a
// crawler that records the hop does not show the bare site default.
export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Password resets are handled by the Plug.pk team.',
}

/*
  A reset page needs a reset link to arrive from, and with no email service
  the site sends none — this page could only ever be reached by typing it, and
  it would then "reset" nothing. Until email is connected, resets go through
  support (see /forgot-password), so this address points there.
*/
export default function ResetPasswordPage() {
  redirect('/forgot-password')
}
