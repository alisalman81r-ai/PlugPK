// src/app/admin/login/page.tsx
import { AlertTriangle, Lock } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createSessionValue,
  getAdminConfigError,
  verifyPassword,
  verifySessionValue,
} from '@/lib/admin-auth'

export const metadata = { title: { absolute: 'Admin sign-in' } }

/** Never cache a page whose output depends on a cookie. */
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { error?: string }
}

export default function AdminLoginPage({ searchParams }: PageProps) {
  // Already signed in — no reason to show the form again.
  if (verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect('/admin')
  }

  const configError = getAdminConfigError()

  async function signIn(formData: FormData) {
    'use server'

    const password = String(formData.get('password') ?? '')

    if (!verifyPassword(password)) {
      // The message is deliberately identical whether the password was wrong
      // or ADMIN_PASSWORD was never set, so the form cannot be used to probe
      // the server's configuration.
      redirect('/admin/login?error=1')
    }

    const value = createSessionValue()
    if (!value) redirect('/admin/login?error=1')

    cookies().set(ADMIN_COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    })

    redirect('/admin')
  }

  return (
    <main className="flex min-h-viewport items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
            <Lock size={20} className="text-cyan-300" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-white">Plug.pk admin</h1>
          <p className="mt-2 text-ui-sm text-white/50">
            This portal writes directly to live content.
          </p>
        </div>

        {configError ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-ui-sm font-semibold text-amber-200">Not configured</p>
              <p className="mt-1 text-ui-xs leading-relaxed text-amber-200/70">
                {configError} Set it in <code className="font-mono">.env</code> and restart the
                server.
              </p>
            </div>
          </div>
        ) : null}

        <form action={signIn} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <label htmlFor="password" className="mb-2 block text-ui-sm font-medium text-white/70">
            Admin password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 text-ui text-white outline-none transition-colors placeholder:text-white/30 focus-visible:border-cyan-400/60"
          />

          {searchParams.error ? (
            <p role="alert" className="mt-3 text-ui-sm text-red-400">
              Incorrect password.
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-5 h-12 w-full rounded-xl bg-white text-ui font-semibold text-slate-950 transition-colors hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
