// src/app/(auth)/layout.tsx
import { CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  'Find EV charging stations across Pakistan',
  'Plan long-distance routes with ease',
  'Save your favourite stations',
  "Connect with Pakistan's EV community",
  'Get personalised charger recommendations',
]

const AVATARS = [
  { initial: 'A', tone: 'from-blue-500 to-cyan-500' },
  { initial: 'F', tone: 'from-purple-500 to-pink-500' },
  { initial: 'Z', tone: 'from-green-500 to-emerald-500' },
  { initial: 'H', tone: 'from-amber-500 to-orange-500' },
  { initial: 'S', tone: 'from-red-500 to-rose-500' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Form side ────────────────────────────────────────── */}
      <div className="flex min-h-screen w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-8 py-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
            aria-label="Plug.pk home"
          >
            <Zap
              size={22}
              className="shrink-0 fill-plug-blue-600 text-plug-blue-600"
              aria-hidden="true"
            />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-slate-900">plug</span>
              <span className="text-plug-blue-600">.pk</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            &larr; Back to home
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div className="mx-auto w-full max-w-[480px]">{children}</div>
        </div>

        <p className="px-8 py-6 text-center text-xs text-slate-400">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* ── Visual side ──────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-hero p-16 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/[0.18] blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/[0.12] blur-[100px]"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-12 flex items-center gap-3">
            <Zap size={32} className="text-plug-cyan-400" aria-hidden="true" />
            <span className="text-2xl font-black text-white">plug.pk</span>
          </div>

          <h2 className="mb-6 text-4xl font-black tracking-tight text-white">
            Pakistan&apos;s Complete
            <br />
            EV Platform
          </h2>

          <ul className="mb-12 flex flex-col gap-5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <CheckCircle2 size={16} className="text-plug-cyan-400" aria-hidden="true" />
                </span>
                <span className="text-base font-medium text-white/80">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.08] px-6 py-4">
            <span aria-hidden="true" className="flex">
              {AVATARS.map((avatar, index) => (
                <span
                  key={avatar.initial}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br text-xs font-bold text-white ${avatar.tone} ${index > 0 ? '-ml-2' : ''}`}
                >
                  {avatar.initial}
                </span>
              ))}
            </span>

            <span className="ml-3">
              <span className="block text-sm font-semibold text-white">Join 5,000+ EV owners</span>
              <span className="mt-0.5 block text-xs text-white/50">Already on Plug.pk</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
