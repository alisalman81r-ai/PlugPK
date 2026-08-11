// src/components/route/RouteResultsView.tsx
'use client'

import { Bookmark, BookmarkCheck, ChevronLeft, Share2, Zap } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { PlannedRoute } from '@/lib/types'
import { RouteMap } from './RouteMap'
import { RouteStopCard } from './RouteStopCard'
import { RouteSummaryBar } from './RouteSummaryBar'

export interface RouteResultsViewProps {
  route: PlannedRoute
  onReset: () => void
  onSave: () => void
  isSaved: boolean
}

export function RouteResultsView({ route, onReset, onSave, isSaved }: RouteResultsViewProps) {
  const [copied, setCopied] = React.useState(false)

  const startBattery = route.stops[0] ? route.stops[0].arrivalBatteryPercent + 25 : 80

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied — nothing further to fall back to.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<ChevronLeft size={16} />}>
          Plan another route
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            leftIcon={isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            className={isSaved ? 'border-blue-200 text-plug-blue-600' : undefined}
          >
            {isSaved ? 'Saved' : 'Save Route'}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare} leftIcon={<Share2 size={16} />}>
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
      </div>

      <RouteSummaryBar route={route} />

      <div className="mt-2 grid items-start gap-10 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Zap size={20} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Charging Stops</h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {route.stops.length} stop{route.stops.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-slate-600">
              Starting from {route.origin}
            </span>
            <span className="ml-auto font-mono text-green-600">{startBattery}%</span>
          </div>

          <div className="flex flex-col gap-4">
            {route.stops.map((stop, index) => (
              <div key={stop.station.id}>
                <RouteStopCard
                  stop={stop}
                  totalStops={route.stops.length}
                  isFirst={index === 0}
                  isLast={index === route.stops.length - 1}
                />
                {index < route.stops.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-4 block h-4 w-0 border-l-2 border-dashed border-slate-200"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-slate-600">
              Arriving at {route.destination}
            </span>
            <span className="ml-auto font-mono text-amber-600">~45%</span>
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <RouteMap route={route} />
        </div>
      </div>
    </div>
  )
}
