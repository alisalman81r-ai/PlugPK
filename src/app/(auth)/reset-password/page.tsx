// src/app/(auth)/reset-password/page.tsx
import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Choose a new password for your Plug.pk account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
