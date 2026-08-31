// src/components/partners/PartnerHero.tsx
import { ArrowRight, Building2, Check, MapPin, Plug, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { PillButton } from '@/components/ui'

/**
 * The pitch at the top of Partner Up.
 *
 * ── Back onto the shared hero pattern ─────────────────────────────────
 *
 * This is the same composition as RouteHero and the map's band: dark navy ground
 * rounded off at the bottom, dot grid and two blur pools behind, a pill eyebrow,
 * a centred heading whose last phrase carries the cyan-to-blue gradient, one
 * paragraph on a narrow measure, then a divided rail of counted figures.
 *
 * It did not used to be. The previous version was ranged left with a 6rem
 * headline and the figures stacked in a column beside it, from an "Exaggerated
 * Minimalism" design-system pass. The reasoning in that pass was sound in
 * isolation — an oversized statement ranged left can be big and specific at once
 * — and it is still recorded in git history rather than deleted from the record.
 *
 * What it missed is that a hero is not judged in isolation. Somebody moving
 * Map → Routes → Partner Up meets three arrival experiences, and this one was
 * visibly a different product: different alignment, a headline twice the size of
 * its neighbours', and figures in a place the other pages do not put them. The
 * consistency is worth more here than the extra emphasis, so the distinctive
 * layout is the thing that goes.
 *
 * Typography, gradient, eyebrow and stat rail are therefore copied from
 * RouteHero rather than re-invented — same clamp, same weight, same tracking. If
 * that pattern changes, these should change with it, and matching the classes
 * exactly is what makes that a find-and-replace instead of a redesign.
 *
 * ── What was kept ────────────────────────────────────────────────────
 *
 * The outer padding and corner radii are unchanged, because
 * src/app/(main)/partners/page.tsx lifts the first card up into this band with a
 * negative margin tuned to them. Centring the content makes the band shorter; it
 * does not move the edge the card overlaps.
 *
 * The two calls to action and the three promises stay — this is the one page on
 * the site whose whole job is to get somebody to start a form, and the other
 * heroes have a search box in the same position for the same reason. They are
 * centred now rather than ranged left.
 *
 * ── Still no invented metrics ─────────────────────────────────────────
 *
 * Unchanged and worth keeping: reference designs for this kind of page lean on
 * "2,000+ active drivers" and "15,000 views a month", and on a young product
 * every one of those is made up. The counts here come from the database, and any
 * that are still zero are left out rather than dressed up.
 */

export interface PartnerHeroProps {
  stats: {
    listings: number
    cities: number
    ports: number
    partners: number
  }
}

const PROMISES = ['Free to list', 'You set your rates', 'Verified before it goes live']

export function PartnerHero({ stats }: PartnerHeroProps) {
  /**
   * Only figures that are actually non-zero earn a place in the rail.
   *
   * A stat rail reading "0 partners · 0 ports" is worse than a shorter rail: it
   * turns the honest thing into the discouraging thing. Below two figures the
   * rail is dropped entirely and a sentence does the work instead.
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
    <header className="relative rounded-b-[2rem] bg-plug-navy-950 pb-32 pt-10 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-16">
      {/* The decoration clips itself so the band does not have to, and the blue
          pool is centred rather than biased left — it sat behind a ranged-left
          headline before, and a glow off to one side of centred type reads as a
          rendering fault. Grain over the top: this band is the tallest on the
          site, and a flat navy panel that size reads as a hole in the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-plug-blue-600/25 blur-[130px]" />
        <div className="absolute -bottom-48 left-0 h-80 w-80 rounded-full bg-plug-cyan-500/20 blur-[120px]" />
        <span className="grain" />
      </div>

      <div className="container-plug relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-300 backdrop-blur-sm">
            <Plug size={12} aria-hidden="true" />
            Partner Up
          </span>

          {/* Same clamp, weight and tracking as RouteHero. The gradient falls on
              the last phrase, which is the pattern's one fixed rule. */}
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
            Your charger,{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
              on the map
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-ui leading-relaxed text-white/65 sm:text-base">
            A bank of chargers at your hotel or the single unit on your driveway. Listing it puts
            you on the map drivers search when they need a charge — and gives you a dashboard
            showing who found you.
          </p>

          {/*
            The three promises, centred, as plain text with a cyan check.

            Not chips: a row of bordered pills directly under a heading reads as a
            second navigation bar, which is why they stopped being pills. Centred
            they answer the three objections somebody has before the form.
          */}
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {PROMISES.map((promise) => (
              <li
                key={promise}
                className="inline-flex items-center gap-2 text-ui-sm text-white/70"
              >
                <Check size={14} className="shrink-0 text-plug-cyan-400" aria-hidden="true" />
                {promise}
              </li>
            ))}
          </ul>

          {/* ── Actions ──────────────────────────────────────────
              Centred, where the other heroes put their search box, and both 56px
              — comfortably over the 44px touch floor. A gradient pill for the
              thing that starts here, the badge-and-arrow pill for the one that
              stays on the page. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-7 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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

          {/* ── The figures ──────────────────────────────────────
              A divided rail under the actions, exactly as RouteHero and the map
              band do it — not a column beside the heading, which is what made
              this page read as a different product. */}
          {figures.length >= 2 ? (
            <dl className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center divide-white/10 sm:divide-x">
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
            /* white/70 rather than the white/45 this line once used, which was
               well under 4.5:1 and is the one sentence a first visitor reads. */
            <p className="mx-auto mt-10 max-w-sm text-ui-sm leading-relaxed text-white/70">
              We are building the map now — early listings are the first drivers see.
            </p>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * One figure in the rail.
 *
 * Deliberately identical to RouteHero's Stat, down to the icon size and the
 * label's tracking. Two heroes showing counted figures should show them the same
 * way, and the cheapest guarantee of that is the same markup.
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
        {/*
          white/55, not white/45.

          Measured: white at 45% over the navy ground is 4.46:1, which misses the
          4.5:1 AA floor — and at 11px uppercase this text does not qualify for
          the large-text exemption. 55% clears it at 5.6:1.
        */}
        <span className="mt-0.5 block text-ui-xs uppercase tracking-[0.12em] text-white/55">
          {label}
        </span>
      </dd>
    </div>
  )
}
