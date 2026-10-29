// src/components/services/ListYourServiceBand.tsx
import Link from 'next/link'

import { ArrowRight, BadgeCheck, MapPinned, Wrench } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * The way in for providers, where they will see it: after the listings on the
 * directory and on every category page. The hero carries a button too, but a
 * workshop owner scrolling the list to see who else is here is the person most
 * likely to want in, and they are at the bottom by then.
 *
 * Every promise here is what the application does: it is checked by a person
 * (the pending status), and approved listings are what the directory shows.
 */
export function ListYourServiceBand({ category, className }: { category?: string; className?: string }) {
  const points = [
    { icon: Wrench, text: 'Workshops, installers, dealers, insurers, accessories and roadside help' },
    { icon: BadgeCheck, text: 'Checked by our team before it goes live' },
    { icon: MapPinned, text: 'Found by EV drivers searching your city and category' },
  ]

  return (
    <section aria-labelledby="list-your-service" className={cn('container-plug', className)}>
      <div className="relative overflow-hidden rounded-3xl bg-plug-navy-950 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14 lg:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-plug-blue-600/30 blur-[90px]" />
        <div className="relative max-w-2xl">
          <p className="text-ui-sm font-bold uppercase tracking-[0.16em] text-plug-sky-300">
            For EV businesses{category ? ` · ${category}` : ''}
          </p>
          <h2 id="list-your-service" className="mt-3 text-balance text-2xl font-black tracking-tight text-white sm:text-3xl">
            Run an EV service? Get listed on Plug.pk.
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-ui-sm leading-snug text-white/70">
                <Icon size={18} className="mt-0.5 shrink-0 text-plug-cyan-300" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-8 flex shrink-0 flex-col items-start gap-2 lg:mt-0 lg:items-end">
          <Link
            href="/services/list"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-ui font-bold text-slate-950 shadow-[0_0_36px_-8px_rgba(38,205,178,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-plug-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            Apply to be listed
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="text-ui-xs text-white/50">Free account needed · PKR 4,999 a month once approved</p>
        </div>
      </div>
    </section>
  )
}
