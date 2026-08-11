// src/app/business/signup/page.tsx
'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'

import { BusinessSignUpForm } from '@/components/business/BusinessSignUpForm'
import { EyebrowBadge } from '@/components/ui'

export default function BusinessSignUpPage() {
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

        <Link href="/login" className="text-sm text-plug-blue-600 hover:underline">
          Already listed? Sign in &rarr;
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

        <BusinessSignUpForm />
      </div>
    </div>
  )
}
