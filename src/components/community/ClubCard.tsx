// src/components/community/ClubCard.tsx
'use client'

import { MapPin, Users } from 'lucide-react'
import * as React from 'react'

import type { EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ClubCardProps {
  club: EVClub
  variant?: 'default' | 'compact'
  animationDelay?: number
  className?: string
}

const COVER_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-blue-500',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-purple-500',
]

/** Stable per-city colour so a club always looks the same. */
function coverGradient(city: string): string {
  let hash = 0
  for (let index = 0; index < city.length; index += 1) {
    hash = (hash + city.charCodeAt(index)) % COVER_GRADIENTS.length
  }
  return COVER_GRADIENTS[hash] ?? COVER_GRADIENTS[0]!
}

export function ClubCard({ club, variant = 'default', animationDelay, className }: ClubCardProps) {
  const [isJoined, setIsJoined] = React.useState(club.isJoined ?? false)
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined

  const joinButton = (
    <button
      type="button"
      onClick={() => setIsJoined((joined) => !joined)}
      aria-pressed={isJoined}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-colors duration-150',
        isJoined ? 'bg-green-600 hover:bg-green-700' : 'bg-plug-blue-600 hover:bg-plug-blue-700',
      )}
    >
      {isJoined ? 'Joined ✓' : 'Join Club'}
    </button>
  )

  if (variant === 'compact') {
    return (
      <div
        style={style}
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              coverGradient(club.city),
            )}
          >
            <Users size={18} className="text-white" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{club.name}</span>
            <span className="block text-xs text-slate-400">
              {club.city} · {club.memberCount} members
            </span>
          </span>
        </span>
      </div>
    )
  }

  return (
    <div
      style={style}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-[250ms] hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative mb-5 flex h-[100px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br',
          coverGradient(club.city),
        )}
      >
        <Users size={48} className="text-white/20" />
        <span className="absolute text-5xl font-black text-white/30">{club.name.charAt(0)}</span>
      </span>

      <h3 className="mb-1 text-lg font-bold text-slate-900">{club.name}</h3>

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-sm text-slate-500">{club.city}</span>
        </span>
        <span className="shrink-0 text-sm">
          <span className="font-bold text-slate-900">{club.memberCount}</span>{' '}
          <span className="text-slate-400">members</span>
        </span>
      </div>

      {club.description ? (
        <p className="mb-5 line-clamp-2 text-sm text-slate-500">{club.description}</p>
      ) : null}

      {joinButton}
    </div>
  )
}
