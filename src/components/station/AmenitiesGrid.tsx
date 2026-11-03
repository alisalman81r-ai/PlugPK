// src/components/station/AmenitiesGrid.tsx
import {
  Bed,
  Coffee,
  DoorOpen,
  ParkingSquare,
  ShoppingBag,
  Star,
  Utensils,
  Wifi,
  type IconType,
} from '@/components/ui/icons'

import { AnimatedIcon, HoverMotion, type IconMotion } from '@/components/ui'
import type { Amenity, AmenityType } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface AmenitiesGridProps {
  amenities: Amenity[]
}

interface AmenityMeta {
  label: string
  icon: IconType
  /** Matched to the glyph: the kettle steams, the bed settles, wifi pulses. */
  motion: IconMotion
  tone: string
}

const AMENITY_META: Record<AmenityType, AmenityMeta> = {
  restaurant: { label: 'Restaurant', icon: Utensils, motion: 'pop', tone: 'bg-orange-50 text-orange-500' },
  hotel: { label: 'Hotel', icon: Bed, motion: 'lift', tone: 'bg-purple-50 text-purple-500' },
  parking: { label: 'Parking', icon: ParkingSquare, motion: 'slide', tone: 'bg-blue-50 text-blue-500' },
  washroom: { label: 'Washroom', icon: DoorOpen, motion: 'swing', tone: 'bg-cyan-50 text-cyan-700' },
  wifi: { label: 'WiFi', icon: Wifi, motion: 'pulse', tone: 'bg-green-50 text-green-500' },
  shopping: { label: 'Shopping', icon: ShoppingBag, motion: 'lift', tone: 'bg-pink-50 text-pink-500' },
  prayer: { label: 'Prayer', icon: Star, motion: 'pop', tone: 'bg-emerald-50 text-emerald-500' },
  cafe: { label: 'Café', icon: Coffee, motion: 'swing', tone: 'bg-amber-50 text-amber-500' },
}

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  if (amenities.length === 0) {
    return <p className="text-sm text-muted">No amenity information yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {amenities.map((amenity) => {
        const meta = AMENITY_META[amenity.type]
        const Icon = meta.icon

        return (
          <HoverMotion
            key={amenity.type}
            title={amenity.note}
            className={cn(
              'flex flex-col items-center rounded-[20px] border p-4 text-center transition-[border-color,transform] duration-300 ease-out',
              amenity.available
                ? 'border-ink/10 bg-paper hover:-translate-y-0.5 hover:border-ink/25'
                : 'border-dashed border-ink/10 bg-transparent opacity-55',
            )}
          >
            <span
              className={cn(
                'mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl',
                amenity.available ? 'bg-ink text-volt' : 'bg-stone text-fog',
              )}
            >
              <AnimatedIcon motion={meta.motion}>
                <Icon size={22} aria-hidden="true" />
              </AnimatedIcon>
            </span>

            <span
              className={cn(
                'text-sm font-semibold',
                amenity.available ? 'text-ink' : 'text-muted',
              )}
            >
              {meta.label}
            </span>

            <span
              className={cn(
                'mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em]',
                amenity.available ? 'text-[#157A45]' : 'text-muted',
              )}
            >
              {amenity.available ? 'Available' : 'Not available'}
            </span>
          </HoverMotion>
        )
      })}
    </div>
  )
}
