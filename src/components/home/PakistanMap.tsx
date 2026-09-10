// src/components/home/PakistanMap.tsx

/**
 * Pakistan, as an open silhouette, filling the right half of the hero.
 *
 * ── How the shape is made ─────────────────────────────────────────────
 *
 * One boundary polygon in lon/lat, projected once at module load into a fixed
 * SVG coordinate space, and drawn three times: a lifted surface, a coast, and
 * a faint inner highlight.
 *
 * It was a dot pattern clipped to that outline. The dots are gone — the shape
 * now carries itself, and nothing in this file is a rectangle. There is no
 * container, no frame and no panel: the hero's own background runs up to the
 * coast and stops.
 *
 * ── Where the geometry came from ──────────────────────────────────────
 *
 * Hand-authored from published coordinates, not extracted from a dataset. It
 * is a decorative silhouette at roughly 40km of detail, so tracing Natural
 * Earth or GADM would add an attribution obligation and a build step to buy
 * accuracy the eye cannot resolve at this size.
 *
 * Being hand-authored, it carries no third-party licence at all — which is the
 * same reason the hero photograph was removed. The trade is that it is a
 * simplification: recognisable and correctly proportioned, but not a survey.
 * It should never be used to answer a question about where a border runs.
 *
 * ── The projection ────────────────────────────────────────────────────
 *
 * Equirectangular with the standard parallel at Pakistan's mid-latitude. The
 * cos(30.35°) factor on longitude is what keeps the country from looking
 * stretched: a degree of longitude here covers about 86% of the ground a
 * degree of latitude does, and plotting lon/lat raw would widen Pakistan by
 * that much.
 *
 * `project()` is exported and is the only way anything should be positioned on
 * this map. The next step places Faisalabad and Islamabad through it, so the
 * route lands on the same geometry the silhouette was drawn from rather than
 * on guessed pixels.
 */

/** Standard parallel — Pakistan's mid-latitude. */
const LAT0 = 30.35
const COS_LAT0 = Math.cos((LAT0 * Math.PI) / 180)

/** User units per degree of latitude. Sets the whole map's scale. */
const UNITS_PER_DEG = 60

/**
 * The boundary, clockwise from the northern tip.
 *
 * Reads north tip -> Kashmir -> the Indian border south through Punjab and
 * Sindh -> Sir Creek -> the Arabian Sea coast west -> the Iranian border north
 * -> the Afghan border along Balochistan and KP -> back to the north.
 */
const BOUNDARY: ReadonlyArray<readonly [number, number]> = [
  // North: Gilgit-Baltistan to the Siachen spur. Narrow on purpose — the
  // first pass carried 77.8E at 35.5N straight out from 76.4E, which put a
  // wide rectangular blob where the north-east should taper.
  [74.5, 37.05], [75.1, 36.78], [75.6, 36.35], [75.95, 36.05], [76.5, 35.86],
  [76.85, 35.62], [77.12, 35.44], [76.72, 35.06], [76.1, 34.74],
  // Kashmir, down the eastern side.
  [75.3, 34.62], [74.6, 34.52], [74.1, 34.28], [73.98, 33.9], [73.9, 33.22],
  [74.35, 32.86], [75.02, 32.5], [74.62, 32.02], [74.52, 31.72],
  // Punjab, then the Indian border across the Cholistan desert.
  [74.0, 31.0], [73.42, 30.22], [73.0, 29.9], [72.4, 29.2], [71.9, 28.5],
  [71.0, 28.0], [70.6, 27.7], [70.1, 27.0], [69.6, 26.4], [70.0, 25.7],
  [70.62, 25.2], [70.9, 24.5], [71.05, 24.22],
  // The Rann of Kutch, round to Sir Creek — the southernmost point.
  [70.6, 24.22], [69.5, 24.3], [68.8, 23.9], [68.2, 23.72],
  // The coast west. Not a straight line: the Makran shore bays in and out,
  // and drawn flat it read as a ruled edge rather than a coastline.
  [67.5, 23.92], [67.0, 24.2], [66.6, 24.82], [66.0, 25.25], [65.2, 25.12],
  [64.6, 25.32], [64.0, 25.18], [63.4, 25.1], [62.6, 25.12], [62.05, 25.0],
  [61.6, 25.1],
  // North along the Iranian border, then east into Balochistan.
  [61.6, 25.82], [61.9, 26.5], [62.0, 27.2], [62.8, 27.32], [63.3, 27.22],
  [63.6, 27.02], [64.1, 27.02], [64.5, 27.5], [65.0, 28.0], [65.5, 28.8],
  [66.3, 29.9], [66.4, 30.7], [66.8, 31.0], [67.0, 31.32],
  // The Afghan border north through Zhob and Waziristan.
  [67.8, 31.6], [68.5, 31.8], [69.3, 31.8], [69.5, 32.2], [69.3, 32.5],
  [69.5, 33.0], [70.0, 33.2], [70.2, 33.6], [69.9, 34.0], [70.3, 34.2],
  [71.1, 34.1], [71.1, 34.6], [71.5, 35.1], [71.6, 35.5], [71.2, 36.0],
  // Chitral up to the Wakhan, and back to the northern tip.
  [71.6, 36.5], [72.6, 36.82], [73.5, 36.92],
]

/** lon/lat to user units. The single source of position on this map. */
export function project(lon: number, lat: number): { x: number; y: number } {
  return {
    x: (lon - 60.85) * COS_LAT0 * UNITS_PER_DEG,
    y: (37.15 - lat) * UNITS_PER_DEG,
  }
}

const PROJECTED = BOUNDARY.map(([lon, lat]) => project(lon, lat))

/** The outline, closed. */
const PATH_D =
  PROJECTED.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
  ' Z'

/**
 * The frame, derived from the geometry rather than written down.
 *
 * A margin in user units so the silhouette never touches the edge — the
 * component is sized by its container and this is the only breathing room
 * inside the graphic itself.
 */
const MARGIN = 26
const BOUNDS = PROJECTED.reduce(
  (acc, p) => ({
    minX: Math.min(acc.minX, p.x),
    maxX: Math.max(acc.maxX, p.x),
    minY: Math.min(acc.minY, p.y),
    maxY: Math.max(acc.maxY, p.y),
  }),
  { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
)

export const VIEW_BOX = [
  (BOUNDS.minX - MARGIN).toFixed(1),
  (BOUNDS.minY - MARGIN).toFixed(1),
  (BOUNDS.maxX - BOUNDS.minX + MARGIN * 2).toFixed(1),
  (BOUNDS.maxY - BOUNDS.minY + MARGIN * 2).toFixed(1),
].join(' ')

export interface PakistanMapProps {
  className?: string
  /**
   * The journey, drawn on top of the land.
   *
   * A slot rather than an import, so this file stays the geography and knows
   * nothing about routes or cars. journey.ts imports `project` from here; if
   * this component imported the journey back, the two would form a cycle.
   */
  children?: React.ReactNode
}

export function PakistanMap({ className, children }: PakistanMapProps) {
  return (
    <svg
      viewBox={VIEW_BOX}
      // meet, so the whole country is always visible: it letterboxes inside a
      // container of a different shape rather than cropping Balochistan or the
      // northern areas off to fill it.
      preserveAspectRatio="xMidYMid meet"
      // Decorative. The heading already says the map is of Pakistan.
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/*
          The land's surface. A near-white top falling to a pale cool blue,
          which is what makes the shape read as lifted off the band rather
          than painted onto it. Both stops stay close to the hero's own
          #EEF2F8, so it is a change of level, not a change of colour.
        */}
        <linearGradient id="pk-surface" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="55%" stopColor="#F7FAFE" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#E4EBF6" stopOpacity="0.94" />
        </linearGradient>

        {/*
          The shadow that does the lifting. Wide and very soft — a tight
          shadow would read as a sticker, which is the one thing the brief
          rules out by name.
        */}
        <filter id="pk-lift" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#1E3A8A" floodOpacity="0.10" />
        </filter>
      </defs>

      {/*
        ── The country ───────────────────────────────────────────────────
        Three passes of the SAME path: a lifted surface, a blue-grey coast,
        and a faint brand-blue inner edge that catches the light along the
        top-left. Nothing is clipped and nothing is tiled, so there is no
        rectangle anywhere in this group — the only geometry present is the
        silhouette itself, and the hero background runs straight up to it.
      */}
      <g data-layer="map-visual">
        <path d={PATH_D} fill="url(#pk-surface)" filter="url(#pk-lift)" />
        {/*
          The coast, in the headline's own accent — plug-navy-700, the colour
          of "on one map." Held at 0.7 rather than solid: at full strength a
          2.6-unit navy line at this scale outweighs the blue route, and the
          route has to stay the strongest thing on the panel.
        */}
        <path
          d={PATH_D}
          fill="none"
          className="stroke-plug-navy-700"
          strokeWidth={2.6}
          strokeLinejoin="round"
          opacity={0.7}
        />
        {/*
          A hairline of the same navy over the top, so the edge reads as
          drawn rather than as a soft wash. One colour for the whole coast
          now — the previous pass put a lighter blue highlight over a grey
          line, and two hues on one edge muddied it.
        */}
        <path
          d={PATH_D}
          fill="none"
          className="stroke-plug-navy-700"
          strokeWidth={1}
          strokeLinejoin="round"
          opacity={0.45}
        />
      </g>

      {/*
        The journey, above the land. Its own layers and stacking order live in
        JourneyLayers; this is only where they sit relative to the geography.
      */}
      {children}
    </svg>
  )
}
