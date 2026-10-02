// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { LoginForm } from '@/components/auth/LoginForm'
import { ArrowRight, Building2, ChevronLeft } from '@/components/ui/icons'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Plug.pk account.',
}

interface PageProps {
  searchParams: { redirect?: string; mode?: string }
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
/*
  ── Two doors, one account ──────────────────────────────────────────

  Drivers sign in here as they always have. Partners — anyone who lists a
  charger or an EV service — reach business sign-in through "Become a partner"
  at the foot of the card (or any business page, which sends ?redirect=
  /business/...). It is the same account and the same password; business mode
  only changes where sign-in lands: the business portal, which sends an
  account with no listing yet to the listing form.
*/
export default function LoginPage({ searchParams }: PageProps) {
  // '' when no (or no safe) redirect was asked for, so each mode picks its own landing.
  const asked = safeRedirect(searchParams.redirect, '')
  const isBusiness = searchParams.mode === 'business' || asked.startsWith('/business')
  const redirectTo = asked || (isBusiness ? '/business/dashboard' : '/dashboard')

  if (isBusiness) {
    return (
      <>
        <AuthHeader
          eyebrow="Business account"
          title="Sign in to your business"
          subtitle="For partners who list a charger or an EV service on Plug.pk."
        />
        <LoginForm redirectTo={redirectTo} />

        <div className="mt-6 rounded-2xl border border-plug-blue-100 bg-plug-blue-50/60 p-4">
          <p className="flex items-center gap-2 text-ui-sm font-semibold text-slate-900">
            <Building2 size={16} className="text-plug-blue-600" aria-hidden="true" />
            New partner?
          </p>
          <p className="mt-1 text-ui-sm text-slate-600">
            List your charging station or EV service. We review every listing before it goes live.
          </p>
          <Link
            href="/business/signup"
            className="mt-3 inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-700 hover:underline"
          >
            List your business
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-1 text-ui-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Driver sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <AuthHeader eyebrow="Sign in" title="Welcome back" subtitle="Sign in to your Plug.pk account" />
      <LoginForm redirectTo={redirectTo} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-ui-sm text-slate-600">Own a charger or an EV service?</p>
        <Link
          href="/login?mode=business"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-ui-sm font-semibold text-plug-blue-700 ring-1 ring-plug-blue-200 transition-colors hover:bg-plug-blue-50"
        >
          <Building2 size={15} aria-hidden="true" />
          Become a partner
        </Link>
      </div>
    </>
  )
}
