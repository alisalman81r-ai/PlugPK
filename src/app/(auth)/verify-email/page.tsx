// src/app/(auth)/verify-email/page.tsx
'use client'

import { CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { Button } from '@/components/ui'

const RESEND_COOLDOWN = 60

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [isVerified, setIsVerified] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    setIsResending(true)
    // Stands in for the resend-verification API.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsResending(false)
    setCooldown(RESEND_COOLDOWN)
  }

  if (isVerified) {
    return (
      <div className="mx-auto max-w-[400px] animate-scale-in text-center">
        <CheckCircle2 size={64} className="mx-auto text-green-500" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-black text-green-700">Email verified!</h1>
        <p className="mt-2 text-slate-500">Your account is ready.</p>
        <div className="mt-8">
          <Button href="/onboarding/vehicle" size="lg" fullWidth>
            Continue to Plug.pk
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[400px] text-center">
      <span className="mb-8 inline-flex rounded-3xl bg-blue-50 p-5">
        <Mail size={64} className="text-plug-blue-600" aria-hidden="true" />
      </span>

      <h1 className="mb-3 text-3xl font-black text-slate-900">Verify your email</h1>

      <p className="leading-relaxed text-slate-500">
        We sent a verification link to{' '}
        {email ? (
          <span className="font-semibold text-plug-blue-600">{email}</span>
        ) : (
          <span className="font-semibold text-slate-700">your email address</span>
        )}
        . Click the link in your email to activate your account.
      </p>

      <div className="mb-8 mt-8 flex justify-center gap-3">
        <Button href="https://mail.google.com" external variant="secondary" size="sm">
          Open Gmail
        </Button>
        <Button href="https://outlook.com" external variant="secondary" size="sm">
          Open Outlook
        </Button>
      </div>

      <div className="border-t border-slate-100 pt-8">
        {cooldown > 0 ? (
          <p className="text-sm text-slate-400">Resend available in {cooldown}s</p>
        ) : (
          <p className="text-sm text-slate-500">
            Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-plug-blue-600 hover:underline disabled:opacity-60"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </p>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Wrong email?{' '}
          <Link href="/signup" className="text-plug-blue-600 hover:underline">
            Sign up again
          </Link>
        </p>

        {/* Demo affordance — no verification backend exists yet. */}
        <button
          type="button"
          onClick={() => setIsVerified(true)}
          className="mt-6 text-xs text-slate-300 hover:text-slate-500"
        >
          Simulate verified
        </button>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  // useSearchParams needs a Suspense boundary during static rendering.
  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-400">Loading...</p>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
