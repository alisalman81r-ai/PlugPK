// src/components/home/StatsBar.tsx
'use client'

import { MapPin, Users, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

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

  return (
    <div className="relative flex flex-col items-center text-center">
      <span className="mb-3 inline-flex rounded-xl bg-blue-50 p-2">
        <Icon size={24} className="text-plug-blue-600" aria-hidden="true" />
      </span>

      {/* The real figure, with no "+" on it. A plus sign on a live count
          implies there are more than shown, which would be untrue. */}
      <span className="text-4xl font-black leading-none tracking-[-0.03em] text-slate-900 lg:text-5xl">
        {stat.value === 0 && stat.emptyLabel ? (
          <span className="text-2xl text-slate-400 lg:text-3xl">{stat.emptyLabel}</span>
        ) : (
          count.toLocaleString('en-PK')
        )}
      </span>

      <span className="mt-2 text-ui-xs font-medium uppercase tracking-widest text-slate-400">
        {stat.label}
      </span>
    </div>
  )
}

export function StatsBar({ stations, cities, owners }: StatsBarProps) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(false)

  const stats: Stat[] = [
    { icon: Zap, value: stations, label: 'Charging stations' },
    { icon: MapPin, value: cities, label: 'Cities covered' },
    { icon: Users, value: owners, label: 'EV owners', emptyLabel: 'Be the first' },
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
    <section
      id="stats"
      ref={sectionRef}
      className="border-b border-slate-100 bg-white py-12 lg:py-14"
    >
      <div className="container-plug">
        <div className="grid grid-cols-3 gap-x-2 gap-y-8 sm:gap-x-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className={cn('relative', index > 0 && 'sm:pl-4')}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 hidden h-[60px] w-px -translate-y-1/2 bg-slate-200 sm:block"
                />
              ) : null}
              <StatItem stat={stat} active={inView} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
