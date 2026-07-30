// src/components/home/StatsBar.tsx
'use client'

import { MapPin, Star, Users, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { PLATFORM_STATS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Stat {
  icon: LucideIcon
  value: number
  suffix: string
  label: string
}

const STATS: Stat[] = [
  { icon: Zap, value: PLATFORM_STATS.totalStations, suffix: '+', label: 'Charging Stations' },
  { icon: MapPin, value: PLATFORM_STATS.totalCities, suffix: '', label: 'Cities Covered' },
  { icon: Users, value: PLATFORM_STATS.totalUsers, suffix: '+', label: 'EV Owners' },
  { icon: Star, value: PLATFORM_STATS.totalReviews, suffix: '+', label: 'Reviews' },
]

const DURATION_MS = 2000

/** Counts 0 → target with an ease-out curve once `active` flips true. */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (!active) return

    // Honour the same preference globals.css applies to CSS animations.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
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
        <Icon size={28} className="text-plug-blue-600" aria-hidden="true" />
      </span>

      <span className="text-4xl font-black leading-none tracking-[-0.03em] text-slate-900 lg:text-5xl">
        {count.toLocaleString('en-PK')}
        {stat.suffix ? <span className="text-plug-blue-600">{stat.suffix}</span> : null}
      </span>

      <span className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">
        {stat.label}
      </span>
    </div>
  )
}

export function StatsBar() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(false)

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
    <section id="stats" ref={sectionRef} className="border-b border-slate-100 bg-white py-12 lg:py-16">
      <div className="container-plug">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div key={stat.label} className={cn('relative', index > 0 && 'lg:pl-4')}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 hidden h-[60px] w-px -translate-y-1/2 bg-slate-200 lg:block"
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
