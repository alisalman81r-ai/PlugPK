// src/components/services/ServiceCategoryTabs.tsx
'use client'

import { Car, Home, LayoutGrid, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'

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
    <div className="sticky top-[72px] z-30 border-b border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="container-plug scrollbar-hide overflow-x-auto">
        <div className="flex min-w-max items-center gap-2 py-4">
          {tabs.map((tab) => {
            const isSelected = selectedCategory === tab.key
            const count = categoryCount[tab.key] ?? 0
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onCategoryChange(tab.key)}
                aria-pressed={isSelected}
                className={cn(
                  'flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-150',
                  isSelected
                    ? 'bg-plug-blue-600 text-white shadow-blue'
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Icon
                  size={16}
                  className={cn('shrink-0', isSelected ? 'text-white' : 'text-slate-400')}
                  aria-hidden="true"
                />
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
