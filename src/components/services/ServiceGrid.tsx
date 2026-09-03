// src/components/services/ServiceGrid.tsx
'use client'

import { Package } from 'lucide-react'

import { FACE, FRAME } from '@/components/shared/frame'
import { Button, Skeleton } from '@/components/ui'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { STAGGER } from '@/lib/motion'
import type { EVService, ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ServiceCard } from './ServiceCard'
import { CATEGORY_ICON } from './ServiceCategoryTabs'

/**
 * The smallest group that earns its own headed section.
 *
 * Three, because the grid is three columns at its widest: a group that cannot
 * fill one row leaves a visible hole beside it, and six such groups leave a
 * column-wide gap running the length of the page.
 */
const GROUP_MIN = 3

export interface ServiceGridProps {
  services: EVService[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  selectedCategory: ServiceCategory | 'all'
  onClearFilters?: () => void
}

function ServiceCardSkeleton() {
  return (
    // The same frame and face the real card wears, so the swap-in changes
    // nothing but the contents.
    <div role="status" aria-label="Loading service" className={FRAME}>
      <div className={cn(FACE, 'overflow-hidden')}>
        {/* A ratio rather than a fixed height, matching ServiceCard's cover —
            a skeleton of a different shape moves the page when data lands. */}
        <Skeleton className="aspect-[16/10] w-full rounded-none" />
        <div className="p-5">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-3 h-4 w-1/2" />
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-2/3" />
          <Skeleton className="mb-4 h-4 w-1/3" />
          <Skeleton rounded="lg" className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export function ServiceGrid({
  services,
  isLoading,
  viewMode,
  selectedCategory,
  onClearFilters,
}: ServiceGridProps) {
  if (isLoading) {
    return (
      <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => index).map((index) => (
          <ServiceCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    const EmptyIcon =
      selectedCategory === 'all'
        ? Package
        : (CATEGORY_ICON[SERVICE_CATEGORY_META[selectedCategory].icon] ?? Package)

    return (
      <div className="py-20 text-center">
        <EmptyIcon size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No services found</p>
        <p className="text-slate-500">Try a different category or city</p>
        {onClearFilters ? (
          <div className="mt-6">
            <Button variant="ghost" onClick={onClearFilters}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            variant="horizontal"
            animationDelay={index * STAGGER.TIGHT}
            className="animate-fade-up opacity-0"
          />
        ))}
      </div>
    )
  }

  // Grouped by category when browsing everything, flat otherwise.
  if (selectedCategory === 'all') {
    /*
     * Grouped only while the groups are big enough to be worth the space.
     *
     * The catalogue holds twelve services across six categories, so grouping
     * produced six rows of two cards in a three-column track and left the
     * right-hand third of the page empty for its entire length. That reads as
     * an unfinished layout rather than as a small directory.
     *
     * Below the threshold the same cards run as one continuous grid, which
     * fills every row. Nothing is lost by it: each card already carries its
     * category on the cover, and the tabs above filter by category. Once any
     * category can fill a row on its own, the headed sections come back on
     * their own — this is a threshold, not a deletion.
     */
    const groups = SERVICE_CATEGORY_KEYS.map((key) => ({
      key,
      meta: SERVICE_CATEGORY_META[key],
      items: services.filter((service) => service.category === key),
    })).filter((group) => group.items.length > 0)

    const worthGrouping = groups.some((group) => group.items.length >= GROUP_MIN)

    if (!worthGrouping) {
      return (
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              animationDelay={index * STAGGER.TIGHT}
              className="animate-fade-up opacity-0"
            />
          ))}
        </div>
      )
    }

    return (
      <div>
        {groups.map((group, groupIndex) => {
          const Icon = CATEGORY_ICON[group.meta.icon] ?? Package

          return (
            <section key={group.key}>
              <div
                className={cn(
                  'mb-6 flex items-center gap-3',
                  groupIndex === 0 ? 'mt-0' : 'mt-14',
                )}
              >
                <span className={cn('rounded-xl p-2', group.meta.tone)}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h2 className="text-xl font-bold tracking-[-0.01em] text-slate-900">
                  {group.meta.label}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-ui-xs font-bold tabular-nums text-slate-500">
                  {group.items.length}
                </span>
                {/* Carries the heading across the full width so each group
                    reads as its own band rather than a floating label. */}
                <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    animationDelay={index * STAGGER.TIGHT}
                    className="animate-fade-up opacity-0"
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          animationDelay={index * STAGGER.TIGHT}
          className="animate-fade-up opacity-0"
        />
      ))}
    </div>
  )
}
