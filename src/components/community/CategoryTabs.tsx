// src/components/community/CategoryTabs.tsx
'use client'

import {
  Car,
  LayoutGrid,
  ListFilter,
  Map,
  MessageCircle,
  Newspaper,
  ShoppingCart,
  Zap,
  type IconType,
} from '@/components/ui/icons'

import { ChipCount, Lift, LiftBody, LiftHead, SEG, chipClass, segButtonClass } from '@/components/v2/ui'
import { POST_CATEGORIES } from '@/lib/constants'
import type { PostCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The board's one control surface: what to read, and in what order —
 * landing-v2's browse sheet (.lift.cm-lift), lifted up into the hero.
 *
 * The header holds the heading, the result count (the answer to every control
 * in the sheet, so it keeps its place) and the sort; the category chips scroll
 * on their own row underneath, so on a phone the sort is never pushed past the
 * right edge of a scroller.
 */

export type CommunitySortOption = 'latest' | 'popular' | 'trending'

export interface CategoryTabsProps {
  selectedCategory: PostCategory | 'all'
  onCategoryChange: (category: PostCategory | 'all') => void
  categoryCount: Record<string, number>
  sortBy: CommunitySortOption
  onSortChange: (sort: CommunitySortOption) => void
  /** Posts the current category and search leave standing. */
  resultCount: number
  /** Posts on the board altogether. */
  totalCount: number
  className?: string
}

/** Resolves the icon names stored in POST_CATEGORIES to components. */
export const POST_ICON: Record<string, IconType> = {
  MessageCircle,
  Zap,
  Map,
  Car,
  ShoppingCart,
  Newspaper,
}

/**
 * Each sort says what it orders by: "Popular" and "Trending" are
 * indistinguishable as bare words, and they sort by different columns.
 */
const SORTS: { key: CommunitySortOption; label: string; by: string }[] = [
  { key: 'latest', label: 'Latest', by: 'newest first' },
  { key: 'popular', label: 'Popular', by: 'most liked' },
  { key: 'trending', label: 'Trending', by: 'most replies' },
]

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
  categoryCount,
  sortBy,
  onSortChange,
  resultCount,
  totalCount,
  className,
}: CategoryTabsProps) {
  return (
    <Lift className={className}>
      <section aria-label="Browse discussions">
        <LiftHead
          className="items-start lg:items-end [&>div:last-child]:w-full sm:[&>div:last-child]:w-auto"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <ListFilter size={12} aria-hidden="true" />
              Browse
            </span>
          }
          title="Discussions"
          meta={
            <span aria-live="polite">
              Showing <b className="font-mono font-semibold">{resultCount}</b> of {totalCount}{' '}
              {totalCount === 1 ? 'post' : 'posts'}
            </span>
          }
          actions={
            /* One ordered choice, so a radiogroup rather than three toggles. */
            <div role="radiogroup" aria-label="Sort discussions" className={cn(SEG, 'w-full sm:w-auto')}>
              {SORTS.map((sort) => {
                const selected = sortBy === sort.key
                return (
                  <button
                    key={sort.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSortChange(sort.key)}
                    className={segButtonClass(
                      selected,
                      'min-h-12 min-w-0 flex-1 px-1.5 focus-visible:outline-none focus-visible:shadow-focus sm:min-w-[112px] sm:flex-none sm:px-4',
                    )}
                  >
                    <span className="whitespace-nowrap">{sort.label}</span>
                    <small
                      className={cn(
                        'whitespace-nowrap font-mono text-[10px] font-medium',
                        selected ? 'text-volt-ink' : 'text-fog',
                      )}
                    >
                      {sort.by}
                    </small>
                  </button>
                )
              })}
            </div>
          }
        />

        <LiftBody className="relative pb-5 pt-[18px] sm:pb-5">
          <div className="scrollbar-hide -mx-[18px] overflow-x-auto px-[18px] py-1.5 sm:-mx-7 sm:px-7">
            {/* A radio rather than a pressed button: picking a category is one
                value out of seven, and there is one feed, so not a tablist. */}
            <div role="radiogroup" aria-label="Post category" className="flex min-w-max items-center gap-2">
              <Chip
                icon={LayoutGrid}
                label="All posts"
                count={categoryCount.all ?? 0}
                selected={selectedCategory === 'all'}
                onClick={() => onCategoryChange('all')}
              />
              {POST_CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  icon={POST_ICON[category.icon] ?? MessageCircle}
                  label={category.label}
                  count={categoryCount[category.id] ?? 0}
                  selected={selectedCategory === category.id}
                  onClick={() => onCategoryChange(category.id)}
                />
              ))}
            </div>
          </div>
          {/* The fade says the row continues where a clipped edge reads as the end. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper to-transparent xl:hidden"
          />
        </LiftBody>
      </section>
    </Lift>
  )
}

function Chip({
  icon: Icon,
  label,
  count,
  selected,
  onClick,
}: {
  icon: IconType
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={chipClass(selected, 'h-11 focus-visible:outline-none focus-visible:shadow-focus')}
    >
      <Icon aria-hidden="true" className={cn('transition-colors duration-200', selected ? 'text-volt' : 'text-muted')} />
      {label}
      <ChipCount on={selected}>{count}</ChipCount>
    </button>
  )
}
