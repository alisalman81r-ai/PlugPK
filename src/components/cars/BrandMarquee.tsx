// src/components/cars/BrandMarquee.tsx
import * as React from 'react'

/**
 * The brands, running continuously beneath the hero.
 *
 * A strip like this is doing one job: establishing, in the second before
 * anybody reads a word, that this catalogue covers real manufacturers. It is
 * texture and credibility rather than navigation — the brand rail further down
 * is where a brand is actually chosen, and putting two brand controls on one
 * page would only make the reader wonder which one counts.
 *
 * Which is why it is aria-hidden. Every brand here is already announced by that
 * rail; a screen reader meeting fourteen manufacturers twice, once in a
 * duplicated loop, learns nothing and loses patience.
 *
 * Built in CSS rather than with the reference implementation's framer-motion
 * and react-use-measure. Same seamless result, and three advantages that matter
 * for something that animates forever near the top of a page: it runs entirely
 * on the compositor, it costs no JavaScript and no dependency, and it does not
 * re-render on resize because nothing is being measured.
 *
 * How the seam is hidden: the track holds the list twice and translates exactly
 * -50%, so at the end of the cycle the second copy sits precisely where the
 * first started and the jump back is invisible.
 */

export interface BrandMarqueeProps {
  brands: string[]
}

export function BrandMarquee({ brands }: BrandMarqueeProps) {
  // Below about eight the loop is visibly short — the same name comes back
  // around too quickly to read as a stream. Repeating the list evens that out.
  const sequence = brands.length < 8 ? [...brands, ...brands] : brands

  return (
    /*
      border-slate-200, where this was slate-100.

      This strip used to sit above the "At a glance" panel — white on white —
      and a slate-100 hairline was the right weight to separate two white
      bands. That panel is gone, so the strip now meets the catalogue's
      slate-100 ground directly, and a slate-100 border against a slate-100
      background is a border that does nothing. slate-200 gives the strip a
      defined bottom edge again, which is the job the removed panel's own
      border was doing for the section boundary.
    */
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-b border-slate-200 bg-white py-5"
    >
      {/*
        Masks at both edges, so names enter and leave rather than being sliced
        off by the container. A gradient of the page's own white rather than an
        opacity fade, which would show whatever sits behind it.
      */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-28" />

      {/*
        w-max keeps the track at its natural width so the two copies sit in one
        row; without it the flex container would shrink to the viewport and the
        -50% translation would no longer line up.

        Paused on hover, which is the one interaction a decorative strip owes
        the reader: something moving continuously is hard to read, and stopping
        it is cheaper than slowing it down.
      */}
      <div className="group flex w-max animate-marquee items-center gap-10 hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-14">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-10 sm:gap-14">
            {sequence.map((brand, index) => (
              <span
                key={`${copy}-${brand}-${index}`}
                className="whitespace-nowrap font-display text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 hover:text-plug-blue-700 sm:text-2xl"
              >
                {brand}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
