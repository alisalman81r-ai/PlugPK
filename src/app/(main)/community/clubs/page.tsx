// src/app/community/clubs/page.tsx
import { ChevronLeft, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ClubsDirectory } from '@/components/community/ClubsDirectory'
import { getClubs } from '@/lib/db/queries'

export const metadata: Metadata = {
  title: 'EV Clubs Pakistan',
  description:
    'Find and join EV clubs in your city. Connect with electric vehicle owners across Pakistan.',
}

/**
 * Clubs come from the database now rather than the fixture, so the member
 * counts move when somebody joins instead of being the same eight numbers for
 * everyone forever.
 */
export const revalidate = 300

export default async function CommunityClubsPage() {
  const clubs = await getClubs()

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="container-plug relative z-10">
          <Link
            href="/community"
            className="group/back mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft
              size={16}
              className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
              aria-hidden="true"
            />
            Community
          </Link>

          <div className="text-center">
            <Users size={40} className="mx-auto text-white" aria-hidden="true" />
            <h1 className="mt-5 text-4xl font-black text-white">EV Clubs Pakistan</h1>
            <p className="mt-4 text-white/60">Find and join EV clubs in your city</p>
          </div>
        </div>
      </section>

      <div className="container-plug py-16">
        <ClubsDirectory clubs={clubs} />
      </div>
    </>
  )
}
