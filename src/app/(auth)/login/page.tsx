// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { LoginForm } from '@/components/auth/LoginForm'
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
/*
  The Google button is not rendered.

  SocialLoginButtons is a stub: its handler waits 1500ms, shows "Connecting...",
  then returns to idle. No OAuth client, no redirect, no session — nothing is
  wired behind it. As the largest and highest control on the page it was the
  first thing most people would reach for, and it did nothing but fake a
  loading state, which is worse than not offering it: a dead end that looks
  like the fast path, on the screen where somebody is trying to get in.

  Email and password work — LoginForm checks a scrypt hash on the User row and
  issues a signed cookie. So the form stands alone until OAuth is real, at
  which point putting the button back is these two lines and the divider.
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
      <LoginForm redirectTo={redirectTo} />
    </>
  )
}
