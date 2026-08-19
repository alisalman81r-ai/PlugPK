// src/components/services/ServiceCategoryTabs.tsx
'use client'

import {
  Car,
  Home,
  LayoutGrid,
  LifeBuoy,
  Package,
  Shield,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ServiceCategoryTabsProps {
  selectedCategory: ServiceCategory | 'all'
  onCategoryChange: (category: ServiceCategory | 'all') => void
  categoryCount: Record<string, number>
}

/** Resolves the icon names stored in SERVICE_CATEGORY_META to components. */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Car,
  Wrench,
  Home,
  Package,
  Shield,
  LifeBuoy,
}

export function ServiceCategoryTabs({
  selectedCategory,
  onCategoryChange,
  categoryCount,
}: ServiceCategoryTabsProps) {
  const tabs: { key: ServiceCategory | 'all'; label: string; icon: LucideIcon }[] = [
    { key: 'all', label: 'All Services', icon: LayoutGrid },
    ...SERVICE_CATEGORY_KEYS.map((key) => ({
      key,
      label: SERVICE_CATEGORY_META[key].label,
      icon: CATEGORY_ICON[SERVICE_CATEGORY_META[key].icon] ?? Package,
    })),
  ]

  return (
    // Translucent rather than opaque: the bar sits over the listings as they
    // scroll under it, and a solid white slab reads as a lid. The blur keeps
    // the text legible without hiding that there is content beneath.
    <div className="sticky top-[72px] z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      {/*
        Wraps from lg up, scrolls below it.

        Seven tabs on one non-wrapping row meant the last one — Roadside
        Assistance — sat past the right edge on a typical laptop, showing as a
        bare icon with its label and count cut off. A tab you cannot see is a
        tab you cannot click, which reads as the filter being broken rather
        than as content being off-screen.
      */}
      <div
        role="tablist"
        aria-label="Service categories"
        className={cn(
          'container-plug scrollbar-hide relative flex items-center gap-1.5 overflow-x-auto py-3',
          'lg:flex-wrap lg:overflow-visible',
        )}
      >
        {tabs.map((tab) => {
          const isSelected = selectedCategory === tab.key
          const count = categoryCount[tab.key] ?? 0
          const Icon = tab.icon

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onCategoryChange(tab.key)}
              className={cn(
                'group/tab flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-ui-sm font-semibold transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                // Ink rather than saturated blue for the selected state. Seven
                // tabs in plug-blue-600 put a heavy brand-coloured block at the
                // top of every listing and left nothing for the actual calls to
                // action on the cards below to stand out against.
                isSelected
                  ? 'bg-slate-900 text-white shadow-e1'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-colors duration-150',
                  isSelected ? 'text-white' : 'text-slate-400 group-hover/tab:text-slate-600',
                )}
                aria-hidden="true"
              />
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-ui-xs font-bold tabular-nums transition-colors duration-150',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 group-hover/tab:bg-slate-200',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Only below lg, where the row actually scrolls: a fade at the right
          edge so it is obvious there is more than fits. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent lg:hidden"
      />
    </div>
  )
}
