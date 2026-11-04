// src/app/admin/(protected)/reviews/listing-select.tsx
'use client'

import { useRouter } from 'next/navigation'

import { k, s } from '@/components/admin/people/kit'

/**
 * Which listing's reviews to show (the design's .selw select).
 *
 * A plain GET form, so picking a listing is a URL change that works before
 * any script has loaded (the Apply button, shown only without script); with
 * script, choosing an option applies it straight away, as in the design.
 */
export function ListingSelect({
  value,
  q,
  options,
}: {
  value: string
  q: string
  options: { value: string; label: string; count: number }[]
}) {
  const router = useRouter()

  return (
    <form method="get" action="/admin/reviews" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {q ? <input type="hidden" name="q" value={q} /> : null}
      <label className={s.selw}>
        <span className={s.sr}>Filter by listing</span>
        <select
          name="listing"
          defaultValue={value}
          onChange={(event) => {
            const search = new URLSearchParams()
            if (q) search.set('q', q)
            if (event.target.value) search.set('listing', event.target.value)
            const qs = search.toString()
            router.push(`/admin/reviews${qs ? `?${qs}` : ''}`, { scroll: false })
          }}
        >
          <option value="">Every listing</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} · {option.count}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className={k('btn', 'btn--line', 'btn--sm')}>
          Apply
        </button>
      </noscript>
    </form>
  )
}
