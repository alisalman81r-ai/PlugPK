// src/app/business/signup/page.tsx
import { BadgeCheck, Camera, MapPin } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BusinessSignUpForm } from '@/components/business/BusinessSignUpForm'
import { EyebrowBadge } from '@/components/ui'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { Logo } from '@/components/ui/Logo'

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

/** What the form asks for, so nobody starts it without a photo to hand. */
const WHAT_YOU_NEED = [
  {
    icon: MapPin,
    title: 'Where your chargers are',
    body: 'The address and a map pin drivers can navigate to.',
  },
  {
    icon: Camera,
    title: 'A photo of each charger',
    body: 'One clear picture per charger, and a close-up of the connector if you can.',
  },
  {
    icon: BadgeCheck,
    title: 'A person checks it',
    body: 'Nothing goes on the map until the listing and its photos have been reviewed.',
  },
]

function Header({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-8 py-5">
      <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
        <Logo tone="light" size="text-xl" />
      </Link>

      {signedIn ? (
        <Link href="/business/dashboard" className="text-sm text-plug-blue-600 hover:underline">
          Your listings &rarr;
        </Link>
      ) : null}
    </header>
  )
}

export default async function BusinessSignUpPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header signedIn={false} />

        <div className="mx-auto max-w-[720px] px-4 py-12">
          <div className="text-center">
            <EyebrowBadge color="blue">List your charger</EyebrowBadge>
            <h1 className="mt-4 text-4xl font-black text-slate-900">Put your charger on the Plug.pk map</h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-slate-500">
              Hotels, restaurants, offices, dealerships and homes can list the chargers they have.
              You need a free Plug.pk account first — the listing belongs to it, and it is where you
              will manage the listing and see the outcome of its review.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {WHAT_YOU_NEED.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <Icon size={20} className="text-plug-blue-600" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-ui-sm leading-relaxed text-slate-500">{item.body}</p>
                </li>
              )
            })}
          </ul>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/signup?redirect=${RETURN}`}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              Create a free account
            </Link>
            <Link
              href={`/login?redirect=${RETURN}`}
              className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-slate-300 bg-white px-6 text-ui font-semibold text-slate-800 transition-colors hover:border-slate-900"
            >
              I already have an account
            </Link>
          </div>

          <p className="mt-6 text-center text-ui-sm text-slate-500">
            Listing terms are in the{' '}
            <Link href="/terms#partners" className="font-semibold text-plug-blue-600 hover:underline">
              Business Terms
            </Link>
            . Offering an EV service rather than a charger?{' '}
            <Link href="/services/list" className="font-semibold text-plug-blue-600 hover:underline">
              Apply to the services directory
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header signedIn />

      <div className="mx-auto max-w-[800px] px-4 py-12">
        <div className="mb-12 text-center">
          <EyebrowBadge color="blue">Business Registration</EyebrowBadge>
          <h1 className="mt-4 text-4xl font-black text-slate-900">List Your Business on Plug.pk</h1>
          <p className="mt-3 text-lg text-slate-500">Get discovered by EV owners across Pakistan</p>
        </div>

        <BusinessSignUpForm account={{ name: profile.name, email: profile.email, phone: null }} />
      </div>
    </div>
  )
}
