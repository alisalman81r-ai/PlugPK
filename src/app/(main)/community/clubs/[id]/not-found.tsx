// src/app/(main)/community/clubs/[id]/not-found.tsx
import { Users } from '@/components/ui/icons'
import { Btn, BtnArrow } from '@/components/v2/ui'

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
    <div data-theme="light" className="bg-chalk px-4 py-[clamp(72px,9vw,120px)]">
      <div className="mx-auto grid max-w-md justify-items-center rounded-[28px] border border-ink/10 bg-white p-8 text-center shadow-e1">
        <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
          <Users size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-[32px] leading-[1.1] text-ink">Club not found</h1>
        <p className="mt-2 text-[15px] text-muted">This club does not exist, or it is no longer listed.</p>
        <Btn href="/community/clubs" className="mt-6">
          See all clubs
          <BtnArrow />
        </Btn>
      </div>
    </div>
  )
}
