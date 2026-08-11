// src/components/route/SaveRouteModal.tsx
'use client'

import { BookmarkCheck, MapPin, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { PlannedRoute } from '@/lib/types'

export interface SaveRouteModalProps {
  isOpen: boolean
  onClose: () => void
  route: PlannedRoute
  onConfirm: () => void
}

export function SaveRouteModal({ isOpen, onClose, route, onConfirm }: SaveRouteModalProps) {
  React.useEffect(() => {
    if (!isOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-route-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[480px] rounded-3xl bg-white p-8 shadow-modal"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>

        <span className="mb-5 inline-flex rounded-2xl bg-blue-50 p-3">
          <BookmarkCheck size={40} className="text-plug-blue-600" aria-hidden="true" />
        </span>

        <h2 id="save-route-title" className="mb-2 text-2xl font-bold text-slate-900">
          Save this route?
        </h2>

        <p className="mb-8 text-slate-500">
          Sign in to save routes to your profile and access them anytime.
        </p>

        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <MapPin size={20} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">
              {route.origin} &rarr; {route.destination}
            </span>
            <span className="block text-sm text-slate-500">
              {route.stops.length} charging stop{route.stops.length === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <Button href="/login" fullWidth onClick={onConfirm}>
            Sign in to Save
          </Button>
          <Button href="/signup" variant="secondary" fullWidth>
            Create Free Account
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  )
}
