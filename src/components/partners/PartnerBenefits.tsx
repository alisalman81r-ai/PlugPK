// src/components/partners/PartnerBenefits.tsx
'use client'

import { Banknote, BarChart3, Users, type IconType } from '@/components/ui/icons'
import * as React from 'react'

import { finePointer, prefersReduced } from '@/lib/gsap'

/**
 * The "what you get" cards (landing-v2's .pt-get__card): each rises in on
 * scroll, lifts on hover, and a volt glow appears under the cursor and follows
 * it across the card.
 *
 * page-partner.js: on a fine pointer, without reduced motion, every pointermove
 * writes the cursor's offset into --mx / --my, and the ::before glow is centred
 * there. Until the cursor arrives it sits at 85% across the top edge.
 *
 * Every claim maps to something the application does: "you keep it" is true
 * because there is no payment processing and no commission anywhere in the
 * code; the dashboard figures named are the ones BusinessDailyStat counts.
 */

const BENEFITS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Banknote,
    title: 'You set the price, you keep it',
    body: 'plugpk does not set your rates, process the payment or take a percentage. Whatever you charge is between you and the driver.',
  },
  {
    icon: BarChart3,
    title: 'See what your listing does',
    body: 'Views, directions taken, reviews and rating — counted from real visits to your page, not estimated.',
  },
  {
    icon: Users,
    title: 'Reach drivers already looking',
    body: 'People open the map because they need a charge now, and an approved listing can appear as a charging stop when it is on a planned route.',
  },
]

/* .card.card--hover.pt-get__card, with its ::before spotlight */
const CARD =
  'relative isolate h-full overflow-hidden rounded-[28px] border border-ink/10 bg-white p-[30px] shadow-e1 ' +
  '[transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] ' +
  'hover:border-ink/20 hover:shadow-e2 hover:[translate:0_-4px] ' +
  'before:absolute before:left-[var(--mx,85%)] before:top-[var(--my,0%)] before:-z-[1] before:h-[280px] before:w-[280px] ' +
  'before:rounded-full before:bg-[radial-gradient(closest-side,rgba(212,255,58,.35),transparent)] before:opacity-0 ' +
  'before:[translate:-50%_-50%] before:[transition:opacity_.5s] hover:before:opacity-100'

export function PartnerBenefits() {
  const gridRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const grid = gridRef.current
    if (!grid || !finePointer() || prefersReduced()) return
    const cards = [...grid.querySelectorAll<HTMLElement>('[data-spotlight]')]
    const move = (e: PointerEvent) => {
      const c = e.currentTarget as HTMLElement
      const r = c.getBoundingClientRect()
      c.style.setProperty('--mx', `${e.clientX - r.left}px`)
      c.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    cards.forEach((c) => c.addEventListener('pointermove', move))
    return () => cards.forEach((c) => c.removeEventListener('pointermove', move))
  }, [])

  return (
    <div ref={gridRef} className="grid gap-4 lg:grid-cols-3">
      {BENEFITS.map((benefit) => (
        // The reveal moves a wrapper: GSAP leaves translate inline on what it
        // animates, which would cancel the card's own hover lift.
        <div key={benefit.title} data-reveal="" className="h-full">
          <article data-spotlight="" className={CARD}>
            <span aria-hidden="true" className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
              <benefit.icon size={24} />
            </span>
            <h3 className="mb-2.5 mt-8 font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium lg:mt-14">
              {benefit.title}
            </h3>
            <p className="text-[15px] leading-[1.6] text-muted">{benefit.body}</p>
          </article>
        </div>
      ))}
    </div>
  )
}
