// src/components/services/ServiceCard.tsx
'use client'

import { ArrowRight, MapPin, Package, Phone, Star } from '@/components/ui/icons'
import Link from 'next/link'

import { PhotoFrame } from '@/components/ui'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import type { EVService } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON } from './ServiceCategoryTabs'

export interface ServiceCardProps {
  service: EVService
  variant?: 'default' | 'horizontal'
  /**
   * Filtered out of the directory. The card stays in the DOM, hidden, as
   * page-services.js keeps it: that is what lets Flip fade it out where it
   * stood and bring it back from there.
   */
  hidden?: boolean
  className?: string
}

/*
  No ratings on service cards.

  Each row carries a rating and a review count, but they were seeded figures:
  plugpk has no review table for services and no way for anyone to leave one.
  A star score with nothing behind it is an invented claim, so the card says
  "No reviews yet" until reviews exist to count.

  "Verified" is shown only when an operator has ticked isVerified on the row.
  There is no verification procedure in the code beyond the approval every
  listing gets, so the badge is that explicit flag and nothing inferred.
*/
const NO_REVIEWS = 'No reviews yet'

/**
 * A directory listing, as landing-v2's .svc card: a 16:10 cover with the
 * category pill and the Verified tag on it, the name in Power Grotesk, and a
 * footer with Contact and Details.
 *
 * The whole card is the link to the detail page, via a stretched anchor on
 * the heading rather than a wrapper around everything, and the phone link is
 * lifted above it — so there is never an <a> inside an <a>, and a tap on
 * Contact always dials rather than opening the listing.
 *
 * `horizontal` is the list view: the cover on the left, the actions in a
 * column on the right (below them on a phone).
 */
export function ServiceCard({
  service,
  variant = 'default',
  hidden = false,
  className,
}: ServiceCardProps) {
  const meta = SERVICE_CATEGORY_META[service.category]
  const Icon = CATEGORY_ICON[meta.icon] ?? Package
  const detailHref = `/services/${service.category}/${service.slug}`
  const location = [service.address.area, service.address.city].filter((part) => part && part.trim()).join(', ')
  const list = variant === 'horizontal'

  return (
    <article
      hidden={hidden}
      data-svc=""
      data-flip-id={service.id}
      className={cn(
        'group relative flex overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1 [&[hidden]]:hidden',
        // .svc: the CSS `translate` property, not transform, so the lift on
        // hover never fights the transforms GSAP sets while the cards move.
        '[transition:translate_.5s_cubic-bezier(.16,1,.3,1),box-shadow_.5s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:border-ink/20 hover:shadow-e2 hover:[translate:0_-6px] focus-within:border-ink/20 focus-within:shadow-e2 focus-within:[translate:0_-6px] motion-reduce:transition-none',
        list ? 'flex-row rounded-[22px] sm:rounded-[28px]' : 'flex-col',
        className,
      )}
    >
      {/* ── Cover ── */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-stone',
          list ? 'w-[116px] sm:w-[220px] lg:w-[300px]' : 'aspect-[16/10]',
        )}
      >
        {service.coverPhoto ? (
          <PhotoFrame
            src={service.coverPhoto}
            alt={`${service.name} — ${meta.label}`}
            sizes={list ? '(max-width: 640px) 116px, 300px' : '(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 420px'}
            imageClassName="[transition:scale_.9s_cubic-bezier(.16,1,.3,1)] group-hover:[scale:1.07] motion-reduce:transition-none"
          />
        ) : (
          // The category's own mark, so a service without a photograph still
          // has a cover rather than a grey hole.
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-stone">
            <Icon size={list ? 36 : 64} className="text-ink/25" />
          </span>
        )}

        {/* A scrim from the top, so the pills read whatever the photograph has
            in that corner. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,.28),transparent_38%)]"
        />

        <span
          className={cn(
            'absolute left-3 top-3 z-[1] inline-flex h-[30px] items-center gap-1.5 rounded-full bg-paper/95 pl-[9px] pr-[11px] text-xs font-semibold text-ink shadow-[0_4px_14px_-6px_rgba(11,12,14,.4)] backdrop-blur-md',
            list && 'max-sm:left-2 max-sm:top-2 max-sm:h-8 max-sm:w-8 max-sm:justify-center max-sm:p-0',
          )}
        >
          <Icon size={17} className="shrink-0 text-volt-ink" aria-hidden="true" />
          <span className={cn(list && 'max-sm:sr-only')}>{meta.label}</span>
        </span>

        {service.isVerified === true ? (
          <span
            title="Marked as verified by the plugpk team"
            className={cn(
              'absolute right-3 top-3 z-[1] inline-flex h-7 items-center gap-[5px] rounded-full bg-ink/80 pl-2 pr-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md',
              list && 'max-sm:bottom-2 max-sm:left-2 max-sm:right-auto max-sm:top-auto max-sm:h-6 max-sm:px-1.5',
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-volt">
              <path d="m6 12.5 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={cn(list && 'max-sm:sr-only')}>Verified</span>
          </span>
        ) : null}
      </div>

      {/* ── Body ── */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          list
            ? 'px-4 pb-3 pt-3.5 sm:px-[26px] sm:py-[22px] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:content-center lg:gap-x-8'
            : 'px-[18px] pb-4 pt-[18px] sm:px-[22px] sm:pb-[18px] sm:pt-5',
        )}
      >
        <div className="min-w-0">
          {/* The clamp lives on the heading, not the anchor: line-clamp sets
              display:-webkit-box, which is not a reliable box to hang a
              stretched pseudo-element off. */}
          <h3
            className={cn(
              'line-clamp-1 font-display leading-[1.15] text-ink',
              list ? 'text-[19px] sm:text-[26px]' : 'text-[22px] sm:text-2xl',
            )}
          >
            <Link
              href={detailHref}
              className="rounded-sm after:absolute after:inset-0 after:z-[2] after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[28px] focus-visible:after:shadow-focus"
            >
              {service.name}
            </Link>
          </h3>

          <p className={cn('flex items-center gap-1.5 text-muted', list ? 'mt-1 text-[12.5px] sm:mt-2 sm:text-[13.5px]' : 'mt-2 text-[13.5px]')}>
            <MapPin size={15} className="shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </p>

          <p
            className={cn(
              'line-clamp-2 text-muted',
              list ? 'mt-2 max-w-[44rem] text-[13px] leading-[1.5] sm:mt-3 sm:text-[14.5px] sm:leading-[1.6]' : 'mt-3 text-[14.5px] leading-[1.6]',
            )}
          >
            {service.description}
          </p>

          <p
            className={cn(
              'flex items-center gap-1.5 font-mono font-medium uppercase tracking-[0.06em] text-[#7a7e85]',
              list ? 'mt-2 text-[10.5px] sm:mt-3 sm:text-[11.5px]' : 'mb-[18px] mt-3 text-[11.5px]',
            )}
          >
            <Star size={14} className="shrink-0" aria-hidden="true" />
            {NO_REVIEWS}
          </p>
        </div>

        {/* Pinned to the bottom by mt-auto, so cards in a row line up on their
            actions however long the names run. */}
        <div
          className={cn(
            'mt-auto flex items-center justify-between gap-2.5 border-t border-ink/10',
            list
              ? 'mt-2.5 pt-2 sm:mt-3.5 sm:pt-3.5 lg:m-0 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0 lg:py-0 lg:pl-[26px]'
              : 'pt-[18px]',
          )}
        >
          <a
            href={`tel:${service.phone.replace(/[^\d+]/g, '')}`}
            aria-label={`Contact ${service.name}, call ${service.phone}`}
            // z-[3] lifts it above the heading's stretched anchor; without
            // this the card link would swallow every tap on the phone number.
            className="relative z-[3] inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-ink/10 pl-3.5 pr-[18px] text-sm font-semibold text-ink [transition:background-color_.25s,border-color_.25s,color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)] hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:shadow-focus active:scale-[0.97] max-sm:text-[13px]"
          >
            <Phone size={17} aria-hidden="true" />
            Contact
          </a>

          {/* Decorative. The heading's stretched link already covers the card,
              so this is an affordance rather than a second control — hidden
              from screen readers to avoid announcing a duplicate. */}
          <span
            aria-hidden="true"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap pl-3 pr-1.5 text-sm font-semibold text-ink transition-colors duration-[250ms] group-hover:text-volt-ink max-sm:text-[13px]"
          >
            Details
            <ArrowRight size={17} className="shrink-0 [transition:translate_.35s_cubic-bezier(.34,1.56,.64,1)] group-hover:[translate:4px_0]" />
          </span>
        </div>
      </div>
    </article>
  )
}
