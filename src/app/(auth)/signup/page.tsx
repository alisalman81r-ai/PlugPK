// src/app/(auth)/signup/page.tsx
import type { Metadata } from 'next'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Create Account',
  description: "Join Plug.pk — Pakistan's EV community.",
}

interface PageProps {
  searchParams: { redirect?: string }
}

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
export default function SignUpPage({ searchParams }: PageProps) {
  // Carried through so somebody who came here to list a business is taken
  // back to the form once the account exists, rather than to the dashboard.
  const redirectTo = searchParams.redirect ? safeRedirect(searchParams.redirect) : undefined

  return (
    <>
      <AuthHeader title="Create your account" subtitle="Join the EV owners on Plug.pk" />
      <SignUpForm redirectTo={redirectTo} />
    </>
  )
}
