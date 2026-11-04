// src/components/dashboard/ClubRow.tsx
import Link from 'next/link'
import * as React from 'react'

import type { EVClub } from '@/lib/types'

import { IPin, IUsers } from './acct-icons'
import { ClubToggle } from './ClubToggle'

/** .aclubs li — an ink tile, the club and its city, a line about it, the button. */
export function ClubRow({ club, joined, meta }: { club: EVClub; joined: boolean; meta?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-3.5 rounded-[18px] border border-ink/10 bg-paper p-4 max-[640px]:grid-cols-[40px_minmax(0,1fr)]">
      <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-volt">
        <IUsers size={20} />
      </span>
      <div className="min-w-0">
        <Link
          href={`/community/clubs/${club.id}`}
          className="block font-display text-[19px] leading-[1.2] text-ink decoration-volt decoration-2 underline-offset-4 hover:underline"
        >
          {club.name}
        </Link>
        <span className="mt-1 inline-flex flex-wrap items-center gap-[5px] text-[13px] text-muted">
          <IPin size={14} />
          {club.city}
          <span aria-hidden="true">·</span>
          <span>
            <span className="font-mono font-semibold text-ink">{club.memberCount}</span> {club.memberCount === 1 ? 'member' : 'members'}
          </span>
          {meta}
        </span>
        {club.description ? <p className="mt-2 text-[13px] leading-[1.5] text-muted">{club.description}</p> : null}
      </div>
      <ClubToggle clubId={club.id} clubName={club.name} joined={joined} />
    </li>
  )
}
