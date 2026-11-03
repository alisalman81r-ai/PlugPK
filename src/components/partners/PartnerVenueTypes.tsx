// src/components/partners/PartnerVenueTypes.tsx
import {
  ArrowUpRight,
  Building,
  Building2,
  Car,
  Home,
  Plug,
  ShoppingBag,
  UtensilsCrossed,
  Wrench,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'

import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { Eyebrow, H2_CLASS, Hl, LEAD_CLASS, WRAP } from '@/components/v2/ui'
import type { BusinessType } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The kinds of place that can list a charger (landing-v2's .pt-venues).
 *
 * It answers the question somebody actually arrives with — *is this for a place
 * like mine?* — before the page explains what happens next.
 *
 * ── Every type here is real ────────────────────────────────────────────
 *
 * Taken from the `BusinessType` union in src/lib/types.ts, which is what the
 * signup form writes and what the directory filters on. `other` is absent: a
 * card reading "Other" answers nobody's question; the eighth card ("Something
 * else?") covers it and goes straight to the signup form.
 *
 * ── Counts, where there are any ────────────────────────────────────────
 *
 * A type with live listings shows how many. A type with none shows nothing
 * rather than a zero: "0 listed" reads as *nobody wants this*, when what it
 * means is *nobody has yet*.
 */

export interface PartnerVenueTypesProps {
  /** Live counts by type, from the directory. Absent types simply have none. */
  counts: Partial<Record<BusinessType, number>>
}

interface VenueType {
  type: Exclude<BusinessType, 'other'>
  label: string
  detail: string
  icon: IconType
}

/** The venues with the most chargers first, the driveway last. */
const VENUE_TYPES: VenueType[] = [
  { type: 'hotel', label: 'Hotels', detail: 'Guests charge overnight', icon: Building2 },
  { type: 'restaurant', label: 'Restaurants', detail: 'A charge over a meal', icon: UtensilsCrossed },
  { type: 'mall', label: 'Malls', detail: 'Parking that earns', icon: ShoppingBag },
  { type: 'office', label: 'Offices', detail: 'Staff and visitor parking', icon: Building },
  { type: 'dealership', label: 'Dealerships', detail: 'Showroom and service bays', icon: Car },
  { type: 'service-center', label: 'Service centres', detail: 'Charge while it is worked on', icon: Wrench },
  { type: 'home', label: 'Homes', detail: 'One unit on a driveway', icon: Home },
]

const CARD =
  'group relative flex h-full items-start gap-3.5 rounded-[22px] border p-4 transition-[translate,box-shadow,border-color] duration-[450ms] ease-out hover:-translate-y-1 hover:shadow-e2 focus-visible:outline-none focus-visible:shadow-focus sm:min-h-[112px] sm:p-5'

const NAME = 'm-0 mb-1.5 mt-0.5 flex flex-wrap items-center gap-2 font-display text-[21px] font-normal leading-[1.1] pg-medium'

export function PartnerVenueTypes({ counts }: PartnerVenueTypesProps) {
  const listed = VENUE_TYPES.filter((venue) => (counts[venue.type] ?? 0) > 0).length

  return (
    <section data-theme="light" className="bg-chalk pb-[clamp(80px,9vw,128px)] pt-[clamp(96px,10vw,140px)]">
      <div className={WRAP}>
        <div className="mb-[clamp(36px,5vw,56px)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div>
            <Eyebrow>Who lists here</Eyebrow>
            <h2 className={cn(H2_CLASS, 'text-ink')}>
              If it has a parking space, <Hl>it can have a charger.</Hl>
            </h2>
          </div>
          <p className={cn(LEAD_CLASS, 'mb-1.5 mt-0 text-muted')}>
            {listed > 0
              ? `Seven kinds of place can list on plugpk, and ${listed} of them already ${listed === 1 ? 'has' : 'have'}.`
              : 'Seven kinds of place can list on plugpk. Pick the one that sounds like yours.'}
          </p>
        </div>

        <RevealGroup role="list" className="grid gap-2.5 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
          {VENUE_TYPES.map((venue) => {
            const Icon = venue.icon
            const count = counts[venue.type] ?? 0

            return (
              <RevealItem role="listitem" key={venue.type} className="h-full">
                {/* Each card links into the directory below, where the same
                    venue types are a filter. */}
                <Link
                  href="/partners#directory"
                  className={cn(
                    CARD,
                    'bg-white text-ink',
                    count > 0 ? 'border-[#BFEBD1]' : 'border-ink/10 hover:border-ink/20',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-chalk text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-volt"
                  >
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className={NAME}>
                      {venue.label}
                      {count > 0 ? (
                        <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-[#BFEBD1] bg-[#E9F8EF] px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#157A45] pg-none">
                          <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#1FA35B]" />
                          {count} listed
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-sm leading-normal text-muted">{venue.detail}</span>
                  </span>
                </Link>
              </RevealItem>
            )
          })}

          <RevealItem role="listitem" className="h-full">
            <Link
              href="/business/signup"
              className={cn(
                CARD,
                'isolate overflow-hidden border-ink bg-ink text-white before:absolute before:inset-0 before:-z-[1] before:bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.035)_22px_23px)]',
              )}
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-volt text-ink transition-colors duration-300 group-hover:bg-white"
              >
                <Plug size={22} />
              </span>
              <span className="min-w-0 pr-[22px]">
                <span className={NAME}>Something else?</span>
                <span className="block text-sm leading-normal text-white/70">
                  List it anyway — we read every submission before it goes live.
                </span>
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="absolute right-[18px] top-[18px] text-volt transition-transform duration-300 ease-spring group-hover:-translate-y-[3px] group-hover:translate-x-[3px]"
              />
            </Link>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}
