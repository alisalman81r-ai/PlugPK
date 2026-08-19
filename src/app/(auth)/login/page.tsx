// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'

import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { LoginForm } from '@/components/auth/LoginForm'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Plug.pk account.',
}

interface PageProps {
  searchParams: { redirect?: string }
}

/**
 * Gated pages send people here with ?redirect= so they land back where they
 * were going. Without reading it, every sign-in went to /dashboard and someone
 * heading for the business form had to find their way back by hand.
 */
export default function LoginPage({ searchParams }: PageProps) {
  const redirectTo = safeRedirect(searchParams.redirect)

  return (
    <>
      <AuthHeader
        title="Welcome back"
        subtitle={
          redirectTo === '/business/signup'
            ? 'Sign in to list your business'
            : 'Sign in to your Plug.pk account'
        }
      />
      <SocialLoginButtons mode="login" />
      <AuthDivider />
      <LoginForm redirectTo={redirectTo} />
    </>
  )
}
