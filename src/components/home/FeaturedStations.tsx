// src/components/home/FeaturedStations.tsx
'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button, SectionHeader } from '@/components/ui'
import { MOCK_STATIONS } from '@/lib/mock-data'
import { StationCard } from './StationCard'

const FEATURED = MOCK_STATIONS.slice(0, 3)

export function FeaturedStations() {
  const [savedIds, setSavedIds] = React.useState<string[]>([])

  const toggleSaved = React.useCallback((stationId: string) => {
    setSavedIds((current) =>
      current.includes(stationId)
        ? current.filter((id) => id !== stationId)
        : [...current, stationId],
    )
  }, [])

  return (
    <section className="section-padding bg-white">
      <div className="container-plug">
        <SectionHeader
          align="left"
          eyebrow="Top Rated"
          eyebrowColor="green"
          title="Featured Charging Stations"
          subtitle="Verified stations with the highest ratings from our community."
          action={
            <Link
              href="/map"
              className="flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
            >
              View all stations
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              animationDelay={index * 100}
              isSaved={savedIds.includes(station.id)}
              onSave={toggleSaved}
              className="animate-fade-up opacity-0"
            />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Button href="/map" variant="secondary" size="md">
            View All Stations
          </Button>
        </div>
      </div>
    </section>
  )
}
