// src/app/(main)/services/[category]/page.tsx
import { Car, ChevronLeft, Home, LifeBuoy, Package, Shield, Wrench, type IconType } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ListYourServiceBand } from '@/components/services/ListYourServiceBand'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceCardsIntro } from '@/components/services/ServiceCardsIntro'
import { CountUp } from '@/components/v2/Reveal'
import { Btn, HeroStats, Hl, Lift, LiftBody, LiftHead, PageHero, chipClass } from '@/components/v2/ui'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { getServicesByCategory } from '@/lib/db/service-queries'
import type { ServiceCategory } from '@/lib/types'

interface PageProps {
  params: { category: string }
}

const ICONS: Record<string, IconType> = { Car, Wrench, Home, Package, Shield, LifeBuoy }

function resolveCategory(value: string): ServiceCategory | null {
  return SERVICE_CATEGORY_KEYS.find((key) => key === value) ?? null
}

export async function generateStaticParams() {
  return SERVICE_CATEGORY_KEYS.map((category) => ({ category }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = resolveCategory(params.category)
  if (!category) return { title: 'Category Not Found' }

  const meta = SERVICE_CATEGORY_META[category]
  // "Browse verified …" overstated it: listings are reviewed before they go
  // live, but nothing in the application verifies a business beyond that.
  return {
    title: `${meta.label} — EV Services`,
    description: `${meta.description}. Browse ${meta.label.toLowerCase()} across Pakistan, each checked by a person before it is listed on plugpk.`,
    alternates: { canonical: `/services/${category}` },
  }
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const category = resolveCategory(params.category)
  if (!category) notFound()

  const meta = SERVICE_CATEGORY_META[category]
  const Icon = ICONS[meta.icon] ?? Package
  const services = await getServicesByCategory(category)
  const cities = new Set(services.map((service) => service.address.city))

  return (
    <>
      <PageHero
        eyebrow={
          <Link
            href="/services"
            className="group/back inline-flex min-h-[44px] items-center gap-1.5 text-volt transition-colors hover:text-white"
          >
            <ChevronLeft
              size={14}
              className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
              aria-hidden="true"
            />
            All services
          </Link>
        }
        title={
          <>
            EV <Hl dark>{meta.label.toLowerCase()}</Hl>
          </>
        }
        sub={`${meta.description}. Every listing is checked by a person before it appears.`}
      >
        <HeroStats
          items={[
            { value: <CountUp value={services.length} />, label: services.length === 1 ? 'Service' : 'Services' },
            { value: <CountUp value={cities.size} />, label: cities.size === 1 ? 'City' : 'Cities' },
          ]}
        />
      </PageHero>

      <Lift id="directory">
        <LiftHead
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Icon size={14} aria-hidden="true" />
              {meta.label}
            </span>
          }
          title={
            <>
              <span className="font-mono font-semibold">{services.length}</span>{' '}
              {services.length === 1 ? 'provider' : 'providers'} listed
            </>
          }
          actions={
            <nav aria-label="Other categories" className="flex flex-wrap gap-2">
              {SERVICE_CATEGORY_KEYS.filter((key) => key !== category).map((key) => (
                <Link key={key} href={`/services/${key}`} className={chipClass(false, 'h-11')}>
                  {SERVICE_CATEGORY_META[key].label}
                </Link>
              ))}
            </nav>
          }
        />
        <LiftBody className="bg-chalk/60">
          {services.length === 0 ? (
            <div className="grid justify-items-center gap-1.5 rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] px-6 py-16 text-center">
              <span className="mb-2.5 grid h-16 w-16 place-items-center rounded-full bg-ink text-volt">
                <Icon size={26} aria-hidden="true" />
              </span>
              <p className="font-display text-[26px] leading-[1.1] text-ink">No providers listed here yet.</p>
              <p className="mb-3.5 text-[15px] text-muted">Run one? Apply below and our team will check it.</p>
              <Btn href="/services" variant="ink" size="sm" magnetic={false}>
                Browse all services
              </Btn>
            </div>
          ) : (
            <ServiceCardsIntro className="grid items-stretch gap-4 sm:grid-cols-2 sm:gap-[22px] xl:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </ServiceCardsIntro>
          )}
        </LiftBody>
      </Lift>

      <ListYourServiceBand category={SERVICE_CATEGORY_META[category].label} className="pt-[clamp(56px,6vw,88px)]" />
    </>
  )
}
