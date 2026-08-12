// src/components/services/ServiceCard.tsx
'use client'

import { MapPin, Package, Phone, ShieldCheck } from 'lucide-react'
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

const HOVER =
  'group transition-all duration-[250ms] ease-spring hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover'

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
      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-plug-blue-600 text-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
    >
      <Phone size={14} aria-hidden="true" />
      Contact
    </a>
  )

  const detailsButton = (
    <Link
      href={detailHref}
      className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
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

          <p className="mt-2 line-clamp-1 text-sm text-slate-500">{service.description}</p>

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
    <article
      style={style}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white',
        HOVER,
        className,
      )}
    >
      <div className="relative h-40 overflow-hidden">
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

        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <Icon size={14} className={meta.tone.split(' ')[1]} aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-700">{meta.label}</span>
        </span>

        {service.isVerified ? (
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-plug-blue-600 px-2.5 py-1.5">
            <ShieldCheck size={12} className="text-white" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-white">Verified</span>
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <h3 className="mb-1.5 line-clamp-1 text-ui-lg font-bold text-slate-900">{service.name}</h3>

        <p className="mb-3 flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="line-clamp-1 text-ui-sm text-slate-500">{location}</span>
        </p>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {service.description}
        </p>

        <div className="mb-4 flex items-center justify-between">
          <RatingStars
            rating={service.rating}
            reviewCount={service.reviewCount}
            size="sm"
            showNumber
            showCount
          />
        </div>

        <div className="flex gap-2">
          {contactButton}
          {detailsButton}
        </div>
      </div>
    </article>
  )
}
