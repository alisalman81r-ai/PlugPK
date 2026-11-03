// src/components/services/ServiceCategoryTabs.tsx
'use client'

import {
  Car,
  Home,
  LayoutGrid,
  LifeBuoy,
  Package,
  Wrench,
  type IconType,
} from '@/components/ui/icons'

import { Lift, chipClass } from '@/components/v2/ui'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { prefersReduced } from '@/lib/gsap'
import type { ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useCountBounce } from './services-motion'

/**
 * A chip's count (.sv-chips .chip .count): eases between the chalk and volt
 * faces over .25s, and bounces whenever the number changes.
 */
function ChipCountBounce({ on, value }: { on: boolean; value: number }) {
  const ref = useCountBounce<HTMLSpanElement>(value)
  return (
    <span
      ref={ref}
      className={cn(
        'min-w-[26px] rounded-full px-[7px] py-0.5 text-center font-mono text-[11px] font-semibold tabular-nums [transition:background-color_.25s,color_.25s]',
        on ? 'bg-volt text-ink' : 'bg-chalk text-muted',
      )}
    >
      {value}
    </span>
  )
}

export interface ServiceCategoryTabsProps {
  selectedCategory: ServiceCategory | 'all'
  onCategoryChange: (category: ServiceCategory | 'all') => void
  categoryCount: Record<string, number>
}

/** Resolves the icon names stored in SERVICE_CATEGORY_META to components. */
export const CATEGORY_ICON: Record<string, IconType> = {
  Car,
  Wrench,
  Home,
  Package,
  LifeBuoy,
}

/**
 * The category filter, as landing-v2's lifted chip bar: a paper sheet that
 * overlaps the bottom of the hero, holding one pill per category with its
 * count. The pressed chip goes ink with a volt count.
 *
 * Wraps where there is room and scrolls sideways where there is not, with a
 * fade at the edge so it is obvious there is more than fits. A chip you cannot
 * see is a chip you cannot press.
 */
export function ServiceCategoryTabs({
  selectedCategory,
  onCategoryChange,
  categoryCount,
}: ServiceCategoryTabsProps) {
  const tabs: { key: ServiceCategory | 'all'; label: string; icon: IconType }[] = [
    { key: 'all', label: 'All Services', icon: LayoutGrid },
    ...SERVICE_CATEGORY_KEYS.map((key) => ({
      key,
      label: SERVICE_CATEGORY_META[key].label,
      icon: CATEGORY_ICON[SERVICE_CATEGORY_META[key].icon] ?? Package,
    })),
  ]

  return (
    <Lift id="directory" className="-mt-16 sm:-mt-[72px]">
      <div className="relative px-3 py-3 sm:px-5 sm:py-4">
        <div
          role="group"
          aria-label="Filter by category"
          className="scrollbar-hide -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 [mask-image:linear-gradient(90deg,#000_calc(100%-40px),transparent)] sm:-mx-5 sm:px-5 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 lg:[mask-image:none]"
        >
          {tabs.map((tab) => {
            const on = selectedCategory === tab.key
            const count = categoryCount[tab.key] ?? 0
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={on}
                onClick={(event) => {
                  if (on) return
                  onCategoryChange(tab.key)
                  // page-services.js: the pressed chip glides to the middle of the strip.
                  event.currentTarget.scrollIntoView({
                    behavior: prefersReduced() ? 'auto' : 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  })
                }}
                className={cn(
                  chipClass(on, 'h-[46px] shrink-0 gap-[9px] px-3.5 focus-visible:outline-none focus-visible:shadow-focus'),
                  // .chip: colours over .25s, the press springs back over .3s.
                  '![transition:background-color_.25s,border-color_.25s,color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)]',
                  !on && count === 0 && 'opacity-45',
                  '[&_svg]:h-[18px] [&_svg]:w-[18px]',
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {tab.label}
                <ChipCountBounce on={on} value={count} />
              </button>
            )
          })}
        </div>
      </div>
    </Lift>
  )
}
