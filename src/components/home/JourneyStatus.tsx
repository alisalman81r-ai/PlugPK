// src/components/home/JourneyStatus.tsx
'use client'

/**
 * The journey's running commentary: "Charging…", then "Charged", then arrival.
 *
 * ── HTML, not SVG text ────────────────────────────────────────────────
 *
 * Text inside the map's SVG is drawn in user units, so it scales with the
 * viewBox and lands at whatever size the panel happens to give it — around
 * 11px at the hero's framing, and blurry, because SVG text is not hinted the
 * way the rest of the page's type is. As HTML it uses the same Poppins, the
 * same pill styling as the badge above the headline, and stays crisp.
 *
 * It also cannot collide with the markers. Lahore and Islamabad are seven user
 * units apart; a label anchored to either would sit on top of the other.
 *
 * ── Three elements, not one that changes text ─────────────────────────
 *
 * A scrubbed timeline runs backwards as readily as forwards, and swapping
 * textContent on a single node is not a tween — reversing would need the swap
 * inverted by hand at exactly the right progress, and any missed frame leaves
 * the wrong words on screen. Three nodes cross-fading are symmetric: GSAP
 * reverses opacity for free and the states cannot desynchronise.
 */

const PILL =
  'pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex w-fit items-center gap-2 ' +
  'whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 ' +
  'text-ui-sm font-semibold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.08)]'

export function JourneyStatus() {
  return (
    // aria-hidden: this narrates a decorative graphic. The heading and the
    // search field already say what the page offers, and a screen reader
    // reading "Charging…" as somebody scrolls past is noise, not information.
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-6 h-10">
      <div id="journey-status-charging" className={PILL} style={{ opacity: 0 }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-plug-blue-500" aria-hidden="true">
          <path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z" />
        </svg>
        Charging…
      </div>

      <div id="journey-status-charged" className={PILL} style={{ opacity: 0 }}>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 stroke-plug-blue-500"
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5 L10 17.5 L19 7" />
        </svg>
        Charged
      </div>

      <div id="journey-status-done" className={PILL} style={{ opacity: 0 }}>
        {/* Drawn rather than an emoji: emoji render differently on every
            platform and one of them would not match the rest of this. */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="10" className="fill-plug-blue-500" />
          <circle cx="8.6" cy="9.8" r="1.4" className="fill-white" />
          <circle cx="15.4" cy="9.8" r="1.4" className="fill-white" />
          <path
            d="M7.6 14 A 5 5 0 0 0 16.4 14"
            fill="none"
            className="stroke-white"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </svg>
        Charged and ready to go.
      </div>
    </div>
  )
}
