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
  Email and password is the only way in. There is no OAuth client behind the
  site, so no "Continue with Google" button is offered: one that did nothing
  would be a dead end that looks like the fast path. Adding social sign-in is
  a server-side job first (a provider, a callback route, account linking);
  the button is the last step, not the first.
*/
export default function SignUpPage({ searchParams }: PageProps) {
  // Carried through so somebody who came here to list a business is taken
  // back to the form once the account exists, rather than to the dashboard.
  const redirectTo = searchParams.redirect ? safeRedirect(searchParams.redirect) : undefined

  return (
    <>
      {redirectTo?.startsWith('/business') ? (
        <AuthHeader
          eyebrow="Become a partner"
          title="Create your partner account"
          subtitle="Next you will add your charger or EV service. Every listing is reviewed before it goes live."
        />
      ) : (
        <AuthHeader eyebrow="Get started" title="Create your account" subtitle="Join the EV owners on Plug.pk" />
      )}
      <SignUpForm redirectTo={redirectTo} />
    </>
  )
}
