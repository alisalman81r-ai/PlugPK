// src/app/(main)/services/[category]/[slug]/page.tsx
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Globe,
  Home,
  LifeBuoy,
  Mail,
  MapPin,
  Navigation2,
  Package,
  Phone,
  Shield,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ReviewsSection } from '@/components/station/ReviewsSection'
import { RatingStars } from '@/components/ui'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META, SERVICE_OFFERINGS } from '@/lib/constants'
import { getServiceBySlug, getServiceParams } from '@/lib/db/queries'
import type { DayHours, ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PageProps {
  params: { category: string; slug: string }
}

const ICONS: Record<string, LucideIcon> = { Car, Wrench, Home, Package, Shield, LifeBuoy }

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

const DAY_LABEL: Record<(typeof DAYS)[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

function formatDay(hours: DayHours): string {
  return hours.isClosed ? 'Closed' : `${hours.open} – ${hours.close}`
}

function resolveCategory(value: string): ServiceCategory | null {
  return SERVICE_CATEGORY_KEYS.find((key) => key === value) ?? null
}

export async function generateStaticParams() {
  return getServiceParams()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const service = await getServiceBySlug(params.category, params.slug)
  if (!service) return { title: 'Service Not Found' }

  const meta = SERVICE_CATEGORY_META[service.category]
  return {
    title: `${service.name} — ${meta.label}`,
    description: `${service.name} in ${service.address.city}. Rated ${service.rating}/5 by ${service.reviewCount} reviews.`,
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const category = resolveCategory(params.category)
  const service = await getServiceBySlug(params.category, params.slug)

  if (!category || !service) notFound()

  const meta = SERVICE_CATEGORY_META[service.category]
  const Icon = ICONS[meta.icon] ?? Package
  const offerings = SERVICE_OFFERINGS[service.category]
  const telHref = `tel:${service.phone.replace(/[^\d+]/g, '')}`
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${service.coordinates.lat},${service.coordinates.lng}`
  const fullAddress = `${service.address.street}, ${service.address.area}, ${service.address.city}`

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero py-16">
        {/* The business's own photograph, held well back so the breadcrumb
            and heading keep their contrast against it. */}
        {service.coverPhoto ? (
          <div aria-hidden="true" className="absolute inset-0">
            <Image
              src={service.coverPhoto}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
          </div>
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="container-plug relative z-10">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/services"
              className="group/back flex items-center gap-1.5 font-medium text-white/70 transition-colors hover:text-white"
            >
              <ChevronLeft
                size={16}
                className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
                aria-hidden="true"
              />
              All Services
            </Link>
            <span aria-hidden="true" className="text-white/30">
              /
            </span>
            <Link
              href={`/services/${service.category}`}
              className="font-medium text-white/70 transition-colors hover:text-white"
            >
              {meta.label}
            </Link>
            <span aria-hidden="true" className="text-white/30">
              /
            </span>
            <span className="line-clamp-1 text-white/50">{service.name}</span>
          </nav>

          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
            <Icon size={14} className={meta.tone.split(' ')[1]} aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-700">{meta.label}</span>
          </span>

          <h1 className="mb-4 flex flex-wrap items-center gap-3 text-3xl font-black text-white lg:text-4xl">
            {service.name}
            {service.isVerified ? (
              <ShieldCheck
                size={24}
                className="shrink-0 text-plug-cyan-400"
                aria-label="Verified business"
              />
            ) : null}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-5">
            <RatingStars
              rating={service.rating}
              reviewCount={service.reviewCount}
              size="md"
              showNumber
              showCount
              className="[&_span]:text-white/70"
            />
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <MapPin size={15} className="shrink-0" aria-hidden="true" />
              {service.address.area}, {service.address.city}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-white/60">
              <Phone size={15} className="shrink-0" aria-hidden="true" />
              {service.phone}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center gap-2 rounded-xl bg-gradient-brand px-6 font-semibold text-white shadow-[0_12px_35px_rgba(37,99,235,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              <Navigation2 size={18} aria-hidden="true" />
              Get Directions
            </a>
            <a
              href={telHref}
              className="flex h-12 items-center gap-2 rounded-xl border border-white bg-transparent px-6 font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              <Phone size={18} aria-hidden="true" />
              Call Now
            </a>
          </div>
        </div>
      </section>

      <div className="container-plug py-16">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">About {service.name}</h2>
              <p className="leading-relaxed text-slate-600">{service.description}</p>
            </section>

            <hr className="my-10 border-slate-100" />

            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Services Offered</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {offerings.map((offering) => (
                  <span key={offering} className="flex items-center gap-2">
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-green-500"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-700">{offering}</span>
                  </span>
                ))}
              </div>
            </section>

            <hr className="my-10 border-slate-100" />

            <ReviewsSection
              reviews={[]}
              rating={service.rating}
              reviewCount={service.reviewCount}
              stationId={service.id}
              stationName={service.name}
            />
          </div>

          <aside className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-5 font-bold text-slate-900">Contact &amp; Location</h3>

              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Phone size={20} className="text-plug-blue-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase text-slate-400">Phone</span>
                  <span className="block truncate font-semibold text-slate-900">
                    {service.phone}
                  </span>
                </span>
              </div>

              <a
                href={telHref}
                className="mb-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <Phone size={16} aria-hidden="true" />
                Call Now
              </a>

              {service.email ? (
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Mail size={20} className="text-plug-blue-600" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase text-slate-400">Email</span>
                    <a
                      href={`mailto:${service.email}`}
                      className="block truncate font-semibold text-slate-900 hover:text-plug-blue-600"
                    >
                      {service.email}
                    </a>
                  </span>
                </div>
              ) : null}

              {service.website ? (
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Globe size={20} className="text-plug-blue-600" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase text-slate-400">Website</span>
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-semibold text-plug-blue-600 hover:underline"
                    >
                      {service.website.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                </div>
              ) : null}

              <hr className="my-5 border-slate-100" />

              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <MapPin size={20} className="text-plug-blue-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase text-slate-400">Location</span>
                  <span className="block text-sm leading-relaxed text-slate-700">
                    {fullAddress}
                  </span>
                </span>
              </div>

              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-plug-blue-600 text-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
              >
                <Navigation2 size={16} aria-hidden="true" />
                Get Directions
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                <Clock size={18} className="text-plug-blue-600" aria-hidden="true" />
                Operating Hours
              </h3>

              {service.operatingHours.is24Hours ? (
                <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                  Open 24 Hours
                </span>
              ) : (
                <div className="flex flex-col gap-1">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm font-medium text-slate-700">{DAY_LABEL[day]}</span>
                      <span className="font-mono text-sm text-slate-500">
                        {formatDay(service.operatingHours[day])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {service.isVerified ? (
              <div className={cn('flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5')}>
                <ShieldCheck
                  size={24}
                  className="shrink-0 text-plug-blue-600"
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-bold text-blue-900">Verified Business</span>
                  <span className="block text-sm text-blue-700">
                    This business has been verified by the Plug.pk team.
                  </span>
                </span>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}
