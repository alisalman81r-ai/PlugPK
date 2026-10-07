// src/app/(main)/community/clubs/[id]/not-found.tsx
import Link from 'next/link'

import { Users } from '@/components/ui/icons'

/**
 * An unknown club id.
 *
 * Its own boundary, not the site-wide 404: /community has a loading screen,
 * so by the time the page learns the club does not exist the response is
 * already streaming. Without a not-found boundary inside that stream the
 * client crashed ("Rendered more hooks…") instead of showing a page.
 */
export default function ClubNotFound() {
  return (
    <div className="min-h-below-nav bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center">
        <Users size={28} className="mx-auto text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Club not found</h1>
        <p className="mt-2 text-ui-sm text-slate-500">This club does not exist, or it is no longer listed.</p>
        <Link
          href="/community/clubs"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-5 text-ui font-bold text-white transition-colors hover:bg-plug-cyan-500 hover:text-plug-blue-600"
        >
          See all clubs
        </Link>
      </div>
    </div>
  )
}
