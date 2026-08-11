// src/components/station/RelatedStations.tsx
import { StationCard } from '@/components/home/StationCard'
import { MOCK_STATIONS } from '@/lib/mock-data'

export interface RelatedStationsProps {
  currentStationId: string
  city: string
}

const RELATED_COUNT = 3

export function RelatedStations({ currentStationId, city }: RelatedStationsProps) {
  const others = MOCK_STATIONS.filter((station) => station.id !== currentStationId)
  const sameCity = others.filter((station) => station.address.city === city)

  // Top up with stations from other cities when the current city is thin.
  const related = [
    ...sameCity,
    ...others.filter((station) => station.address.city !== city),
  ].slice(0, RELATED_COUNT)

  if (related.length === 0) return null

  return (
    <section>
      <h2 className="mb-8 text-2xl font-bold text-slate-900">More Stations in {city}</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {related.map((station, index) => (
          <StationCard
            key={station.id}
            station={station}
            animationDelay={index * 100}
            className="animate-fade-up opacity-0"
          />
        ))}
      </div>
    </section>
  )
}
