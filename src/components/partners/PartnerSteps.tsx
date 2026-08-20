// src/components/partners/PartnerSteps.tsx
import { BadgeCheck, Banknote, BarChart3, Home, MapPinned, Users } from 'lucide-react'

/**
 * How hosting works, and what a host is actually promised.
 *
 * Every claim here maps to something the application does. "Live once we
 * verify" is the admin approval step; "you keep every rupee" is true because
 * there is no payment processing and no commission anywhere in the code; the
 * dashboard figures named are the ones BusinessDailyStat actually counts. If a
 * claim on this page ever stops being true, the code that made it true is the
 * thing to look at.
 */

const STEPS = [
  {
    icon: Home,
    title: 'List what you have',
    body: 'A hotel forecourt, an office car park, or the single charger on your driveway. Same form, same few minutes.',
  },
  {
    icon: BadgeCheck,
    title: 'We check the details',
    body: 'We confirm the address, the pin and the charger specs before publishing, so drivers who set off actually arrive.',
  },
  {
    icon: MapPinned,
    title: 'Drivers find you',
    body: 'Your listing appears on the map and in search, filterable by connector and speed, with directions one tap away.',
  },
]

const BENEFITS = [
  {
    icon: Banknote,
    title: 'You set the price, you keep it',
    body: 'Plug.pk does not set your rates, process the payment or take a percentage. Whatever you charge is between you and the driver.',
  },
  {
    icon: BarChart3,
    title: 'See what your listing does',
    body: 'Views, directions taken, reviews and rating — counted from real visits to your page, not estimated.',
  },
  {
    icon: Users,
    title: 'Reach drivers already looking',
    body: 'People open the map because they need a charge now. That is a narrower and warmer audience than an advert.',
  },
]

export function PartnerSteps() {
  return (
    <>
      <section className="bg-white py-20 lg:py-24">
        <div className="container-plug">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Three steps, then you are on the map
            </h2>
          </div>

          <ol className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-3xl border border-slate-200 bg-white p-7"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-5 font-mono text-4xl font-black text-slate-100"
                >
                  {index + 1}
                </span>

                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"
                >
                  <step.icon size={22} className="text-plug-blue-600" />
                </span>

                <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="container-plug">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
              What you get
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Your charger, earning its keep
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-3xl border border-slate-200 bg-white p-7">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand"
                >
                  <benefit.icon size={22} className="text-white" />
                </span>

                <h3 className="mt-5 text-lg font-bold text-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
