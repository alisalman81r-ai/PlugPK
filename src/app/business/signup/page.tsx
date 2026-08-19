// src/app/business/signup/page.tsx
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessSignUpForm } from '@/components/business/BusinessSignUpForm'
import { EyebrowBadge } from '@/components/ui'
import { getCurrentProfile } from '@/lib/db/session-actions'

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
 */

export const dynamic = 'force-dynamic'

export default async function BusinessSignUpPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/business/signup')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-8 py-5">
        <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
          <Zap size={22} className="shrink-0 fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-slate-900">plug</span>
            <span className="text-plug-blue-600">.pk</span>
          </span>
        </Link>

        <Link
          href="/business/dashboard"
          className="text-sm text-plug-blue-600 hover:underline"
        >
          Your listings &rarr;
        </Link>
      </header>

      <div className="mx-auto max-w-[800px] px-4 py-12">
        <div className="mb-12 text-center">
          <EyebrowBadge color="blue">Business Registration</EyebrowBadge>
          <h1 className="mt-4 text-4xl font-black text-slate-900">
            List Your Business on Plug.pk
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Get discovered by EV owners across Pakistan
          </p>
        </div>

        <BusinessSignUpForm
          account={{ name: profile.name, email: profile.email, phone: null }}
        />
      </div>
    </div>
  )
}
