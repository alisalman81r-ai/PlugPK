// src/app/(main)/services/page.tsx
import { Suspense } from 'react'

import { ServiceHero } from '@/components/services/ServiceHero'
import { ServicesDirectory } from '@/components/services/ServicesDirectory'
import { FaqSection } from '@/components/shared/FaqSection'
import { readOrFallback } from '@/lib/db/availability'
import { getServices } from '@/lib/db/queries'
import { SERVICES_FAQS } from '@/lib/faqs'
import type { EVService } from '@/lib/types'

/**
 * The EV services directory.
 *
 * A server component now, reading the real table. It used to be a client page
 * importing MOCK_SERVICES — a fixed twelve rows — while /services/[category]
 * and every detail page read the database. So a service approved in the admin
 * appeared on its category page and never here, which is the one place someone
 * would look for it.
 *
 * Dynamic rather than cached: the listing changes whenever an application is
 * approved, and an operator who approves one and then cannot find it on the
 * public page has no way to tell a cache from a bug. getServices() already
 * filters to approved, so nothing unreviewed can reach this.
 */

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  /*
    An empty directory rather than an error page.

    force-dynamic means this is re-read on every visit, so a database that
    cannot answer takes the page down on every visit rather than once. The
    directory below already renders a nothing-found state, and the hero counts
    from the list it is given, so an empty list degrades to "no services yet"
    instead of the error boundary. See lib/db/availability.
  */
  const services = await readOrFallback('/services', [] as EVService[], getServices)
  const cities = new Set(services.map((service) => service.address.city)).size

  return (
    <>
      <ServiceHero totalServices={services.length} citiesCovered={cities} />

      {/* useSearchParams needs a Suspense boundary during static rendering. */}
      <Suspense
        fallback={
          <div className="container-plug py-20 text-center text-sm text-slate-400">
            Loading services...
          </div>
        }
      >
        <ServicesDirectory services={services} />
      </Suspense>

      <FaqSection items={SERVICES_FAQS} />
    </>
  )
}
