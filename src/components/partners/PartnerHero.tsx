// src/components/partners/PartnerHero.tsx
import { ArrowRight, Building2, Check, MapPin, Plug, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { PillButton, Reveal } from '@/components/ui'

/**
 * The pitch at the top of Partner Up.
 *
 * ── The direction, and where it came from ──────────────────────────────
 *
 * Redesigned on **Exaggerated Minimalism**: one oversized statement, short copy,
 * a dominant dark ground with a single sharp accent, and a lot of air. The
 * recommendation came out of the ui-ux-pro-max design-system pass for a
 * marketplace/directory page, and it suits this one better than the centred
 * layout it replaces — a page asking somebody to hand over a charger has exactly
 * one thing to say, and the old hero said it in six competing blocks all fighting
 * for the middle of the measure.
 *
 * Two of that pass's recommendations were rejected and it is worth recording why:
 *
 *   **EB Garamond / Lato.** It matched on "professional, traditional,
 *   trustworthy, formal, authoritative" and its own stated fit is law firms and
 *   government. The whole site moved to Poppins deliberately; a second typeface
 *   on one page would fragment it for a mood this page does not want.
 *
 *   **An orange #F97316 call to action.** The reasoning is sound in general — a
 *   CTA should not blend into a blue page — but the button here sits on
 *   slate-950 behind a cyan-to-blue gradient, which already clears the contrast
 *   bar. Adding a third brand colour to one page buys contrast we already have
 *   and costs the site its coherence.
 *
 * ── Asymmetry ─────────────────────────────────────────────────────────
 *
 * Left-aligned and off-centre rather than centred. An oversized headline centred
 * on a 1400px measure has to be short enough to balance, which is how a hero
 * ends up saying nothing; ranged left it can be big AND specific, and the figures
 * take the space beside it instead of stacking underneath.
 *
 * ── Still no invented metrics ─────────────────────────────────────────
 *
 * Unchanged from the previous version and worth keeping: reference designs for
 * this kind of page lean on "2,000+ active drivers" and "15,000 views a month",
 * and on a young product every one of those is made up. The counts here come from
 * the database, and any that are still zero are left out rather than dressed up.
 */

export interface PartnerHeroProps {
  stats: {
    listings: number
    cities: number
    ports: number
    partners: number
  }
}

const PROMISES = [
  'Free to list',
  'You set your rates',
  'Verified before it goes live',
]

export function PartnerHero({ stats }: PartnerHeroProps) {
  /**
   * Only figures that are actually non-zero earn a place in the rail.
   *
   * A stat rail reading "0 partners · 0 ports" is worse than a shorter rail: it
   * turns the honest thing into the discouraging thing. Below two figures the
   * rail is dropped entirely and the line underneath does the work instead.
   */
  const figures = [
    { icon: Zap, value: stats.listings, label: 'charging points', tone: 'cyan' as const },
    {
      icon: MapPin,
      value: stats.cities,
      label: stats.cities === 1 ? 'city' : 'cities',
      tone: 'plain' as const,
    },
    {
      icon: Building2,
      value: stats.partners,
      label: stats.partners === 1 ? 'partner' : 'partners',
      tone: 'plain' as const,
    },
  ].filter((figure) => figure.value > 0)

  return (
    <header className="relative overflow-hidden rounded-b-[2rem] bg-slate-950 pb-32 pt-10 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-16">
      {/*
        Atmosphere, in three layers.

        A dot grid for structure, two blur pools for depth, and grain over the
        top. The grid and the pools were already here; the grain is new, and it is
        what stops a panel this large and this dark reading as a hole in the page.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -top-52 left-[8%] h-[30rem] w-[46rem] rounded-full bg-plug-blue-600/25 blur-[140px]" />
        <div className="absolute -bottom-56 right-[-6%] h-96 w-96 rounded-full bg-plug-cyan-500/20 blur-[130px]" />
        <span className="grain" />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/*
          Bounded columns rather than `1fr_auto`.

          With a flexible first column the figures were shoved to the far right of
          a 1400px measure — about 900px of dead space between the headline and
          them, which is not asymmetry, just two things that have lost each other.
          Capping the text column at 46rem keeps the figures beside the statement
          where they can be read as belonging to it.
        */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,46rem)_minmax(0,1fr)] lg:items-end lg:gap-14">
          {/* ── The statement ───────────────────────────────────── */}
          <div className="max-w-3xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
                <Plug size={12} aria-hidden="true" />
                Partner Up
              </span>
            </Reveal>

            {/*
              The oversized line. 900 weight, -0.05em tracking, leading under 1,
              per the Exaggerated Minimalism spec.

              It is short on purpose. The headline it replaces — "Put your charger
              in front of Pakistan's EV drivers" — is a better sentence and a
              worse headline at this size: eleven words at 6rem wraps to four
              lines and stops being a statement. What it said is now the job of
              the paragraph underneath, where a sentence belongs.
            */}
            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.75rem,7.5vw,6rem)] font-black leading-[0.95] tracking-[-0.05em] text-white">
                Your charger,
                <br />
                <span className="bg-gradient-to-r from-plug-cyan-300 via-plug-cyan-400 to-plug-blue-400 bg-clip-text text-transparent">
                  on the map.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-white/70">
                A bank of chargers at your hotel or the single unit on your driveway. Listing it
                puts you on the map drivers search when they need a charge — and gives you a
                dashboard showing who found you.
              </p>
            </Reveal>

            {/*
              Three promises, as a plain inline list rather than chips.

              They were pills, and beside a 6rem headline a row of bordered pills
              reads as a second navigation bar. Set as text with a cyan check they
              are what they are: the three objections somebody has before they
              start the form.
            */}
            <Reveal delay={200}>
              <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {PROMISES.map((promise) => (
                  <li key={promise} className="inline-flex items-center gap-2 text-ui-sm text-white/70">
                    <Check size={14} className="shrink-0 text-plug-cyan-400" aria-hidden="true" />
                    {promise}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* ── Actions ─────────────────────────────────────────
                Both 56px, comfortably over the 44px minimum, and ranged left with
                the headline. A gradient pill for the thing that starts here, the
                badge-and-arrow pill for the one that stays on the page. */}
            <Reveal delay={260}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/business/signup"
                  className="group inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-7 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <Plug size={17} aria-hidden="true" />
                  List your charger
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </Link>

                <PillButton href="#pricing" tone="light">
                  See the plans
                </PillButton>
              </div>
            </Reveal>
          </div>

          {/* ── The figures ─────────────────────────────────────
              Beside the statement on a wide screen, under it on a narrow one.
              This is the asymmetry doing work: the space to the right of a
              ranged-left headline is where these belong, and stacking them
              underneath is what made the old hero six blocks tall. */}
          {figures.length >= 2 ? (
            <Reveal delay={320}>
              <dl className="flex flex-wrap gap-x-10 gap-y-6 lg:flex-col lg:gap-y-7 lg:border-l lg:border-white/10 lg:pl-10">
                {figures.map((figure) => (
                  <Stat
                    key={figure.label}
                    icon={figure.icon}
                    value={figure.value}
                    label={figure.label}
                    tone={figure.tone}
                  />
                ))}
              </dl>
            </Reveal>
          ) : (
            /* white/70 rather than the white/45 this line once used, which was
               well under 4.5:1 and is the one sentence a first visitor reads. */
            <Reveal delay={320}>
              <p className="max-w-xs text-ui-sm leading-relaxed text-white/70 lg:border-l lg:border-white/10 lg:pl-10">
                We are building the map now — early listings are the first drivers see.
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * One figure beside the statement.
 *
 * Larger than the version this replaces, and ranged left rather than centred in a
 * divided rail. At this size the numeral is the thing the eye lands on, which is
 * the only reason to show a figure at all.
 */
function Stat({
  icon: Icon,
  value,
  label,
  tone = 'plain',
}: {
  icon?: LucideIcon
  value: number
  label: string
  tone?: 'plain' | 'cyan'
}) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-baseline gap-2">
          {Icon ? (
            <Icon
              size={15}
              aria-hidden={true}
              className={tone === 'cyan' ? 'shrink-0 text-plug-cyan-400' : 'shrink-0 text-white/45'}
            />
          ) : null}
          <span className="font-mono text-[clamp(1.5rem,2.4vw,2.125rem)] font-bold leading-none tracking-tight text-white">
            {value.toLocaleString('en-PK')}
          </span>
        </span>
        {/*
          white/55, not white/45.

          Measured: white at 45% over slate-950 is 4.46:1, which misses the 4.5:1
          AA floor — and at 11px uppercase this text does not qualify for the
          large-text exemption. It was carried over from the previous hero, where
          the same mistake had already been caught and fixed on the sentence
          beneath but not on these labels. 55% clears it at 5.6:1.
        */}
        <span className="mt-1.5 block text-ui-xs uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
      </dd>
    </div>
  )
}
