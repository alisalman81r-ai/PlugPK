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
  MessageSquare,
  Navigation2,
  Package,
  Phone,
  Shield,
  ShieldCheck,
  Wrench,
  type IconType,
} from '@/components/ui/icons'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META, SERVICE_OFFERINGS } from '@/lib/constants'
import { prebuiltParams } from '@/lib/db/build-params'
import { getServiceBySlug, getServiceParams } from '@/lib/db/queries'
import type { DayHours, ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { isInPakistan, safeHref } from '@/lib/validate'

interface PageProps {
  params: { category: string; slug: string }
}

const ICONS: Record<string, IconType> = { Car, Wrench, Home, Package, Shield, LifeBuoy }

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

/**
 * One day's hours, tolerating a listing that has none.
 *
 * A service can reach this page without opening hours: the public application
 * form does not ask for them — nobody should have to type a week of times
 * before anyone has agreed to list them — so the row carries the schema's `{}`
 * default until a reviewer fills them in. An admin adding a service by hand can
 * leave them empty the same way.
 *
 * Before this guard, `hours.isClosed` on an undefined day threw and took the
 * whole detail page to a 500. Saying the hours are not listed is both true and
 * survivable; claiming "Closed" for a business that simply has not told us
 * would be neither.
 */
function formatDay(hours: DayHours | undefined): string {
  if (!hours) return 'Not listed'
  return hours.isClosed ? 'Closed' : `${hours.open} – ${hours.close}`
}

function resolveCategory(value: string): ServiceCategory | null {
  return SERVICE_CATEGORY_KEYS.find((key) => key === value) ?? null
}

export async function generateStaticParams() {
  return prebuiltParams('/services/[category]/[slug]', () => getServiceParams())
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const service = await getServiceBySlug(params.category, params.slug)
  if (!service) return { title: 'Service Not Found' }

  const meta = SERVICE_CATEGORY_META[service.category]
  // The description used to quote a rating and a review count. Services have
  // no reviews behind them (see the Reviews section below), so it says what
  // the listing actually is instead.
  return {
    title: `${service.name} — ${meta.label}`,
    description: `${service.name}, ${meta.label.toLowerCase()} in ${service.address.city}. Contact details, location and opening hours on Plug.pk.`,
    alternates: { canonical: `/services/${service.category}/${service.slug}` },
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
  /*
    No directions without a real pin. Applications used to be stored at 0,0,
    and a "Get Directions" button built from that sent drivers to the Gulf of
    Guinea. Anything outside Pakistan is treated as "not set".
  */
  const hasPin = isInPakistan(service.coordinates.lat, service.coordinates.lng)
  const directionsHref = hasPin
    ? `https://www.google.com/maps/dir/?api=1&destination=${service.coordinates.lat},${service.coordinates.lng}`
    : null
  // Rendered through safeHref: a website stored before input was checked
  // could be a javascript: link.
  const website = safeHref(service.website)
  const fullAddress = [service.address.street, service.address.area, service.address.city]
    .filter((part) => part && part.trim())
    .join(', ')

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
            {/* Shown only when an operator has ticked isVerified on the row.
                There is no verification procedure in the code beyond the
                approval every listing gets, so this is the operator's own
                assertion, never inferred from anything else. */}
            {service.isVerified === true ? (
              <ShieldCheck
                size={24}
                className="shrink-0 text-plug-cyan-400"
                aria-label="Verified business"
              />
            ) : null}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-5">
            {/* No star rating. The rating and review count on a service row
                were seeded figures with no reviews behind them — services
                cannot be reviewed on Plug.pk — so showing them would be
                presenting an invented score as drivers' opinion. */}
            <span className="text-sm text-white/60">No reviews yet</span>
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <MapPin size={15} className="shrink-0" aria-hidden="true" />
              {[service.address.area, service.address.city].filter((part) => part && part.trim()).join(', ')}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-white/60">
              <Phone size={15} className="shrink-0" aria-hidden="true" />
              {service.phone}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {directionsHref ? (
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center gap-2 rounded-xl bg-gradient-brand px-6 font-semibold text-white shadow-[0_12px_35px_rgba(11,51,44,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              >
                <Navigation2 size={18} aria-hidden="true" />
                Get Directions
              </a>
            ) : null}
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

            {/* The station reviews widget used to sit here with an empty list
                and the row's seeded rating, and its form posted a "station"
                review against a service id. Services have no review table, so
                the honest state is the empty one. */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Reviews</h2>
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                <MessageSquare size={20} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-slate-600">
                  <span className="block font-semibold text-slate-900">No reviews yet</span>
                  Plug.pk does not collect reviews for services yet, so there is no rating to show.
                </p>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-5 font-bold text-slate-900">Contact &amp; Location</h3>

              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50">
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50">
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

              {website ? (
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50">
                    <Globe size={20} className="text-plug-blue-600" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase text-slate-400">Website</span>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-semibold text-plug-blue-600 hover:underline"
                    >
                      {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </span>
                </div>
              ) : null}

              <hr className="my-5 border-slate-100" />

              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50">
                  <MapPin size={20} className="text-plug-blue-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase text-slate-400">Location</span>
                  <span className="block text-sm leading-relaxed text-slate-700">
                    {fullAddress}
                  </span>
                </span>
              </div>

              {directionsHref ? (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-plug-blue-600 text-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
                >
                  <Navigation2 size={16} aria-hidden="true" />
                  Get Directions
                </a>
              ) : (
                <p className="text-sm text-slate-500">
                  No map pin for this listing yet, so directions are not available.
                </p>
              )}
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

            {service.isVerified === true ? (
              <div className={cn('flex items-start gap-3 rounded-2xl border border-plug-blue-200 bg-plug-blue-50 p-5')}>
                <ShieldCheck
                  size={24}
                  className="shrink-0 text-plug-blue-600"
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-bold text-plug-blue-900">Verified Business</span>
                  <span className="block text-sm text-plug-blue-700">
                    Marked as verified by the Plug.pk team.
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
