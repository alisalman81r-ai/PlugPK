// src/app/(auth)/layout.tsx
import { MapPin, Route, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { getPlatformStats } from '@/lib/db/queries'

/**
 * The split shell every auth page renders inside.
 *
 * Brought onto the shape the rest of the site settled on. The panel was
 * `bg-gradient-hero` — the flat navy-to-teal ramp /map, /routes, /community and
 * Partner Up all dropped, because it puts the heading on one colour and
 * everything under it on a visibly different one, and anything white landing
 * mid-ramp gets the least contrast to work against. It is slate-950 with
 * discrete pools of light now, like every other band.
 *
 * ── What was removed, and why it had to be ────────────────────────────
 *
 * The panel ended on a card reading "Join 5,000+ EV owners" over five gradient
 * circles lettered A F Z H S. Both were invented: the circles are not people,
 * and the figure was not counted from anything. The same claim in the community
 * hero was the thing that made that page untrustworthy, and here it sits on the
 * one screen where somebody is deciding whether to hand over an email address —
 * the worst possible place to be caught exaggerating.
 *
 * What replaces it is counted, and prints nothing when there is nothing to
 * print: a platform with two stations says two, and a platform with none says
 * nothing rather than dressing a zero up.
 *
 * The five feature bullets became three. "Save your favourite stations" and
 * "Get personalised charger recommendations" are the same promise twice, and a
 * five-item list on a sign-in screen is read by nobody.
 */

/** Only what a signed-in account genuinely changes about using the site. */
const VALUE: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Zap,
    title: 'Every charger on one map',
    body: 'Filter by connector and speed, see which ports are free, get directions in a tap.',
  },
  {
    icon: Route,
    title: 'Routes planned around your car',
    body: 'Tell us what you drive and the stops are sized to its real range, not an average.',
  },
  {
    icon: MapPin,
    title: 'Your stations, saved',
    body: 'Keep the chargers you rely on, and the cars you are comparing, across devices.',
  },
]

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  /*
    Decoration must never be able to break sign-in.

    These figures are the least important thing on the screen and the only part
    that touches the database. If that query fails — a migration mid-flight, a
    dropped connection — the panel should lose its stat line, not take the login
    form down with it.
  */
  let stats: { stations: number; cities: number } | null = null
  try {
    const platform = await getPlatformStats()
    stats = { stations: platform.stations, cities: platform.cities }
  } catch {
    stats = null
  }

  const figures = [
    { value: stats?.stations ?? 0, label: 'charging points' },
    { value: stats?.cities ?? 0, label: stats?.cities === 1 ? 'city' : 'cities' },
  ].filter((figure) => figure.value > 0)

  return (
    <div className="flex min-h-viewport bg-white">
      {/* ── Form side ────────────────────────────────────────────── */}
      <div className="flex min-h-viewport w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-6 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            aria-label="Plug.pk home"
          >
            <Zap
              size={22}
              className="shrink-0 fill-plug-blue-600 text-plug-blue-600"
              aria-hidden="true"
            />
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-slate-900">plug</span>
              <span className="text-plug-blue-600">.pk</span>
            </span>
          </Link>

          {/* slate-500, not slate-400: this is the way out of a screen somebody
              may have arrived at by accident, and it was below 4.5:1. */}
          <Link
            href="/"
            className="rounded-lg text-ui-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            &larr; Back to home
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-[26rem]">{children}</div>
        </div>

        {/* The legal line was text-slate-400 at 12px, which is the smallest and
            faintest text on the page and also the part with consequences. */}
        <p className="px-6 py-6 text-center text-ui-xs leading-relaxed text-slate-500 sm:px-8">
          By continuing you agree to our{' '}
          <Link
            href="/terms"
            className="font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* ── The panel ────────────────────────────────────────────────
          Hidden below lg, where it would push the form off the fold. The form
          side carries the wordmark, so a phone still knows whose sign-in it is. */}
      <div className="relative hidden w-1/2 overflow-hidden bg-plug-navy-950 lg:flex lg:items-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-plug-blue-600/25 blur-[130px]" />
          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
          {/* Catches the light along the left edge, so the panel reads as a
              surface set beside the form rather than a hole in the page. */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-lg px-12 xl:px-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
            <Zap size={12} aria-hidden="true" />
            Plug.pk
          </span>

          {/*
            The gradient phrase is kept whole.

            At max-w-md this wrapped as "Pakistan's EV / network, in / one
            account" — the highlight split across two lines with "in" left
            dangling at the end of the second, which is the one break a
            two-colour heading cannot survive. A wider column fixes the
            common case; `whitespace-nowrap` on the phrase guarantees it,
            so the heading can only ever break at the comma.
          */}
          <h2 className="mt-6 font-display text-[clamp(1.875rem,2.8vw,2.375rem)] font-bold leading-[1.12] tracking-tight text-white">
            Pakistan&apos;s EV network,{' '}
            <span className="whitespace-nowrap bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              in one account
            </span>
          </h2>

          <ul className="mt-9 flex flex-col gap-6">
            {VALUE.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05]"
                >
                  <item.icon size={17} className="text-plug-cyan-300" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{item.title}</span>
                  {/* white/65 rather than the white/50 the old card used. */}
                  <span className="mt-1 block text-ui-sm leading-relaxed text-white/65">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {figures.length > 0 ? (
            <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6">
              {figures.map((figure) => (
                <div key={figure.label}>
                  <dt className="sr-only">{figure.label}</dt>
                  <dd>
                    <span className="font-mono text-xl font-bold text-white">
                      {figure.value.toLocaleString('en-PK')}
                    </span>
                    <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/45">
                      {figure.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  )
}
