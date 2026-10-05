// src/components/admin/car-inventory-filter.ts
import type { CarAudit } from '@/lib/car-admin'

/**
 * The car list's search, lenses and sorts, as plain functions.
 *
 * They ran inside CarInventory over the whole catalogue in the browser. The
 * audit (completeness, warnings) is computed in TypeScript rather than in the
 * database, so the cars page still reads every car to build the summary tiles —
 * but it now filters, sorts and slices on the server and ships one page of
 * rows. Kept out of the 'use client' component so the server page can call it.
 */

export type SortKey = 'name' | 'price' | 'completeness' | 'category'
export type Lens = 'all' | 'attention' | 'no-photo' | 'indicative'

export const SORT_KEYS: SortKey[] = ['name', 'price', 'completeness', 'category']
export const LENS_KEYS: Lens[] = ['all', 'attention', 'no-photo', 'indicative']

export const LENSES: { key: Lens; label: string; hint: string }[] = [
  { key: 'all', label: 'All cars', hint: 'The whole catalogue' },
  { key: 'attention', label: 'Needs attention', hint: 'Carries at least one warning' },
  { key: 'no-photo', label: 'No photograph', hint: 'Falls back to a placeholder on the site' },
  { key: 'indicative', label: 'Indicative price', hint: 'Not from a dealer price list' },
]

const inLens: Record<Lens, (audit: CarAudit) => boolean> = {
  all: () => true,
  attention: (audit) => audit.issues.some((issue) => issue.level === 'warn'),
  'no-photo': (audit) => audit.car.image === null,
  indicative: (audit) => !audit.priceConfirmed,
}

export function countLenses(audits: CarAudit[]): Record<Lens, number> {
  return {
    all: audits.length,
    attention: audits.filter(inLens.attention).length,
    'no-photo': audits.filter(inLens['no-photo']).length,
    indicative: audits.filter(inLens.indicative).length,
  }
}

export function filterAudits(audits: CarAudit[], query: string, lens: Lens, sort: SortKey): CarAudit[] {
  const needle = query.trim().toLowerCase()
  const rows = audits.filter(
    (audit) =>
      inLens[lens](audit) &&
      (!needle ||
        [audit.car.fullName, audit.car.brand, audit.car.model, audit.car.category, audit.car.slug]
          .join(' ')
          .toLowerCase()
          .includes(needle)),
  )

  return rows.sort((a, b) => {
    if (sort === 'price') return a.car.price.min - b.car.price.min
    // Least complete first: a completeness sort is a work queue, so the row
    // that needs doing belongs at the top rather than buried at the bottom.
    if (sort === 'completeness') return a.completeness - b.completeness
    if (sort === 'category') {
      return a.car.category.localeCompare(b.car.category) || a.car.fullName.localeCompare(b.car.fullName)
    }
    return a.car.fullName.localeCompare(b.car.fullName)
  })
}
