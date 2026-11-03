// src/components/tools/MyCarHint.tsx
'use client'

import { Car, Check } from '@/components/ui/icons'
import Link from 'next/link'

import type { MyCar } from '@/hooks/useMyCar'

/**
 * Says where a pre-selected car came from, so it never reads as the site
 * guessing: "Your car · from your garage". When the driver has picked a
 * different car, offers theirs back in one tap. Renders nothing for a driver
 * with no car in their garage.
 */
export function MyCarHint({
  car,
  selected,
  onUse,
}: {
  car: MyCar | null | undefined
  /** The slug currently chosen in the tool. */
  selected: string
  onUse: (slug: string) => void
}) {
  if (!car) return null

  if (selected === car.slug) {
    return (
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
        <Check size={13} className="shrink-0 text-[#157A45]" aria-hidden="true" />
        <span>
          Your car, from{' '}
          <Link href="/dashboard/vehicles" className="font-semibold text-ink underline decoration-volt-ink/50 underline-offset-[3px] hover:decoration-ink">
            your garage
          </Link>
        </span>
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onUse(car.slug)}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-volt-edge bg-volt-tint px-3 text-[13px] font-semibold text-volt-ink transition-colors hover:border-ink hover:bg-ink hover:text-volt"
    >
      <Car size={13} aria-hidden="true" />
      Use my car · {car.name}
    </button>
  )
}
