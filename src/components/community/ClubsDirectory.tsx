// src/components/community/ClubsDirectory.tsx
import { Button, SectionHeader } from '@/components/ui'
import type { EVClub } from '@/lib/types'
import { ClubCard } from './ClubCard'

export interface ClubsDirectoryProps {
  clubs: EVClub[]
}

export function ClubsDirectory({ clubs }: ClubsDirectoryProps) {
  return (
    <section>
      <SectionHeader
        align="center"
        eyebrow="EV Clubs"
        eyebrowColor="blue"
        title="Find Your EV Club"
        subtitle="Connect with EV owners in your city."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {clubs.map((club, index) => (
          <ClubCard
            key={club.id}
            club={club}
            animationDelay={index * 80}
            className="animate-fade-up opacity-0"
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="mb-4 text-slate-500">Don&apos;t see your city?</p>
        <Button href="/community/clubs/new" variant="secondary">
          Start a Club
        </Button>
      </div>
    </section>
  )
}
