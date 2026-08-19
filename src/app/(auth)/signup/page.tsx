// src/app/(auth)/signup/page.tsx
import type { Metadata } from 'next'

import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Create Account',
  description: "Join Plug.pk — Pakistan's EV community.",
}

interface PageProps {
  searchParams: { redirect?: string }
}

export default function SignUpPage({ searchParams }: PageProps) {
  // Carried through so somebody who came here to list a business is taken
  // back to the form once the account exists, rather than to the dashboard.
  const redirectTo = searchParams.redirect ? safeRedirect(searchParams.redirect) : undefined

  return (
    <>
      <AuthHeader title="Create your account" subtitle="Join the EV owners on Plug.pk" />
      <SocialLoginButtons mode="signup" />
      <AuthDivider />
      <SignUpForm redirectTo={redirectTo} />
    </>
  )
}
