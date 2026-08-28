// src/components/community/CategoryTabs.tsx
'use client'

import {
  Car,
  Layers,
  ListFilter,
  Map,
  MessageCircle,
  Newspaper,
  ShoppingCart,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { POST_CATEGORIES } from '@/lib/constants'
import type { PostCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The board's one control surface: what to read, and in what order.
 *
 * This was a full-bleed white bar stuck under the navbar, and it had two
 * problems worth the rewrite.
 *
 * The sort buttons lived *inside* the same `overflow-x-auto` element as the
 * seven category tabs. On a phone that put them past the right edge of a
 * horizontal scroller, so changing the order of the feed meant swiping through
 * every category first — and nothing on screen suggested they were there. The
 * tabs scroll now; sort does not.
 *
 * And as a bar it read as chrome. It is the same kind of thing as the map's
 * filter rail and the planner's popular-routes card, so it is built the same
 * way: one card on the page's measure, lifted up into the dark band above, with
 * its heading and the result count in a header band and the controls beneath.
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
export const POST_ICON: Record<string, LucideIcon> = {
  MessageCircle,
  Zap,
  Map,
  Car,
  ShoppingCart,
  Newspaper,
}

/**
 * Each sort says what it orders by.
 *
 * "Popular" and "Trending" are indistinguishable as bare words — both sound
 * like "the good ones" — and they sort by different columns, so the column is
 * part of the label.
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
    <section
      aria-label="Browse discussions"
      className={cn(
        'overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-e4',
        className,
      )}
    >
      {/*
        The count lives in the header rather than beside the tabs: it is the
        answer to every control in this card, and it has to keep its place when
        a category with two posts replaces one with nine.
      */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
            <ListFilter size={13} aria-hidden="true" />
            Browse
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Discussions
          </h2>
          <p aria-live="polite" className="mt-1.5 text-ui text-slate-500">
            Showing <span className="font-semibold text-slate-900">{resultCount}</span> of{' '}
            {totalCount} {totalCount === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/*
          A segmented control, because the three sorts are one ordered choice
          rather than three independent toggles — and the column each one sorts
          by sits under its label, the way the map's speed filter names its kW
          ranges instead of leaving "Rapid" to be guessed at.
        */}
        <div
          role="radiogroup"
          aria-label="Sort discussions"
          className="scrollbar-hide flex shrink-0 gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1"
        >
          {SORTS.map((sort) => {
            const selected = sortBy === sort.key

            return (
              <button
                key={sort.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSortChange(sort.key)}
                className={cn(
                  'min-w-0 rounded-xl px-3.5 py-2 text-center transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                  selected ? 'bg-white shadow-e1' : 'hover:bg-white/60',
                )}
              >
                <span
                  className={cn(
                    'block whitespace-nowrap text-ui-sm font-bold',
                    selected ? 'text-plug-blue-700' : 'text-slate-600',
                  )}
                >
                  {sort.label}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block whitespace-nowrap font-mono text-[10px]',
                    selected ? 'text-plug-blue-500' : 'text-slate-400',
                  )}
                >
                  {sort.by}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/*
        The tabs get the scroller to themselves. Eight of them will not fit a
        phone at any type size worth reading, and the fade on the right edge is
        what tells you the row continues — a plain clipped edge reads as the end
        of the list.
      */}
      <div className="relative">
        <div className="scrollbar-hide overflow-x-auto px-5 py-4 sm:px-6 lg:px-8">
          <div
            role="radiogroup"
            aria-label="Post category"
            className="flex min-w-max items-center gap-2"
          >
            <Tab
              icon={Layers}
              label="All posts"
              count={categoryCount.all ?? 0}
              selected={selectedCategory === 'all'}
              onClick={() => onCategoryChange('all')}
            />

            {POST_CATEGORIES.map((category) => (
              <Tab
                key={category.id}
                icon={POST_ICON[category.icon] ?? MessageCircle}
                label={category.label}
                count={categoryCount[category.id] ?? 0}
                selected={selectedCategory === category.id}
                activeClass={category.active}
                onClick={() => onCategoryChange(category.id)}
              />
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent lg:hidden"
        />
      </div>
    </section>
  )
}

/**
 * One category tab.
 *
 * A radio rather than a pressed button: picking a category is choosing one
 * value out of eight, and as eight independent `aria-pressed` toggles — what
 * they were — a screen reader gave no hint that picking one dropped the others.
 * Not a tablist, which would promise a tabpanel per category; there is one feed.
 *
 * The count is inside the tab because it is the reason to pick it or skip it;
 * a category showing 0 is worth knowing before the tap, not after.
 */
function Tab({
  icon: Icon,
  label,
  count,
  selected,
  activeClass,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  selected: boolean
  /** Per-category selected colour from POST_CATEGORIES; slate for "all". */
  activeClass?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-ui-sm font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        selected
          ? cn('border-transparent shadow-e1', activeClass ?? 'bg-plug-navy-900 text-white')
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      <Icon size={15} className="shrink-0" aria-hidden="true" />
      {label}
      <span
        className={cn(
          'rounded-full px-2 py-0.5 font-mono text-[11px] font-bold',
          selected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500',
        )}
      >
        {count}
      </span>
    </button>
  )
}
