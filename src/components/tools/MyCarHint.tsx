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
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ui-xs text-slate-500">
        <Check size={13} className="shrink-0 text-emerald-600" aria-hidden="true" />
        <span>
          Your car, from{' '}
          <Link href="/dashboard/vehicles" className="font-semibold text-plug-blue-600 hover:underline">
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
      className="inline-flex items-center gap-1.5 rounded-full border border-plug-blue-200 bg-plug-blue-50 px-3 py-1 text-ui-xs font-semibold text-plug-blue-700 transition-colors hover:bg-plug-blue-100"
    >
      <Car size={13} aria-hidden="true" />
      Use my car · {car.name}
    </button>
  )
}
