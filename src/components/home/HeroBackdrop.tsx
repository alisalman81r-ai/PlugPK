// src/components/home/HeroBackdrop.tsx
'use client'

import Image from 'next/image'
import * as React from 'react'

/**
 * What sits behind the hero: a video when there is one, the photograph
 * otherwise.
 *
 * ── Dropping the video in ─────────────────────────────────────────────
 *
 * Put the file at public/video/hero.mp4 (and ideally public/video/hero.webm
 * beside it) and set HERO_VIDEO below to '/video/hero'. Nothing else changes.
 * Until that constant is set this renders exactly the photograph it always
 * did, so the page is never waiting on an asset that does not exist.
 *
 * What the footage wants to be, for this frame specifically:
 *
 *   Six to ten seconds, looping cleanly — the last frame should be able to cut
 *   to the first without a visible jump, because it will, every ten seconds,
 *   for as long as somebody is on the page.
 *
 *   No audio track at all. Not muted — absent. A muted track is still bytes
 *   downloaded on a phone connection to play nothing.
 *
 *   Shot or graded dark, and with its subject off-centre low. The headline and
 *   the search field sit across the bottom third and the scrim below is heavy
 *   there; anything important in that band will be lost under it.
 *
 *   1920x1080 is enough. This is a background at 25% opacity behind a scrim,
 *   and a 4K master is several megabytes spent on detail nobody can resolve.
 *
 * ── Why it degrades rather than insists ───────────────────────────────
 *
 * The poster is the existing photograph, so the first paint is identical
 * whether the video ever arrives: the frame is filled immediately, and the
 * video fades in over it once it can actually play. There is no black box and
 * no layout shift.
 *
 * A reader who has asked for reduced motion gets the photograph and no video
 * element at all — not a paused video, which still downloads. Same for anyone
 * whose browser refuses autoplay: onError and onStalled fall back rather than
 * leaving a dead frame.
 */

/**
 * Base path of the hero video, without extension — or null while there is no
 * footage. Set to '/video/hero' once the file exists.
 */
const HERO_VIDEO: string | null = null

/**
 * The photograph. Poster for the video, and the whole backdrop without one.
 *
 * Its own path under /images/hero rather than borrowing a station photograph,
 * so replacing the hero image is one file and no code: drop a JPEG at
 * public/images/hero/hero-porsche.jpg and it is live.
 *
 * What this frame wants, now that it is the right half of a split rather than a
 * full-width backdrop:
 *
 *   Keep the subject right of centre. The left third dissolves into the navy
 *   panel, so anything placed there disappears into it.
 *
 *   Landscape crops better than portrait. The panel is wider than it is tall,
 *   so a portrait source is scaled to the width and loses its top and bottom —
 *   about 13% each for the current image, which is why `objectPosition` exists
 *   below.
 *
 *   Bright works as well as dark. The type sits on the solid panel, not on the
 *   photograph, so this no longer has to be dark enough to read through — the
 *   constraint the old full-width backdrop was under.
 */
const POSTER = '/images/hero/hero-porsche.jpg'

export interface HeroBackdropProps {
  /**
   * What share of the viewport this fills, for next/image's srcset choice.
   *
   * It was hardcoded to 100vw, which was true while the backdrop spanned the
   * whole hero. It now fills the left panel of a split, so on a desktop it is
   * a little over half the width and 100vw would fetch a candidate roughly
   * twice the size actually rendered.
   */
  sizes?: string
  /**
   * CSS object-position for the photograph.
   *
   * Needed once the backdrop became a panel rather than a full-width band. The
   * current image is portrait and the panel is landscape, so `cover` scales to
   * the width and crops about 13% off the top and bottom — which with the
   * default centre took the top off the wall charger and the badge off the
   * nose. Biasing the crop upward keeps the charger, the cable and the run of
   * the bonnet, which is the part of the composition worth showing.
   */
  objectPosition?: string
  /**
   * next/image re-encode quality, 1-100. Defaults to Next's own 75.
   *
   * Worth raising for a hero that is being scaled up. The current photograph is
   * 736x981 and the panel asks for roughly 1526x1344 on a 2x display, so the
   * pixels are already stretched before Next re-encodes them — and a 75-quality
   * re-encode of an upscale puts compression artifacts on top of softness. It
   * cannot add detail that is not in the file; it can avoid removing more.
   */
  quality?: number
}

export function HeroBackdrop({
  sizes = '100vw',
  objectPosition = 'center',
  quality = 75,
}: HeroBackdropProps) {
  const [failed, setFailed] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const [allowVideo, setAllowVideo] = React.useState(false)

  React.useEffect(() => {
    // Read at mount rather than at render: the server has no media queries, and
    // deciding this during render would make the markup differ between the two.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /*
     * Save-Data and 2G are honoured where the browser reports them. A looping
     * background video is the most disposable thing on this page, and it is
     * also the largest — spending a metered connection on it to show what the
     * poster already shows is the wrong trade.
     */
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    const frugal =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g'

    setAllowVideo(!reduced && !frugal)
  }, [])

  const showVideo = HERO_VIDEO !== null && allowVideo && !failed

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      {/*
        The photograph is always rendered, never swapped out. It is the poster
        the video fades in over, so if the video stalls halfway there is still
        a filled frame underneath rather than a hole.
      */}
      <Image
        src={POSTER}
        alt=""
        fill
        priority
        sizes={sizes}
        quality={quality}
        style={{ objectPosition }}
        className="object-cover"
      />

      {showVideo ? (
        <video
          // Every one of these is load-bearing for autoplay: a video without
          // muted and playsInline is blocked on iOS and on Chrome for Android,
          // which is most of the traffic this page will see.
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          onStalled={() => setFailed(true)}
          style={{ objectPosition }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={`${HERO_VIDEO}.webm`} type="video/webm" />
          <source src={`${HERO_VIDEO}.mp4`} type="video/mp4" />
        </video>
      ) : null}
    </div>
  )
}
