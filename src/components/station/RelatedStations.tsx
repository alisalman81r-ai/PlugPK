// src/components/station/RelatedStations.tsx
import { StationCard } from '@/components/home/StationCard'
import { getStations } from '@/lib/db/queries'

export interface RelatedStationsProps {
  currentStationId: string
  city: string
}

const RELATED_COUNT = 3

export async function RelatedStations({ currentStationId, city }: RelatedStationsProps) {
  const others = (await getStations()).filter((station) => station.id !== currentStationId)
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
