// src/app/(auth)/signup/page.tsx
import type { Metadata } from 'next'

import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

export const metadata: Metadata = {
  title: 'Create Account',
  description: "Join Plug.pk — Pakistan's EV community.",
}

export default function SignUpPage() {
  return (
    <>
      <AuthHeader title="Create your account" subtitle="Join 5,000+ EV owners on Plug.pk" />
      <SocialLoginButtons mode="signup" />
      <AuthDivider />
      <SignUpForm />
    </>
  )
}
