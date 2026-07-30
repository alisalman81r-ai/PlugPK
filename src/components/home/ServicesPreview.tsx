// src/components/home/ServicesPreview.tsx
import { Car, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Button, SectionHeader } from '@/components/ui'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** SERVICE_CATEGORIES stores icon and colour as strings; resolve them here. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  dealership: Car,
  'service-center': Wrench,
  'home-charger-installer': Home,
  accessories: Package,
  insurance: Shield,
  'roadside-assistance': LifeBuoy,
}

const CATEGORY_TONES: Record<string, string> = {
  dealership: 'bg-blue-50 text-blue-600',
  'service-center': 'bg-green-50 text-green-600',
  'home-charger-installer': 'bg-purple-50 text-purple-600',
  accessories: 'bg-amber-50 text-amber-600',
  insurance: 'bg-cyan-50 text-cyan-600',
  'roadside-assistance': 'bg-red-50 text-red-600',
}

export function ServicesPreview() {
  return (
    <section className="section-padding bg-white">
      <div className="container-plug">
        <SectionHeader
          align="center"
          eyebrow="EV Ecosystem"
          eyebrowColor="blue"
          title="Everything Your EV Needs"
          subtitle="Beyond charging — find every EV service in one place."
        />

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Package
            const tone = CATEGORY_TONES[category.id] ?? 'bg-slate-50 text-slate-600'

            return (
              <Link
                key={category.id}
                href="/services"
                title={category.description}
                className="flex cursor-pointer flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-card"
              >
                <span
                  className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                    tone,
                  )}
                >
                  <Icon size={28} aria-hidden="true" />
                </span>

                <span className="mb-1 text-sm font-semibold text-slate-900">{category.label}</span>
                <span className="text-xs text-slate-400">{category.count} listed</span>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Button href="/services" variant="secondary" size="lg">
            Explore All EV Services
          </Button>
        </div>
      </div>
    </section>
  )
}
