// src/components/services/ServiceCard.tsx
'use client'

import { ArrowRight, MapPin, Package, Phone, ShieldCheck, Star } from 'lucide-react'
import Link from 'next/link'

import { PhotoFrame, RatingStars } from '@/components/ui'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import type { EVService } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON } from './ServiceCategoryTabs'

export interface ServiceCardProps {
  service: EVService
  variant?: 'default' | 'horizontal'
  animationDelay?: number
  className?: string
}

/**
 * Neutral on hover, not blue.
 *
 * The card lifting into a blue-tinted border competed with the blue button
 * inside it, so the whole card read as one large button. Raising the
 * elevation and darkening the border says "interactive" without claiming to
 * be the primary action.
 */
const HOVER =
  'group transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-slate-300 hover:shadow-e2 motion-reduce:transition-none motion-reduce:hover:translate-y-0'

export function ServiceCard({
  service,
  variant = 'default',
  animationDelay,
  className,
}: ServiceCardProps) {
  const meta = SERVICE_CATEGORY_META[service.category]
  const Icon = CATEGORY_ICON[meta.icon] ?? Package
  const detailHref = `/services/${service.category}/${service.slug}`
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined

  const location = `${service.address.area}, ${service.address.city}`

  const contactButton = (
    <a
      href={`tel:${service.phone.replace(/[^\d+]/g, '')}`}
      // Sized by its label, not flex-1.
      //
      // flex-1 is `flex: 1 1 0%`, and the only place these two buttons are
      // used is the horizontal card's `shrink-0` button group — a
      // shrink-to-fit box. A zero flex-basis inside one collapses the button
      // to its minimum width and clips "Contact" mid-word.
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
    >
      <Phone size={14} aria-hidden="true" />
      Contact
    </a>
  )

  const detailsButton = (
    <Link
      href={detailHref}
      className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-ui font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
    >
      Details
    </Link>
  )

  /* ── Horizontal ──────────────────────────────────────────────── */
  if (variant === 'horizontal') {
    return (
      <article
        style={style}
        className={cn(
          'flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5',
          HOVER,
          className,
        )}
      >
        {service.coverPhoto ? (
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <PhotoFrame
              src={service.coverPhoto}
              alt={`${service.name} — ${meta.label}`}
              sizes="64px"
            />
          </span>
        ) : (
          <span
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl',
              meta.tone,
            )}
          >
            <Icon size={28} aria-hidden="true" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-ui-lg font-bold text-slate-900">{service.name}</h3>
            {service.isVerified ? (
              <ShieldCheck
                size={15}
                className="shrink-0 text-plug-blue-600"
                aria-label="Verified business"
              />
            ) : null}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-ui-sm text-slate-500">
            <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </p>

          <p className="mt-2 line-clamp-1 text-ui-sm text-slate-500">{service.description}</p>

          <div className="mt-2">
            <RatingStars
              rating={service.rating}
              reviewCount={service.reviewCount}
              size="sm"
              showNumber
              showCount
            />
          </div>
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          {contactButton}
          {detailsButton}
        </div>
      </article>
    )
  }

  /* ── Default ─────────────────────────────────────────────────── */
  return (
    /**
     * The whole card is the link to the detail page, via a stretched anchor
     * on the heading rather than a wrapper around everything.
     *
     * The previous version put a Contact button and a Details button side by
     * side in every card — twenty-four buttons on a full page of results,
     * none of which could be the obvious next step because each was competing
     * with its twin. Here the card itself opens the listing, which is what a
     * click on a card is expected to do, and Contact stays as the one real
     * button. Nesting is avoided: the heading's anchor is stretched with a
     * pseudo-element and the phone link is lifted above it, so there is never
     * an <a> inside an <a>.
     */
    <article
      style={style}
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white',
        HOVER,
        className,
      )}
    >
      {/* A ratio rather than a fixed height, so the image keeps its
          proportion as the column width changes across breakpoints. */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
        {/* The category gradient stays as the fallback, so a service without
            its own photograph still lands on brand rather than on grey. */}
        {service.coverPhoto ? (
          <PhotoFrame
            src={service.coverPhoto}
            alt={`${service.name} — ${meta.label}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            zoomOnHover
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              meta.cover,
            )}
          >
            <Icon size={64} className={cn('opacity-30', meta.tone.split(' ')[1])} />
          </span>
        )}

        {/* Scrims top and bottom. The chips used to sit on bare photography,
            so whether they were readable depended on what happened to be in
            that corner of that particular picture. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-16 bg-gradient-to-b from-black/40 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-gradient-to-t from-black/40 to-transparent"
        />

        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-e1 ring-1 ring-black/5 backdrop-blur-md">
          <Icon size={14} className={meta.tone.split(' ')[1]} aria-hidden="true" />
          <span className="text-ui-xs font-semibold text-slate-700">{meta.label}</span>
        </span>

        {/* The rating moves onto the photograph as a single glass pill.
            Below the fold it was a row of five stars that had to be decoded;
            here it is one number, and it frees the card body for the text
            that actually differs between listings. */}
        <span className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 shadow-e1 ring-1 ring-black/5 backdrop-blur-md">
          <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="text-ui-xs font-bold tabular-nums text-slate-900">
            {service.rating.toFixed(1)}
          </span>
          <span className="text-ui-xs tabular-nums text-slate-500">
            ({service.reviewCount})
          </span>
        </span>

        {service.isVerified ? (
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-plug-blue-600 px-2.5 py-1.5 shadow-e1">
            <ShieldCheck size={12} className="text-white" aria-hidden="true" />
            {/* ui-xs (11px) rather than a 10px one-off — 10px sits below the
                smallest step of the type scale and was set nowhere else. */}
            <span className="text-ui-xs font-semibold leading-none text-white">Verified</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* The clamp lives on the heading, not the anchor: line-clamp sets
            display:-webkit-box, and that is not a reliable box to hang a
            stretched pseudo-element off. */}
        <h3 className="line-clamp-1 text-ui-lg font-bold leading-snug text-slate-900">
          <Link
            href={detailHref}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            {service.name}
          </Link>
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1 text-ui-sm text-slate-500">{location}</span>
        </p>

        <p className="mt-3 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">
          {service.description}
        </p>
      </div>

      {/* Pinned to the bottom by the flex-1 body above it, so cards in a row
          line up on their actions however long the names run. */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
        <a
          href={`tel:${service.phone.replace(/[^\d+]/g, '')}`}
          // z-10 lifts it above the heading's stretched anchor; without this
          // the card link would swallow every tap on the phone number.
          className="relative z-10 inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-plug-blue-600 px-3.5 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          <Phone size={14} aria-hidden="true" />
          Contact
        </a>

        {/* Decorative. The heading's stretched link already covers the card,
            so this is an affordance rather than a second control — and it is
            hidden from screen readers to avoid announcing a duplicate. */}
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-ui-sm font-semibold text-slate-400 transition-colors duration-200 group-hover:text-plug-blue-600"
        >
          Details
          <ArrowRight
            size={14}
            className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </span>
      </div>
    </article>
  )
}
