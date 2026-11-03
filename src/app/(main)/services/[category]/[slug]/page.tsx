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
  MessageCircle,
  MessageSquare,
  Navigation2,
  Package,
  Phone,
  Shield,
  ShieldCheck,
  Star,
  Wrench,
  type IconType,
} from '@/components/ui/icons'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { ExampleBadge, Eyebrow, FLABEL, Lift, Tag, btnClass } from '@/components/v2/ui'

import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META, SERVICE_OFFERINGS } from '@/lib/constants'
import { prebuiltParams } from '@/lib/db/build-params'
import { getServiceBySlug, getServiceParams } from '@/lib/db/queries'
import type { DayHours, ServiceCategory } from '@/lib/types'
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

/** "0300 1234567" → "923001234567": wa.me wants the international number, digits only. */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return `92${digits.slice(1)}`
  return digits
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
    description: `${service.name}, ${meta.label.toLowerCase()} in ${service.address.city}. Contact details, location and opening hours on plugpk.`,
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
  const social = safeHref(service.socialUrl)
  const whatsappHref = service.whatsapp ? `https://wa.me/${waNumber(service.whatsapp)}` : null
  const fullAddress = [service.address.street, service.address.area, service.address.city]
    .filter((part) => part && part.trim())
    .join(', ')

  const area = [service.address.area, service.address.city].filter((part) => part && part.trim()).join(', ')

  return (
    <>
      <section
        data-theme="dark"
        className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(36px,6vw,64px)] text-center text-white sm:rounded-b-[48px]"
      >
        {/* The business's own photograph, held well back so the breadcrumb
            and heading keep their contrast against it. */}
        {service.coverPhoto ? (
          <div aria-hidden="true" className="absolute inset-0 -z-[3]">
            <Image src={service.coverPhoto} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,.72),rgba(11,12,14,.92)_70%,#0B0C0E)]" />
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.12),transparent_70%)] blur-[10px]"
        />

        <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs font-semibold uppercase tracking-[0.12em]">
            <Link
              href="/services"
              className="group/back inline-flex min-h-[44px] items-center gap-1.5 text-white/60 transition-colors hover:text-volt"
            >
              <ChevronLeft size={14} className="transition-transform duration-150 group-hover/back:-translate-x-0.5" aria-hidden="true" />
              All services
            </Link>
            <span aria-hidden="true" className="text-white/25">/</span>
            <Link href={`/services/${service.category}`} className="inline-flex min-h-[44px] items-center text-white/60 transition-colors hover:text-volt">
              {meta.label}
            </Link>
            <span aria-hidden="true" className="text-white/25">/</span>
            <span className="line-clamp-1 max-w-[16rem] text-white/40" aria-current="page">
              {service.name}
            </span>
          </nav>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Tag tone="dark" className="h-[30px] bg-white/[0.06] px-3">
              <Icon size={14} className="text-volt" aria-hidden="true" />
              {meta.label}
            </Tag>
            {/* Shown only when an operator has ticked isVerified on the row.
                There is no verification procedure in the code beyond the
                approval every listing gets, so this is the operator's own
                assertion, never inferred from anything else. */}
            {service.isVerified === true ? (
              <Tag tone="dark" mono className="h-[30px] border-volt/40 bg-volt/10 px-3 text-volt" >
                <ShieldCheck size={14} aria-hidden="true" />
                Verified
              </Tag>
            ) : null}
          </div>

          <h1 data-hero-title="" className="mt-6 text-balance font-display text-[clamp(38px,5.2vw,80px)] leading-none">{service.name}</h1>

          <div data-hero-item="" className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/65">
            {/* No star rating. The rating and review count on a service row
                were seeded figures with no reviews behind them — services
                cannot be reviewed on plugpk — so showing them would be
                presenting an invented score as drivers' opinion. */}
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.08em] text-white/50">
              <Star size={14} aria-hidden="true" />
              No reviews yet
            </span>
            {area ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="shrink-0" aria-hidden="true" />
                {area}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Phone size={15} className="shrink-0" aria-hidden="true" />
              {service.phone}
            </span>
          </div>

          <div data-hero-item="" className="mt-[34px] flex flex-wrap justify-center gap-3">
            {directionsHref ? (
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={btnClass('volt', 'lg')}>
                <Navigation2 aria-hidden="true" />
                Get directions
              </a>
            ) : null}
            <a href={telHref} className={btnClass(directionsHref ? 'ghostDark' : 'volt', 'lg')}>
              <Phone aria-hidden="true" />
              Call now
            </a>
          </div>
        </div>
      </section>

      <Lift className="mb-[clamp(64px,7vw,104px)]">
        <div className="grid grid-cols-1 items-start gap-10 px-[18px] py-7 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 lg:px-10">
          <div className="min-w-0">
            <section>
              <Eyebrow>About</Eyebrow>
              <h2 className="font-display text-[clamp(28px,3vw,40px)] leading-[1.08] text-ink">{service.name}</h2>
              <p className="mt-4 max-w-[46rem] text-base leading-[1.7] text-muted">{service.description}</p>

              {service.yearEstablished || service.brands ? (
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.yearEstablished ? (
                    <div className="rounded-[22px] border border-ink/10 bg-white p-[22px]">
                      <dt className={FLABEL}>In business since</dt>
                      <dd className="mt-2 font-mono text-[28px] font-semibold leading-none text-ink">{service.yearEstablished}</dd>
                    </div>
                  ) : null}
                  {service.brands ? (
                    <div className="rounded-[22px] border border-ink/10 bg-white p-[22px]">
                      <dt className={FLABEL}>EV makes</dt>
                      <dd className="mt-2 font-semibold text-ink">{service.brands}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </section>

            {service.pricing ? (
              <section className="mt-10 border-t border-ink/10 pt-10">
                <Eyebrow>Prices</Eyebrow>
                <p className="whitespace-pre-line rounded-[22px] border border-ink/10 bg-white p-5 leading-relaxed text-ink">
                  {service.pricing}
                </p>
                <p className="mt-3">
                  <ExampleBadge>As given by the business · confirm before you book</ExampleBadge>
                </p>
              </section>
            ) : null}

            <section className="mt-10 border-t border-ink/10 pt-10">
              <Eyebrow>Services offered</Eyebrow>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {offerings.map((offering) => (
                  <li key={offering} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-volt-tint text-volt-ink">
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] font-medium text-ink">{offering}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* The station reviews widget used to sit here with an empty list
                and the row's seeded rating, and its form posted a "station"
                review against a service id. Services have no review table, so
                the honest state is the empty one. */}
            <section className="mt-10 border-t border-ink/10 pt-10">
              <Eyebrow>Reviews</Eyebrow>
              <div className="flex items-start gap-4 rounded-[22px] border-[1.5px] border-dashed border-ink/15 bg-paper p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-volt">
                  <MessageSquare size={18} aria-hidden="true" />
                </span>
                <p className="text-[15px] leading-relaxed text-muted">
                  <span className="block font-display text-[22px] leading-[1.15] text-ink">No reviews yet</span>
                  plugpk does not collect reviews for services yet, so there is no rating to show.
                </p>
              </div>
            </section>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-e1">
              <h2 className="font-display text-[24px] leading-[1.1] text-ink">Contact &amp; location</h2>

              <dl className="mt-5 grid grid-cols-1 gap-4">
                <ContactRow icon={Phone} label="Phone">
                  <span className="font-mono">{service.phone}</span>
                </ContactRow>
                {service.email ? (
                  <ContactRow icon={Mail} label="Email">
                    <a href={`mailto:${service.email}`} className="hover:underline">
                      {service.email}
                    </a>
                  </ContactRow>
                ) : null}
                {website ? (
                  <ContactRow icon={Globe} label="Website">
                    <a href={website} target="_blank" rel="noopener noreferrer" className="underline decoration-volt decoration-2 underline-offset-4">
                      {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </ContactRow>
                ) : null}
                {social ? (
                  <ContactRow icon={Globe} label="Social page">
                    <a href={social} target="_blank" rel="noopener noreferrer" className="underline decoration-volt decoration-2 underline-offset-4">
                      {social.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  </ContactRow>
                ) : null}
              </dl>

              <div className="mt-5 grid gap-2">
                <a href={telHref} className={btnClass('ink', 'md', 'w-full')}>
                  <Phone aria-hidden="true" />
                  Call now
                </a>
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={btnClass('ghost', 'md', 'w-full')}>
                    <MessageCircle aria-hidden="true" />
                    WhatsApp
                  </a>
                ) : null}
              </div>

              <hr className="my-5 border-ink/10" />

              <dl>
                <ContactRow icon={MapPin} label="Location">
                  <span className="whitespace-normal font-normal leading-relaxed">{fullAddress}</span>
                </ContactRow>
              </dl>

              {directionsHref ? (
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={btnClass('ghost', 'md', 'mt-4 w-full')}>
                  <Navigation2 aria-hidden="true" />
                  Get directions
                </a>
              ) : (
                <p className="mt-4 text-sm text-muted">No map pin for this listing yet, so directions are not available.</p>
              )}
            </div>

            <div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-e1">
              <h2 className="flex items-center gap-2 font-display text-[24px] leading-[1.1] text-ink">
                <Clock size={20} aria-hidden="true" />
                Opening hours
              </h2>

              {service.operatingHours.is24Hours ? (
                <Tag tone="green" className="mt-4">Open 24 hours</Tag>
              ) : (
                <dl className="mt-4 divide-y divide-ink/[0.06]">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center justify-between py-2">
                      <dt className="text-sm font-medium text-ink">{DAY_LABEL[day]}</dt>
                      <dd className="font-mono text-sm text-muted">{formatDay(service.operatingHours[day])}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {service.isVerified === true ? (
              <div className="flex items-start gap-3 rounded-[28px] bg-ink p-6 text-white">
                <ShieldCheck size={24} className="shrink-0 text-volt" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">Verified business</span>
                  <span className="block text-sm text-white/60">Marked as verified by the plugpk team.</span>
                </span>
              </div>
            ) : null}
          </aside>
        </div>
      </Lift>
    </>
  )
}

/** One labelled contact line in the sidebar: an icon disc, a mono label, the value. */
function ContactRow({ icon: RowIcon, label, children }: { icon: IconType; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-chalk text-ink">
        <RowIcon size={19} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
        <dd className="mt-0.5 font-semibold text-ink [overflow-wrap:anywhere]">{children}</dd>
      </div>
    </div>
  )
}
