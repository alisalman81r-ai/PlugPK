// src/app/admin/(protected)/reviews/listing-select.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { k } from '@/components/admin/people/kit'
import { ThemedSelect } from '@/components/ui/ThemedSelect'

/**
 * Which listing's reviews to show (the design's .selw select).
 *
 * A plain GET form, so picking a listing is a URL change (the Apply button,
 * shown only without script, submits the hidden `listing` input); with
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
  const [listing, setListing] = React.useState(value)

  return (
    <form method="get" action="/admin/reviews" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {q ? <input type="hidden" name="q" value={q} /> : null}
      <ThemedSelect
        name="listing"
        aria-label="Filter by listing"
        value={listing}
        onChange={(next) => {
          setListing(next)
          const search = new URLSearchParams()
          if (q) search.set('q', q)
          if (next) search.set('listing', next)
          const qs = search.toString()
          router.push(`/admin/reviews${qs ? `?${qs}` : ''}`, { scroll: false })
        }}
        className="h-12 rounded-[14px] border border-ink/[.09] bg-paper pl-3.5"
        wrapperClassName="min-w-0 max-w-full max-[640px]:w-full"
        options={[
          { value: '', label: 'Every listing' },
          ...options.map((option) => ({ value: option.value, label: `${option.label} · ${option.count}` })),
        ]}
      />
      <noscript>
        <button type="submit" className={k('btn', 'btn--line', 'btn--sm')}>
          Apply
        </button>
      </noscript>
    </form>
  )
}
