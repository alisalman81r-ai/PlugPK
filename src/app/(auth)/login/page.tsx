// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { LoginForm } from '@/components/auth/LoginForm'
import { ArrowLeft, Building2 } from '@/components/ui/icons'
import { ABACK } from '@/components/auth/form-ui'
import { BtnArrow, btnClass } from '@/components/v2/ui'
import { safeRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your plugpk account.',
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
  Email and password is the only way in. There is no OAuth client behind the
  site, so no "Continue with Google" button is offered: one that did nothing
  would be a dead end that looks like the fast path. Adding social sign-in is
  a server-side job first (a provider, a callback route, account linking);
  the button is the last step, not the first.
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
          title="Sign in to your business."
          subtitle="For partners who list a charger or an EV service on plugpk."
        />
        <LoginForm redirectTo={redirectTo} />

        <div className="mt-[26px] rounded-[18px] border border-ink/10 bg-chalk p-[22px]">
          <p className="m-0 flex items-center gap-3 font-display text-[22px] leading-none text-ink">
            <Building2 size={28} className="shrink-0" aria-hidden="true" />
            New partner?
          </p>
          <p className="mb-4 mt-3 text-sm leading-[1.55] text-muted">
            List your charging station or EV service. We review every listing before it goes live.
          </p>
          <Link href="/business/signup" className={btnClass('ink', 'sm')}>
            List your business
            <BtnArrow />
          </Link>
        </div>

        <Link href="/login" className={`${ABACK} mt-3.5`}>
          <ArrowLeft size={16} aria-hidden="true" />
          Driver sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <AuthHeader eyebrow="Sign in" title="Welcome back." subtitle="Sign in to your plugpk account" />
      <LoginForm redirectTo={redirectTo} />

      <div className="mt-[26px] flex flex-wrap items-center justify-between gap-3.5 rounded-[18px] border border-ink/10 bg-chalk py-3.5 pl-5 pr-3.5 max-[520px]:p-3.5">
        <span className="text-sm text-muted">Own a charger or an EV service?</span>
        <Link
          href="/login?mode=business"
          className={btnClass('light', 'sm', 'border border-ink/10 max-[520px]:w-full')}
        >
          <Building2 aria-hidden="true" />
          Become a partner
        </Link>
      </div>
    </>
  )
}
