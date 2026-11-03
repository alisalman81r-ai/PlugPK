// src/components/services/ListYourServiceBand.tsx
import { BadgeCheck, Search, Wrench, Zap } from '@/components/ui/icons'

import { Btn, BtnEnd, CtaBand, Hl, WRAP } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * The way in for providers, where they will see it: after the listings on the
 * directory and on every category page. The hero carries a button too, but a
 * workshop owner scrolling the list to see who else is here is the person most
 * likely to want in, and they are at the bottom by then.
 *
 * landing-v2's .sv-cta: the dark band with the one big rounded corner, three
 * points and the volt button. Every promise here is what the application
 * does: it is checked by a person (the pending status), and approved listings
 * are what the directory shows.
 */
export function ListYourServiceBand({ category, className }: { category?: string; className?: string }) {
  const points = [
    { icon: Wrench, text: 'Workshops, home charger installers, dealers and roadside help' },
    { icon: BadgeCheck, text: 'Checked by our team before it goes live' },
    { icon: Search, text: 'Found by EV drivers searching your city and category' },
  ]

  return (
    <section
      aria-labelledby="list-your-service"
      data-theme="light"
      className={cn('pb-[clamp(56px,6vw,88px)] pt-[clamp(24px,3vw,40px)]', className)}
    >
      <div className={WRAP}>
        <CtaBand className="grid items-end gap-x-14 gap-y-10 max-sm:px-[22px] max-sm:py-8 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="mb-[18px] inline-flex items-center gap-2.5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-volt">
              <Zap size={14} className="fill-volt" aria-hidden="true" />
              For EV businesses{category ? ` · ${category}` : ''}
            </p>
            <h2
              id="list-your-service"
              className="m-0 text-balance font-display text-[clamp(32px,3.6vw,54px)] leading-[1.04] text-white"
            >
              Run an EV service? Get listed on <Hl dark>plugpk.</Hl>
            </h2>
            <ul className="mt-[30px] grid gap-3.5 md:grid-cols-3">
              {points.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-[18px] border border-white/[0.09] bg-white/[0.03] px-[18px] py-4 text-sm leading-[1.5] text-white/75"
                >
                  <Icon size={22} className="shrink-0 text-volt" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid justify-items-start gap-3.5 xl:justify-items-end">
            <Btn href="/services/list" variant="volt" size="xl">
              Apply to be listed
              <BtnEnd />
            </Btn>
            <small className="max-w-[22rem] font-mono text-xs font-medium text-white/50 xl:text-right">
              Free account needed · PKR 4,999 a month once approved
            </small>
          </div>
        </CtaBand>
      </div>
    </section>
  )
}
