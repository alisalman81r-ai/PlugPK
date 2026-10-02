// src/components/station/RelatedStations.tsx
import { StationCard } from '@/components/home/StationCard'
import { getStations } from '@/lib/db/queries'
import { STAGGER } from '@/lib/motion'
import { cn } from '@/lib/utils'

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

      {/*
        This grid sits in the page's left column, which narrows to ~460px at
        1024 once the sidebar appears. Three columns there gave 137px cards
        that cut every station name to "F-10…", and one column on a tablet
        stretched a card to 700px. Two columns until the column is wide enough
        for three; the third card waits for that width rather than sitting
        alone on a second row.
      */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {related.map((station, index) => (
          <StationCard
            key={station.id}
            station={station}
            animationDelay={index * STAGGER.TIGHT}
            className={cn('animate-fade-up opacity-0', index === 2 && 'sm:max-xl:hidden')}
          />
        ))}
      </div>
    </section>
  )
}
