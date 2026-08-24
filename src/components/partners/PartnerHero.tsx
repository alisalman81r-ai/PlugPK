// src/components/partners/PartnerHero.tsx
import { Building2, Check, MapPin, Plug, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { PillButton } from '@/components/ui'

/**
 * The pitch at the top of Partner Up.
 *
 * Same band as /map, /routes and /community: slate-950 with discrete pools of
 * light, rounded off at the bottom, with the next card lifted up into it. It was
 * `bg-gradient-hero` — the flat navy-to-teal ramp the other heroes dropped,
 * because it put the headline on one colour and everything below it on a
 * visibly different one, and anything white landing mid-ramp got the least
 * contrast to work against.
 *
 * It was also a two-column layout, with a mock dashboard filling the right half.
 * That mock is the most persuasive thing on the page — it is what a host
 * actually gets — and at half the width of a 1280px container it was a thumbnail
 * of itself. It now has the whole measure to itself as the lifted card
 * (PartnerDashboardPreview), which is where /map keeps its filter rail and
 * /routes its popular routes.
 *
 * Deliberately carries no invented metrics. Reference designs for this kind of
 * page lean on lines like "2,000+ active drivers" and "15,000 views a month",
 * and every one of those on a young product is a number somebody made up. The
 * counts here are passed in from the database, and any that are still zero are
 * left out rather than dressed up.
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
  'Free to list — no card, no time limit',
  'You set your own rates and keep every rupee',
  'Live on the map once we verify the details',
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
    <header className="relative rounded-b-[2rem] bg-slate-950 pb-32 pt-10 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-14">
      {/* The decoration clips itself so the band does not have to: the preview
          card below is lifted up into this padding and paints above it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        <div className="absolute -bottom-48 right-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
      </div>

      <div className="container-plug relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
            <Plug size={12} aria-hidden="true" />
            Partner Up
          </span>

          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            Put your charger in front of{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              Pakistan&apos;s EV drivers
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
            A bank of chargers at your hotel or the single unit on your driveway — listing it
            puts it on the map drivers search when they need a charge, and gives you a
            dashboard showing who found you.
          </p>

          {/*
            The three promises, on one line rather than stacked.

            As a bulleted column they were the tallest thing in the band and read
            as terms and conditions. As chips they read as what they are: the
            three objections somebody has before they start the form.
          */}
          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {PROMISES.map((promise) => (
              <li
                key={promise}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-ui-sm text-white/80 backdrop-blur-sm"
              >
                <Check size={13} className="shrink-0 text-plug-cyan-300" aria-hidden="true" />
                {promise}
              </li>
            ))}
          </ul>

          {/* ── Actions ──────────────────────────────────────────────
              The same pair as /community: a gradient pill for the thing that
              starts here, and the badge-and-arrow pill for the one that leaves
              the page. Both 56px, because a hairline ghost button beside a
              filled one is decoration rather than a second choice. */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-7 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <Plug size={17} aria-hidden="true" />
              List your charger
            </Link>

            <PillButton href="#pricing" tone="light">
              See the plans
            </PillButton>
          </div>

          {figures.length >= 2 ? (
            <dl className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center divide-white/10 sm:divide-x">
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
          ) : (
            /* white/60 rather than the white/45 this line used, which was well
               under 4.5:1 and is the one sentence a first visitor reads. */
            <p className="mt-8 text-ui-sm text-white/60">
              We are building the map now — early listings are the first drivers see.
            </p>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * One figure in the band.
 *
 * The same Stat as the map, route and community heroes — mono numeral, hairline
 * divider, a label small enough that the number is what the eye lands on.
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
    <div className="px-5 py-1 text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-center justify-center gap-1.5">
          {Icon ? (
            <Icon
              size={14}
              aria-hidden={true}
              className={tone === 'cyan' ? 'text-plug-cyan-400' : 'text-white/40'}
            />
          ) : null}
          <span className="font-mono text-lg font-bold text-white">
            {value.toLocaleString('en-PK')}
          </span>
        </span>
        <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/45">
          {label}
        </span>
      </dd>
    </div>
  )
}
