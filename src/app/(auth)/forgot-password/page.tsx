// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthHeader } from '@/components/auth/AuthHeader'
import { ArrowLeft, Mail } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'How to get back into your Plug.pk account.',
}

/*
  The site has no email service yet, so it cannot send a reset link. This page
  used to show a form that said "check your email" and sent nothing — a dead
  end that looked like it had worked. Until email is connected, resets are
  done by support: the member writes from the address on the account, and an
  admin sets a temporary password on the member's page in the admin portal.
*/
const SUPPORT = 'hello@plug.pk'
const MAILTO = `mailto:${SUPPORT}?subject=${encodeURIComponent('Password reset')}&body=${encodeURIComponent(
  'Hi Plug.pk team,\n\nI cannot sign in to my account. Please send me a temporary password.\n\nThe email on my account is this one.\n',
)}`

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        eyebrow="Password help"
        title="Forgot your password?"
        subtitle="We will set you up with a new one."
      />

      <ol className="space-y-4 text-ui-sm text-slate-600">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-ui-xs font-bold text-plug-blue-700">1</span>
          <span>
            Email <span className="font-semibold text-slate-900">{SUPPORT}</span> <strong>from the address you signed up with</strong>,
            so we know the account is yours.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-ui-xs font-bold text-plug-blue-700">2</span>
          <span>We reply with a temporary password, usually within one working day.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-ui-xs font-bold text-plug-blue-700">3</span>
          <span>Sign in with it, then choose your own under Dashboard → Settings → Password.</span>
        </li>
      </ol>

      <a
        href={MAILTO}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-plug-navy-950 text-ui font-semibold text-white transition-colors hover:bg-plug-navy-900"
      >
        <Mail size={18} aria-hidden="true" />
        Email {SUPPORT}
      </a>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-ui-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to sign in
      </Link>
    </>
  )
}
