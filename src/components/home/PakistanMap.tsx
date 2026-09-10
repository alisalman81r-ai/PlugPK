// src/components/home/PakistanMap.tsx

/**
 * Pakistan, as a dotted silhouette, filling the right half of the hero.
 *
 * ── How the shape is made ─────────────────────────────────────────────
 *
 * One boundary polygon in lon/lat, projected once at module load into a fixed
 * SVG coordinate space, and used as a `clipPath` over a tiled dot `<pattern>`.
 * The dots are not individual elements: the whole country is a single <rect>
 * filled with the pattern and clipped to the outline.
 *
 * That matters for more than tidiness. Generating a dot per grid cell would be
 * roughly 1,400 <circle> nodes for this outline at this density — a DOM cost
 * paid on every render, and a diff nobody can read. The pattern is four nodes
 * total and the browser tiles it on the GPU, so density is one number here
 * rather than a loop, and the dots stay perfectly aligned at any scale.
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

/** Dot grid pitch and radius, in user units. */
const DOT_PITCH = 15
const DOT_R = 3.1

export interface PakistanMapProps {
  className?: string
}

export function PakistanMap({ className }: PakistanMapProps) {
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
          The dots. `patternUnits="userSpaceOnUse"` ties the grid to the map's
          coordinate space, not to the element's box — so the pitch is constant
          relative to the country at every screen size, and the pattern does
          not reflow when the container changes shape.
        */}
        <pattern
          id="pk-dots"
          x={0}
          y={0}
          width={DOT_PITCH}
          height={DOT_PITCH}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={DOT_PITCH / 2} cy={DOT_PITCH / 2} r={DOT_R} className="fill-slate-500" />
        </pattern>

        <clipPath id="pk-outline">
          <path d={PATH_D} />
        </clipPath>
      </defs>

      {/*
        ── The country ───────────────────────────────────────────────────
        One rect of dots, clipped to the outline. Dots that straddle the
        border are cut rather than dropped, which is what gives the edge its
        definition — dropping them leaves a soft, uncertain coastline.
      */}
      <g data-layer="map-visual">
        {/*
          A very faint solid fill under the dots. On its own the dot grid
          reads as texture; the wash is what makes the eye resolve it as one
          landmass, and at 0.05 it is well below the dots themselves so it
          never becomes a shape in its own right.
        */}
        <path d={PATH_D} className="fill-slate-400" opacity={0.08} />
        <rect
          x={BOUNDS.minX - MARGIN}
          y={BOUNDS.minY - MARGIN}
          width={BOUNDS.maxX - BOUNDS.minX + MARGIN * 2}
          height={BOUNDS.maxY - BOUNDS.minY + MARGIN * 2}
          fill="url(#pk-dots)"
          clipPath="url(#pk-outline)"
          opacity={0.62}
        />
      </g>

      {/*
        ── Empty, and placed on purpose ──────────────────────────────────
        The journey is the next step. These exist now so the stacking order is
        settled before anything is added to it: the route sits above the land,
        the car above the route it travels, and the markers above both so a
        city is never painted over by the road passing through it.

        Anything added here is positioned with `project(lon, lat)` — the same
        function that drew the outline — so a waypoint lands on the geography
        rather than on a guessed offset.
      */}
      <g data-layer="route" />
      <g data-layer="car" />
      <g data-layer="stations" />
      <g data-layer="destination" />
    </svg>
  )
}
