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
  type LucideIcon,
} from 'lucide-react'

import type { Amenity, AmenityType } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface AmenitiesGridProps {
  amenities: Amenity[]
}

interface AmenityMeta {
  label: string
  icon: LucideIcon
  tone: string
}

const AMENITY_META: Record<AmenityType, AmenityMeta> = {
  restaurant: { label: 'Restaurant', icon: Utensils, tone: 'bg-orange-50 text-orange-500' },
  hotel: { label: 'Hotel', icon: Bed, tone: 'bg-purple-50 text-purple-500' },
  parking: { label: 'Parking', icon: ParkingSquare, tone: 'bg-blue-50 text-blue-500' },
  washroom: { label: 'Washroom', icon: DoorOpen, tone: 'bg-cyan-50 text-cyan-500' },
  wifi: { label: 'WiFi', icon: Wifi, tone: 'bg-green-50 text-green-500' },
  shopping: { label: 'Shopping', icon: ShoppingBag, tone: 'bg-pink-50 text-pink-500' },
  prayer: { label: 'Prayer', icon: Star, tone: 'bg-emerald-50 text-emerald-500' },
  cafe: { label: 'Café', icon: Coffee, tone: 'bg-amber-50 text-amber-500' },
}

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  if (amenities.length === 0) {
    return <p className="text-sm text-slate-400">No amenity information yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {amenities.map((amenity) => {
        const meta = AMENITY_META[amenity.type]
        const Icon = meta.icon

        return (
          <div
            key={amenity.type}
            title={amenity.note}
            className={cn(
              'flex flex-col items-center rounded-2xl border p-4 text-center transition-colors duration-150',
              amenity.available
                ? 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50'
                : 'border-slate-100 bg-[#FAFAFA] opacity-50',
            )}
          >
            <span
              className={cn(
                'mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl',
                amenity.available ? meta.tone : 'bg-slate-100 text-slate-300',
              )}
            >
              <Icon size={22} aria-hidden="true" />
            </span>

            <span
              className={cn(
                'text-xs font-semibold',
                amenity.available ? 'text-slate-700' : 'text-slate-300',
              )}
            >
              {meta.label}
            </span>

            <span
              className={cn(
                'mt-1 text-[10px]',
                amenity.available ? 'text-green-600' : 'text-slate-400',
              )}
            >
              {amenity.available ? 'Available' : 'Not available'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
