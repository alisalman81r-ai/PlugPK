// src/app/(auth)/reset-password/page.tsx
import { redirect } from 'next/navigation'

/*
  A reset page needs a reset link to arrive from, and with no email service
  the site sends none — this page could only ever be reached by typing it, and
  it would then "reset" nothing. Until email is connected, resets go through
  support (see /forgot-password), so this address points there.
*/
export default function ResetPasswordPage() {
  redirect('/forgot-password')
}
