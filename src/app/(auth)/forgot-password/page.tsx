// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Plug.pk password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
