// src/components/services/ServiceGrid.tsx
'use client'

import * as React from 'react'

import { Package } from '@/components/ui/icons'

import { Skeleton } from '@/components/ui'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { EVService } from '@/lib/types'
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
export const GROUP_MIN = 3

/** landing-v2's .sv-grid: three across from 1200px, two from 640px, one below. */
export const SERVICE_GRID = 'grid items-stretch gap-4 sm:grid-cols-2 sm:gap-[22px] xl:grid-cols-3'
/** .sv-grid.is-list: one column, tighter. */
const SERVICE_LIST = 'grid grid-cols-1 gap-3 sm:gap-3.5'

export interface ServiceGridProps {
  /** Every service, in the chosen order — the filtered-out ones too. */
  services: EVService[]
  /** The ids that pass the filters; the rest render hidden. */
  visible: ReadonlySet<string>
  isLoading: boolean
  viewMode: 'grid' | 'list'
  /** Headed sections per category, when browsing everything and a category can fill a row. */
  grouped: boolean
}

function ServiceCardSkeleton() {
  return (
    // The same frame and face the real card wears, so the swap-in changes
    // nothing but the contents.
    <div role="status" aria-label="Loading service" className="overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1">
      <div>
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

/**
 * The directory's cards (landing-v2 #svGrid).
 *
 * Every service is rendered, in order, and the ones the filters exclude are
 * hidden rather than dropped — as page-services.js does it. Keeping the
 * elements is what lets the directory Flip them: a filtered-out card fades
 * and shrinks where it stood, a returning one springs back in, and the rest
 * glide to their new places. The ref is the grid itself, whose height the
 * directory eases between the before and after.
 */
export const ServiceGrid = React.forwardRef<HTMLDivElement, ServiceGridProps>(function ServiceGrid(
  { services, visible, isLoading, viewMode, grouped },
  ref,
) {
  if (isLoading) {
    return (
      <div className={SERVICE_GRID}>
        {Array.from({ length: 6 }, (_, index) => index).map((index) => (
          <ServiceCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const list = viewMode === 'list'

  if (grouped) {
    /*
     * Grouped only while the groups are big enough to be worth the space.
     *
     * With a dozen services over six categories, grouping produced six rows of
     * two cards in a three-column track and left the right-hand third of the
     * page empty for its entire length. Below the threshold the same cards run
     * as one continuous grid, which fills every row; once any category can
     * fill a row on its own, the headed sections come back — this is a
     * threshold, not a deletion.
     */
    const groups = SERVICE_CATEGORY_KEYS.map((key) => {
      const items = services.filter((service) => service.category === key)
      return { key, meta: SERVICE_CATEGORY_META[key], items, shown: items.filter((s) => visible.has(s.id)).length }
    }).filter((group) => group.shown > 0)

    return (
      <div ref={ref} data-services-grid="" className="relative">
        {groups.map((group, groupIndex) => {
          const Icon = CATEGORY_ICON[group.meta.icon] ?? Package

          return (
            <section key={group.key}>
              <div className={cn('mb-6 flex items-center gap-3', groupIndex === 0 ? 'mt-0' : 'mt-14')}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-volt">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h2 className="font-display text-[26px] leading-[1.1] text-ink">{group.meta.label}</h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-muted ring-1 ring-ink/10">
                  {group.shown}
                </span>
                {/* Carries the heading across the full width so each group
                    reads as its own band rather than a floating label. */}
                <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
              </div>

              <div className={SERVICE_GRID}>
                {group.items.map((service) => (
                  <ServiceCard key={service.id} service={service} hidden={!visible.has(service.id)} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={ref} data-services-grid="" className={cn('relative', list ? SERVICE_LIST : SERVICE_GRID)}>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          variant={list ? 'horizontal' : 'default'}
          hidden={!visible.has(service.id)}
        />
      ))}
    </div>
  )
})
