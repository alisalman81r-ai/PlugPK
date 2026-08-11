// src/components/community/CategoryTabs.tsx
'use client'

import {
  Car,
  Layers,
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

export type CommunitySortOption = 'latest' | 'popular' | 'trending'

export interface CategoryTabsProps {
  selectedCategory: PostCategory | 'all'
  onCategoryChange: (category: PostCategory | 'all') => void
  categoryCount: Record<string, number>
  sortBy: CommunitySortOption
  onSortChange: (sort: CommunitySortOption) => void
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

const SORTS: { key: CommunitySortOption; label: string }[] = [
  { key: 'latest', label: 'Latest' },
  { key: 'popular', label: 'Popular' },
  { key: 'trending', label: 'Trending' },
]

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
  categoryCount,
  sortBy,
  onSortChange,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-[72px] z-30 border-b border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="container-plug scrollbar-hide flex items-center justify-between overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 py-3">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            aria-pressed={selectedCategory === 'all'}
            className={cn(
              'flex h-[38px] items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-150',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            )}
          >
            <Layers size={16} className="shrink-0" aria-hidden="true" />
            All Posts
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              {categoryCount.all ?? 0}
            </span>
          </button>

          {POST_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id
            const Icon = POST_ICON[category.icon] ?? MessageCircle

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                aria-pressed={isSelected}
                className={cn(
                  'flex h-[38px] items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-150',
                  isSelected
                    ? category.active
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Icon size={16} className="shrink-0" aria-hidden="true" />
                {category.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {categoryCount[category.id] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-2 border-l border-slate-100 pl-4">
          {SORTS.map((sort) => (
            <button
              key={sort.key}
              type="button"
              onClick={() => onSortChange(sort.key)}
              aria-pressed={sortBy === sort.key}
              className={cn(
                'h-[34px] rounded-lg px-3 text-sm font-medium transition-all duration-150',
                sortBy === sort.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50',
              )}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
