// src/app/(main)/for-businesses/page.tsx
import type { Metadata } from 'next'

import { BusinessFeatures } from '@/components/business/BusinessFeatures'
import { BusinessHero } from '@/components/business/BusinessHero'
import { BusinessPricing } from '@/components/business/BusinessPricing'
import { BusinessTestimonials } from '@/components/business/BusinessTestimonials'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'For Businesses — List Your EV Chargers',
  description:
    'List your business on Plug.pk and reach thousands of EV owners across Pakistan.',
}

export default function ForBusinessesPage() {
  return (
    <>
      <BusinessHero />
      <BusinessFeatures />
      <BusinessTestimonials />
      <BusinessPricing />

      <section className="bg-gradient-hero py-24 text-center">
        <div className="container-plug">
          <h2 className="mb-5 text-4xl font-black text-white">
            Ready to Attract EV Customers?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/60">
            Join hundreds of businesses already reaching EV owners on Plug.pk.
          </p>
          <Button
            href="/business/signup"
            className="h-14 rounded-xl bg-white px-10 text-base font-bold text-plug-blue-600 hover:bg-blue-50"
          >
            List Your Business Free &rarr;
          </Button>
        </div>
      </section>
    </>
  )
}
