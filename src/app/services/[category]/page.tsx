// src/app/services/[category]/page.tsx
import { Car, ChevronLeft, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ServiceCard } from '@/components/services/ServiceCard'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { MOCK_SERVICES } from '@/lib/mock-data'
import type { ServiceCategory } from '@/lib/types'

interface PageProps {
  params: { category: string }
}

const ICONS: Record<string, LucideIcon> = { Car, Wrench, Home, Package, Shield, LifeBuoy }

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
  return {
    title: `${meta.label} — EV Services`,
    description: `${meta.description}. Browse verified ${meta.label.toLowerCase()} across Pakistan on Plug.pk.`,
  }
}

export default function ServiceCategoryPage({ params }: PageProps) {
  const category = resolveCategory(params.category)
  if (!category) notFound()

  const meta = SERVICE_CATEGORY_META[category]
  const Icon = ICONS[meta.icon] ?? Package
  const services = MOCK_SERVICES.filter((service) => service.category === category)
  const cities = new Set(services.map((service) => service.address.city))

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="container-plug relative z-10">
          <Link
            href="/services"
            className="group/back mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft
              size={16}
              className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
              aria-hidden="true"
            />
            All Services
          </Link>

          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Icon size={32} className="text-white" aria-hidden="true" />
          </span>

          <h1 className="mb-3 text-4xl font-black text-white">{meta.label}</h1>

          <p className="mb-4 max-w-xl text-lg text-white/60">{meta.description}</p>

          <p className="font-mono text-sm text-white/50">
            {services.length} service{services.length === 1 ? '' : 's'} · {cities.size} cit
            {cities.size === 1 ? 'y' : 'ies'}
          </p>
        </div>
      </section>

      <div className="container-plug py-16">
        {services.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            No providers listed in this category yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                animationDelay={index * 80}
                className="animate-fade-up opacity-0"
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
