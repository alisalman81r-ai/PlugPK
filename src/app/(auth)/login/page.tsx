// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'

import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { LoginForm } from '@/components/auth/LoginForm'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Plug.pk account.',
}

export default function LoginPage() {
  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Sign in to your Plug.pk account" />
      <SocialLoginButtons mode="login" />
      <AuthDivider />
      <LoginForm />
    </>
  )
}
