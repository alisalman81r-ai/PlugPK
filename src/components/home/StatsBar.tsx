// src/components/home/StatsBar.tsx
'use client'

import { MapPin, Users, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { cn } from '@/lib/utils'

export interface StatsBarProps {
  /**
   * Counted from the database by the page, not typed into a constant. These
   * were 250 / 18 / 5,000 / 1,200 hardcoded — numbers that could never move
   * and did not describe anything real.
   */
  stations: number
  cities: number
  owners: number
}

interface Stat {
  icon: LucideIcon
  value: number
  label: string
  /** The line under the figure. Says what the number means, not what it is. */
  note: string
  /** Shown when the real figure is still zero, instead of a bare "0". */
  emptyLabel?: string
}

const DURATION_MS = 1400

/**
 * Counts 0 → target with an ease-out curve once `active` flips true.
 *
 * Initialised to the target rather than to zero, so the server renders the
 * real figure. Starting at zero meant the HTML said "0 charging stations" to
 * anyone without JavaScript and to every crawler — a count-up is decoration,
 * and decoration should not be able to misreport the data.
 *
 * The reset to zero happens in an effect, which only runs on the client and
 * only before the section is in view. Since this sits below the fold, the
 * reset is never visible: by the time it is scrolled to, the animation is
 * what plays.
 */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = React.useState(target)

  React.useEffect(() => {
    // Honour the same preference globals.css applies to CSS animations.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }

    if (!active) {
      setValue(0)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return value
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(stat.value, active)
  const Icon = stat.icon
  const isEmpty = stat.value === 0 && Boolean(stat.emptyLabel)

  return (
    /*
     * `group` so the outlined holder reacts to the whole cell being hovered
     * rather than to the pointer finding the 56px square — the same trigger
     * the cards on this page and on Partner Up already use.
     */
    <div className="group flex h-full flex-col items-center px-4 text-center">
      <span aria-hidden="true" className={ICON_FRAME}>
        <Icon size={24} className={ICON_GLYPH} />
      </span>

      {/*
        The figure, in the mono face with tabular figures.

        Two reasons, and the second is the real one. It matches the label/value
        rows the cars pages set in mono, so the product has one voice for
        numbers. And proportional digits change width as they count — a 1 is
        narrower than an 8 — so the old count-up shifted its own layout on
        nearly every frame. Tabular figures are all one width, which holds the
        row still while the number moves.

        No "+" on it: a plus sign on a live count implies there are more than
        shown, which would not be true.

        The fixed height is what keeps the three columns on one baseline. A
        column showing "Be the first" instead of a numeral is setting a much
        shorter line, and without a shared box for the figure its rule and its
        label sat visibly higher than the two beside it — which read as a
        layout fault rather than as an empty shelf.
      */}
      <span className="mt-7 flex h-[3.5rem] items-center justify-center lg:h-[4.25rem]">
        {isEmpty ? (
          <span className="text-2xl font-bold tracking-tight text-slate-400 lg:text-[1.75rem]">
            {stat.emptyLabel}
          </span>
        ) : (
          <span className="font-mono text-[2.75rem] font-black leading-none tracking-[-0.04em] text-slate-900 tabular-nums lg:text-[3.5rem]">
            {count.toLocaleString('en-PK')}
          </span>
        )}
      </span>

      {/* The cap rule, drawn under the figure rather than above the heading —
          the same device the cards use, turned to point at the number. Grown
          from the centre here, because the column is centred. */}
      <span
        aria-hidden="true"
        className="mt-4 block h-0.5 w-10 rounded-full bg-slate-300 transition-all duration-300 group-hover:w-16 group-hover:bg-gradient-brand"
      />

      <span className="mt-4 block text-ui font-bold tracking-tight text-slate-900">
        {stat.label}
      </span>
      <span className="mt-1 block max-w-[24ch] text-ui-sm leading-relaxed text-slate-500">
        {stat.note}
      </span>
    </div>
  )
}

export function StatsBar({ stations, cities, owners }: StatsBarProps) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(false)

  const stats: Stat[] = [
    {
      icon: Zap,
      value: stations,
      label: 'Charging stations',
      note: 'Every one checked before it went on the map.',
    },
    {
      icon: MapPin,
      value: cities,
      label: 'Cities covered',
      note: 'Growing as hosts list their chargers.',
    },
    {
      icon: Users,
      value: owners,
      label: 'EV owners',
      note: 'Drivers who rate and review what they use.',
      emptyLabel: 'Be the first',
    },
  ]

  React.useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    // Environments without IntersectionObserver still get the final numbers.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    /*
     * The proof panel, lifted into the gap under the hero.
     *
     * This was three figures on a bare white band directly below a white hero
     * section — the flattest moment on the page, sitting exactly where the
     * hero has just spent its momentum. It is now a bounded panel carrying
     * the same graded hairline as every card on the site, so the first thing
     * after the photograph is a piece of the design system rather than an
     * absence of one.
     *
     * The gradient edge is the FRAME idea at panel scale: a wrapper holding
     * the gradient with 1.5px of padding and the face sitting on top of it.
     * It is written out rather than imported because FRAME carries a hover
     * lift meant for cards you can click, and this panel is not a link.
     */
    <section ref={sectionRef} id="stats" className="bg-white pb-16 pt-4 lg:pb-24 lg:pt-6">
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6">
        <div
          className={cn(
            'rounded-[28px] bg-gradient-to-b from-slate-300 via-slate-200 to-slate-200 p-[1.5px]',
            'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_56px_-32px_rgba(15,23,42,0.30)]',
          )}
        >
          <div className="rounded-[calc(28px-1.5px)] bg-white px-2 py-12 sm:px-6 lg:px-10 lg:py-14">
            <div className="grid gap-y-12 sm:grid-cols-3 sm:gap-y-0">
              {stats.map((stat, index) => (
                <div key={stat.label} className={cn('relative', index > 0 && 'sm:pl-2')}>
                  {/* A hairline that fades at both ends, so the divider stops
                      short of the panel's own edges instead of butting into
                      them. Horizontal between stacked rows on mobile, vertical
                      between columns from `sm` up. */}
                  {index > 0 ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-8 -top-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent sm:hidden"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 hidden h-[70%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block"
                      />
                    </>
                  ) : null}
                  <StatItem stat={stat} active={inView} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
