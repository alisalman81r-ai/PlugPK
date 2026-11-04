// src/app/business/signup/page.tsx
import { ArrowLeft, ArrowRight, BadgeCheck, Banknote, Camera, ShieldCheck } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BusinessSignUpForm } from '@/components/business/BusinessSignUpForm'
import { getListingFee, getListingPaymentAccounts } from '@/lib/db/listing-fee'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { formatPkr } from '@/lib/listing-application'
import {
  SHELL_ACTIONS_RISE,
  SHELL_BACK_ICON,
  SHELL_BAR_LINK,
  SHELL_LEAD,
  SHELL_TITLE,
  ShellChip,
  StandaloneShell,
  shellCardRise,
} from '@/components/auth/StandaloneShell'
import { BtnArrow, Hl, btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * Listing a business requires an account first.
 *
 * The form used to create the account itself, from an email and password typed
 * into its first step. That was also a way in: an email that already had an
 * account was accepted without checking the password, and the submitter was
 * then signed in as its owner. Anyone who knew a registered address could take
 * over that account by filling in this form.
 *
 * Taking the identity from the session removes the question entirely. There is
 * no email or password field left to get wrong, and the listing is attached to
 * whoever is actually signed in.
 *
 * Signed out, this used to redirect straight to a bare sign-in page headed
 * "Sign in to your business" — which reads as if the visitor already had a
 * business account, when most arriving here have no account at all. It now
 * says what listing involves and offers both ways in, each returning here.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'List your charger' }

const RETURN = encodeURIComponent('/business/signup')

/** What the form asks for, so nobody starts it without their documents to hand. */
function whatYouNeed(fee: number) {
  return [
    {
      icon: ShieldCheck,
      title: 'Proof of who you are',
      body: 'Your CNIC for a home charger, or a business licence or registration for anything else.',
    },
    {
      icon: Camera,
      title: 'A photo of each charger',
      body: 'One clear picture per charger, and a close-up of the connector if you can.',
    },
    {
      icon: Banknote,
      title: `The ${formatPkr(fee)} listing fee`,
      body: 'Paid by bank transfer, JazzCash or Easypaisa, with the receipt to hand.',
    },
    {
      icon: BadgeCheck,
      title: 'A person checks it',
      body: 'Nothing goes on the map until the payment, documents and photos are reviewed.',
    },
  ]
}

function barLink(signedIn: boolean) {
  return signedIn ? (
    <Link href="/business/dashboard" className={SHELL_BAR_LINK}>
      Your listings
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  ) : (
    <Link href="/" className={SHELL_BAR_LINK}>
      <ArrowLeft size={16} aria-hidden="true" className={SHELL_BACK_ICON} />
      Back to home
    </Link>
  )
}

const TEXT_LINK = 'font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4 hover:bg-volt-tint'

export default async function BusinessSignUpPage() {
  const profile = await getCurrentProfile()
  const fee = getListingFee()

  if (!profile) {
    return (
      <StandaloneShell aside={barLink(false)}>
        <div className="text-center">
          <ShellChip>List your charger</ShellChip>
          <h1 className={SHELL_TITLE}>
            Put your charger on the <Hl>plugpk map</Hl>
          </h1>
          <p className={SHELL_LEAD}>
            Hotels, restaurants, offices, dealerships and homes can list the chargers they have.
            You need a free plugpk account first — the listing belongs to it, and it is where you
            will manage the listing and see the outcome of its review.
          </p>
          <p className="mb-[18px] mt-14 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            What you need
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {whatYouNeed(fee).map((item, i) => {
            const Icon = item.icon
            const ink = i === whatYouNeed(fee).length - 1
            return (
              <li
                key={item.title}
                className={cn(
                  'relative rounded-[28px] border p-7 transition-[translate,box-shadow] duration-[450ms] ease-out hover:shadow-e2 hover:[translate:0_-4px]',
                  shellCardRise(i),
                  ink ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink shadow-e1',
                )}
              >
                <span aria-hidden="true" className={cn('absolute right-[26px] top-[26px] font-mono text-[13px] font-semibold', ink ? 'text-white/35' : 'text-[#a7aab0]')}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon size={40} aria-hidden="true" className={ink ? 'text-volt drop-shadow-[0_0_10px_rgba(212,255,58,.35)]' : 'text-ink'} />
                <p className="mt-[22px] font-display text-2xl leading-[1.15]">{item.title}</p>
                <p className={cn('mt-2.5 text-[15px] leading-[1.55]', ink ? 'text-fog' : 'text-muted')}>{item.body}</p>
              </li>
            )
          })}
        </ul>

        <div className={cn('mt-11 flex flex-col justify-center gap-3.5 sm:flex-row', SHELL_ACTIONS_RISE)}>
          <Link href={`/signup?redirect=${RETURN}`} className={btnClass('ink', 'lg')}>
            Create a free account
            <BtnArrow />
          </Link>
          <Link href={`/login?redirect=${RETURN}`} className={btnClass('ghost', 'lg', 'border-ink/20')}>
            I already have an account
          </Link>
        </div>

        <p className="mx-auto mt-[26px] max-w-[640px] text-center text-sm leading-[1.6] text-muted">
          Listing terms are in the{' '}
          <Link href="/terms#partners" className={TEXT_LINK}>
            Business Terms
          </Link>
          . Offering an EV service rather than a charger?{' '}
          <Link href="/services/list" className={TEXT_LINK}>
            Apply to the services directory
          </Link>
          .
        </p>
      </StandaloneShell>
    )
  }

  return (
    <StandaloneShell aside={barLink(true)}>
      <div className="mb-12 text-center">
        <ShellChip>Business registration</ShellChip>
        <h1 className={SHELL_TITLE}>
          List your business on <Hl>plugpk</Hl>
        </h1>
        <p className={SHELL_LEAD}>Get discovered by EV owners across Pakistan</p>
      </div>

      <div className="mx-auto max-w-[800px]">
        <BusinessSignUpForm
          account={{ name: profile.name, email: profile.email, phone: null }}
          fee={fee}
          accounts={getListingPaymentAccounts()}
        />
      </div>
    </StandaloneShell>
  )
}
