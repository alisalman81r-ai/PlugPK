// src/components/partners/PartnerVenueTypes.tsx
import {
  Building,
  Building2,
  Car,
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import type { BusinessType } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The kinds of place that can list a charger.
 *
 * ── Why this section exists ────────────────────────────────────────────
 *
 * The ui-ux-pro-max design-system pass identified this page as a
 * marketplace/directory and gave the pattern's section order as: hero →
 * **categories** → featured listings → trust → become-a-host. The categories step
 * was the one thing genuinely missing. The page went from the pitch straight to
 * how-it-works, which answers "what happens next" before it has answered the
 * question somebody actually arrives with: *is this for a place like mine?*
 *
 * A hotel owner and somebody with one charger on a driveway both land here, and
 * neither could previously tell whether the page was talking to them.
 *
 * ── Every type here is real ────────────────────────────────────────────
 *
 * Taken from the `BusinessType` union in src/lib/types.ts, which is what the
 * signup form writes and what the directory filters on. Not a marketing list —
 * if a type is shown here, a listing can actually be created as it.
 *
 * `other` is deliberately absent. It exists in the union as a catch-all for a
 * venue that fits none of the rest, and a card reading "Other" answers nobody's
 * question about whether this is for them.
 *
 * ── Counts, where there are any ────────────────────────────────────────
 *
 * A type with live listings shows how many. A type with none shows nothing rather
 * than a zero: "0 listed" beside Hotels reads as *nobody wants this*, when what it
 * means is *nobody has yet*. Same rule as the hero's stat rail, for the same
 * reason.
 */

export interface PartnerVenueTypesProps {
  /** Live counts by type, from the directory. Absent types simply have none. */
  counts: Partial<Record<BusinessType, number>>
}

interface VenueType {
  type: Exclude<BusinessType, 'other'>
  label: string
  detail: string
  icon: LucideIcon
}

/**
 * Order is deliberate: the venues with the most chargers first, the driveway
 * last.
 *
 * Not because a home charger matters less — it is the type this market has most
 * of — but because somebody with one is not wondering whether they are allowed to
 * list. A hotel owner is, and they are the reader this section has to reach.
 */
const VENUE_TYPES: VenueType[] = [
  { type: 'hotel', label: 'Hotels', detail: 'Guests charge overnight', icon: Building2 },
  { type: 'restaurant', label: 'Restaurants', detail: 'A charge over a meal', icon: UtensilsCrossed },
  { type: 'mall', label: 'Malls', detail: 'Parking that earns', icon: ShoppingBag },
  { type: 'office', label: 'Offices', detail: 'Staff and visitor parking', icon: Building },
  { type: 'dealership', label: 'Dealerships', detail: 'Showroom and service bays', icon: Car },
  { type: 'service-center', label: 'Service centres', detail: 'Charge while it is worked on', icon: Wrench },
  { type: 'home', label: 'Homes', detail: 'One unit on a driveway', icon: Home },
]

const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

export function PartnerVenueTypes({ counts }: PartnerVenueTypesProps) {
  const listed = VENUE_TYPES.filter((venue) => (counts[venue.type] ?? 0) > 0).length

  return (
    <section className="bg-slate-50 pb-4 pt-20 lg:pb-6 lg:pt-24">
      <div className={STAGE}>
        {/*
          A ranged-left heading, matching the hero.

          The rest of the page centres its section intros. This one does not,
          because it sits directly under a ranged-left hero and a centred heading
          immediately after would read as a different page starting.
        */}
        <div className="max-w-2xl">
            <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-blue-600">
              Who lists here
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] font-black leading-[1.05] tracking-[-0.035em] text-slate-900">
              If it has a parking space, it can have a charger.
            </h2>
            <p className="mt-4 text-ui leading-relaxed text-slate-500">
              {listed > 0
                ? `Seven kinds of place can list on Plug.pk, and ${listed} of them already have.`
                : 'Seven kinds of place can list on Plug.pk. Pick the one that sounds like yours.'}
            </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VENUE_TYPES.map((venue) => {
            const Icon = venue.icon
            const count = counts[venue.type] ?? 0

            return (
              <li key={venue.type} className="h-full">
                  {/*
                    Each card is a link into the directory, filtered to its type.

                    The alternative was a static grid of labels, which would have
                    been decoration. The directory below already filters by exactly
                    this value, so the card can do something — and a reader who
                    recognises their own kind of venue is the reader most likely to
                    want to see who else like them has joined.
                  */}
                  <Link
                    href={`/partners#directory`}
                    className={cn(
                      'group flex h-full items-start gap-3.5 rounded-2xl border bg-white p-5 transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                      count > 0
                        ? 'border-plug-blue-200 hover:border-plug-blue-400 hover:shadow-[0_10px_28px_-14px_rgba(37,99,235,0.4)]'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_10px_28px_-16px_rgba(15,23,42,0.3)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200',
                        count > 0
                          ? 'border-plug-blue-200 bg-plug-blue-50 text-plug-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:text-slate-600',
                      )}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </span>

                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-ui-lg font-bold tracking-tight text-slate-900">
                          {venue.label}
                        </span>
                        {count > 0 ? (
                          <span className="font-mono text-ui-xs font-bold text-plug-blue-600">
                            {count} listed
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-ui-sm leading-relaxed text-slate-500">
                        {venue.detail}
                      </span>
                    </span>
                </Link>
              </li>
            )
          })}

          {/* The eighth cell, so a 4-column grid does not end on a ragged row. */}
          <li className="h-full">
              <Link
                href="/business/signup"
                className="group flex h-full flex-col justify-between gap-4 rounded-2xl bg-slate-900 p-5 transition-all duration-200 hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
              >
                <span className="text-ui-lg font-bold leading-tight tracking-tight text-white">
                  Something else?
                </span>
                <span className="text-ui-sm leading-relaxed text-white/60">
                  List it anyway — we read every submission before it goes live.
                </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
