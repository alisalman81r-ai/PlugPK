// src/app/(auth)/layout.tsx
import { ArrowLeft, Lock, MapPin, Route, Zap, type IconType } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { AuthCount, AuthReplay } from '@/components/auth/AuthMotion'
import { AuthRoute } from '@/components/auth/AuthRoute'
import motion from '@/components/auth/auth-motion.module.css'
import { Logo } from '@/components/ui/Logo'
import { getPlatformStats } from '@/lib/db/queries'

/**
 * The split shell every auth page renders inside — landing-v2's `.auth`:
 * the form on a dotted chalk ground with a soft volt glow behind its card,
 * and the brand on ink with a faint grid and a volt route drawing itself
 * along the foot. Below 1080px the brand side follows the form, so the form
 * is always the first thing on a phone.
 *
 * ── Honest figures ────────────────────────────────────────────────────
 *
 * The panel once ended on "Join 5,000+ EV owners" over five lettered circles.
 * Both were invented, on the one screen where somebody is deciding whether to
 * hand over an email address. What replaces it is counted, and prints nothing
 * when there is nothing to print.
 *
 * The three perks are only what a signed-in account genuinely changes. Saved
 * stations and saved routes are rows on the server and follow the account to
 * any device; compared cars live in this browser's storage, so they are not
 * part of the promise.
 */

/*
  Sign-in, sign-up and password help are kept out of search results. They
  were inheriting the root's `index: true`, so a search for the brand could
  surface a login form above the pages somebody actually wanted. robots.ts
  disallows the same paths; this covers a crawler that arrives by a link.
*/
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const VALUE: { icon: IconType; title: string; body: string }[] = [
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
    body: 'Keep the chargers you rely on and the routes you plan, on any device you sign in from.',
  },
]

/*
  page-auth.css "entrance": everything rises 22px out of nothing over 0.9s —
  the card first, then the line under it (.15s); on the brand side the title
  (.1s), the three perks (.2s, .27s, .34s) and the figures (.42s).
*/
const RISE = motion.rise
const PERK_DELAY = [motion.d20, motion.d27, motion.d34]

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  /*
    Decoration must never be able to break sign-in. These figures are the
    least important thing on the screen and the only part that touches the
    database: if that query fails the panel loses its stat line, not the form.
  */
  let stats: { stations: number; cities: number } | null = null
  try {
    const platform = await getPlatformStats()
    stats = { stations: platform.stations, cities: platform.cities }
  } catch {
    stats = null
  }

  const figures = [
    { value: stats?.stations ?? 0, label: stats?.stations === 1 ? 'Charging point' : 'Charging points' },
    { value: stats?.cities ?? 0, label: stats?.cities === 1 ? 'City' : 'Cities' },
  ].filter((figure) => figure.value > 0)

  return (
    <AuthReplay>
      <div className="grid min-h-viewport bg-chalk text-ink min-[1080px]:grid-cols-2">
        {/* ── Form side ────────────────────────────────────────────── */}
        <section
          data-theme="light"
          className="relative isolate flex min-h-viewport flex-col overflow-hidden px-[clamp(16px,4vw,48px)] pb-6 pt-4 [background:radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)_0_0/14px_14px,radial-gradient(90%_60%_at_20%_0%,#FAF9F6,#F4F3EE_70%)] sm:pt-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[46%] -z-10 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.22),transparent_70%)]"
          />

          <header className="flex items-center justify-between gap-3">
            <Link
              href="/"
              aria-label="plugpk home"
              className="inline-flex min-h-11 items-center rounded-full focus-visible:outline-none focus-visible:shadow-focus"
            >
              <Logo tone="light" size="text-[22px] sm:text-[24px]" />
            </Link>
            <Link
              href="/"
              className="group/back inline-flex min-h-11 items-center gap-2 rounded-full px-2.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:shadow-focus sm:px-4 sm:text-sm"
            >
              <ArrowLeft
                size={18}
                aria-hidden="true"
                className="transition-transform duration-300 ease-spring group-hover/back:-translate-x-[3px]"
              />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <div
              className={`w-full max-w-[500px] rounded-[22px] border border-ink/10 bg-white px-5 py-[26px] shadow-[0_1px_2px_rgba(11,12,14,.05),0_40px_80px_-40px_rgba(11,12,14,.35)] sm:rounded-[28px] sm:p-[clamp(28px,4vw,44px)] ${RISE}`}
            >
              {children}
            </div>

            {/* Said because it is true: the account stores a hash of the
                password, never the password itself. */}
            <p className={`mt-[22px] flex items-center gap-2 text-center text-[13px] text-muted ${RISE} ${motion.d15}`}>
              <Lock size={16} className="shrink-0 text-ink" aria-hidden="true" />
              Your password is never stored in readable form.
            </p>
          </div>

          {/* Links only, not a consent line: the sign-up checkbox records the
              agreement, and signing in agrees to nothing new. */}
          <footer className="flex justify-center gap-[22px]">
            <Link href="/terms" className="inline-flex min-h-11 items-center text-[13px] text-muted hover:text-ink">
              Terms of Service
            </Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center text-[13px] text-muted hover:text-ink">
              Privacy Policy
            </Link>
          </footer>
        </section>

        {/* ── Brand side ───────────────────────────────────────────── */}
        <aside
          data-theme="dark"
          aria-label="What your account gives you"
          className="relative isolate flex items-center overflow-hidden bg-ink px-[clamp(16px,6vw,56px)] pb-16 pt-14 text-white [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:56px_56px] min-[1080px]:p-[clamp(48px,6vw,96px)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[420px] -left-[260px] -z-10 h-[900px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
          />

          {/*
            The photo stands on its own on the far side, and only where there is
            room beside the copy — the copy never sits on it. An EV charging in
            Islamabad, the Faisal Mosque behind it: the image the site owner chose
            for this panel (credited in images/CREDITS.md).
          */}
          <div
            aria-hidden="true"
            className={`absolute bottom-6 right-6 top-6 hidden w-[34%] overflow-hidden rounded-[40px] min-[1640px]:block ${motion.fade}`}
          >
            <Image
              src="/images/auth/islamabad-charging.jpg"
              alt=""
              fill
              sizes="(min-width: 1640px) 34vw, 0px"
              className="object-cover object-[50%_62%] saturate-[.9]"
            />
          </div>

          <AuthRoute className="pointer-events-none absolute inset-0 hidden h-full w-full min-[1080px]:block min-[1640px]:w-[62%]" />

          <div className="relative z-[1] mx-auto w-full max-w-[620px] min-[1080px]:mx-0 min-[1080px]:max-w-[480px]">
            <h2 className={`m-0 mb-11 font-display text-[clamp(40px,4.2vw,64px)] leading-none ${RISE} ${motion.d10}`}>
              Pakistan&apos;s EV network, <span className="pg-bold block text-volt">in one account.</span>
            </h2>

            <ul className="grid gap-7">
              {VALUE.map((item, i) => (
                <li
                  key={item.title}
                  className={`grid grid-cols-[32px_1fr] items-start gap-[18px] ${RISE} ${PERK_DELAY[i] ?? ''}`}
                >
                  <item.icon
                    size={32}
                    aria-hidden="true"
                    className="-mt-[3px] text-volt drop-shadow-[0_0_10px_rgba(212,255,58,.35)]"
                  />
                  <div>
                    <b className="block font-display text-[22px] font-normal leading-[1.15]">{item.title}</b>
                    <p className="mt-2 text-[15px] leading-[1.55] text-fog">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            {figures.length > 0 ? (
              <dl className={`mt-11 flex flex-wrap gap-x-14 gap-y-6 border-t border-white/[0.09] pt-[30px] ${RISE} ${motion.d42}`}>
                {figures.map((figure) => (
                  <div key={figure.label} className="flex flex-col-reverse">
                    <dt className="mt-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-fog">
                      {figure.label}
                    </dt>
                    <dd className="font-mono text-[40px] font-semibold leading-none tabular-nums">
                      <AuthCount value={figure.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </aside>
      </div>
    </AuthReplay>
  )
}
