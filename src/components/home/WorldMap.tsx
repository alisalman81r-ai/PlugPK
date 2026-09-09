// src/components/home/WorldMap.tsx

/**
 * The dotted world behind the hero, and the frame the EV journey will animate
 * in.
 *
 * ── The layers, and why they are separate ─────────────────────────────
 *
 *   map visual        the dotted land
 *   route layer       the line the journey follows        (empty — step 4)
 *   car layer         the vehicle travelling it           (empty — step 4)
 *   station layer     charging stops along the way
 *   destination layer where the journey ends
 *
 * They are drawn in that order and each is its own <g>, so the route can never
 * paint over a station and the car is always above the road it is on. Getting
 * that order right now costs nothing; discovering it later means restructuring
 * a component that by then has animation attached to it.
 *
 * ── Everything is in one coordinate space ─────────────────────────────
 *
 * The grid, the stations, the destination and anything step 4 adds all go
 * through `project(lon, lat)`. Nothing is positioned by eye. A waypoint added
 * later lands in the right place because it is the same function that placed
 * the dots, and the viewBox is a fixed exported constant rather than something
 * derived from the element's size — so a route computed off-screen is correct
 * when it is rendered.
 *
 * ── Why the viewBox is a prop ─────────────────────────────────────────
 *
 * Measured: Karachi to Islamabad is 30 units across a 1008-unit map — 3% of the
 * width, about 21 real pixels at the size this renders. A car driving that is
 * not an animation, it is a twitch.
 *
 * So the journey cannot happen on the world view; the view has to come to the
 * journey. `viewBox` is a prop and `VIEW` exports both framings, which makes
 * the zoom a single animatable attribute rather than a transform on a group
 * that would take the stroke widths and dot radii with it.
 *
 * Step 4 interpolates VIEW.world -> VIEW.pakistan and runs the route inside the
 * second. This component stays still and knows nothing about scrolling.
 */

// ── Geometry ──────────────────────────────────────────────────────────

/** 5° per cell, 14 user units per cell. */
export const STEP = 14
export const COLS = 72
export const ROWS = 36

/** The full grid, in user units. */
export const MAP_WIDTH = COLS * STEP
export const MAP_HEIGHT = ROWS * STEP

/**
 * lon/lat to user units, equirectangular.
 *
 * The single source of position for everything in this file and everything
 * layered on top of it.
 */
export function project(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon + 180) / 5) * STEP, y: ((90 - lat) / 5) * STEP }
}

/**
 * The two framings.
 *
 * `world` is cropped to the rows that carry land — a full 36-row box leaves a
 * fifth of empty space along the bottom, which centred in a panel reads as the
 * map hanging too high rather than as margin.
 *
 * `pakistan` is the journey's bounding box with room around it. Step 4 animates
 * between the two; nothing else should need a third.
 */
export const VIEW = {
  world: `0 ${1 * STEP - STEP} ${MAP_WIDTH} ${30 * STEP}`,
  pakistan: '648 118 130 96',
} as const

// ── The land ──────────────────────────────────────────────────────────

/**
 * Land, as inclusive column ranges per latitude row.
 *
 * A dotted map is a grid sampled against a mask, so the mask is the only real
 * content here. As coastline path data it would be kilobytes nobody can read or
 * correct; as ranges it is thirty lines, and moving a coastline is editing two
 * numbers.
 *
 * Antarctica is absent on purpose. At this projection it is a band across the
 * entire bottom of the frame that reads as a rule under the map rather than as
 * land, and it has no bearing on a charging network.
 */
const LAND: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[16, 22], [27, 32]],
  2: [[12, 23], [24, 32], [38, 42], [54, 58]],
  3: [[4, 8], [10, 23], [25, 32], [48, 71]],
  4: [[3, 8], [8, 24], [26, 31], [37, 42], [42, 71]],
  5: [[3, 8], [8, 25], [26, 27], [37, 42], [42, 71]],
  6: [[4, 8], [9, 25], [34, 35], [37, 42], [42, 71]],
  7: [[10, 25], [34, 36], [36, 42], [42, 71]],
  8: [[11, 23], [35, 42], [42, 65]],
  9: [[11, 22], [34, 42], [42, 65]],
  10: [[11, 21], [34, 44], [44, 64]],
  11: [[12, 20], [34, 48], [48, 60]],
  12: [[13, 17], [16, 20], [33, 44], [44, 48], [48, 60]],
  13: [[14, 18], [32, 43], [43, 47], [49, 54], [55, 58]],
  14: [[15, 18], [32, 44], [44, 46], [50, 53], [55, 57], [60, 61]],
  15: [[18, 19], [21, 24], [32, 45], [51, 52], [55, 57], [60, 61]],
  16: [[20, 24], [33, 45], [56, 57], [60, 61]],
  17: [[20, 26], [36, 45], [55, 63]],
  18: [[21, 28], [38, 44], [56, 64]],
  19: [[21, 29], [38, 44], [57, 64]],
  20: [[21, 29], [38, 44], [60, 64]],
  21: [[22, 28], [38, 43], [44, 45], [59, 65]],
  22: [[22, 28], [38, 43], [44, 45], [58, 66]],
  23: [[22, 26], [39, 42], [58, 66]],
  24: [[21, 25], [39, 42], [59, 66]],
  25: [[21, 24], [63, 66], [70, 71]],
  26: [[21, 23], [70, 71]],
  27: [[21, 22]],
  28: [[21, 22]],
}

/** Pakistan's cells, for the accent. Roughly 61-77°E, 24-37°N. */
const PAKISTAN: ReadonlyArray<readonly [number, number, number]> = [
  [10, 48, 51],
  [11, 48, 51],
  [12, 48, 51],
  [13, 49, 51],
]

interface Dot {
  cx: number
  cy: number
  pk: boolean
}

function buildDots(): Dot[] {
  const dots: Dot[] = []
  const seen = new Set<number>()

  for (let row = 0; row < ROWS; row += 1) {
    const ranges = LAND[row]
    if (!ranges) continue

    for (const [from, to] of ranges) {
      for (let col = from; col <= to && col < COLS; col += 1) {
        // Ranges overlap where two landmasses meet in a row; without this the
        // shared columns draw twice and read as a denser seam.
        const key = row * COLS + col
        if (seen.has(key)) continue
        seen.add(key)

        const pk = PAKISTAN.some(([r, f, t]) => r === row && col >= f && col <= t)
        dots.push({ cx: col * STEP, cy: row * STEP, pk })
      }
    }
  }

  return dots
}

const DOTS = buildDots()

// ── The journey ───────────────────────────────────────────────────────

export interface Waypoint {
  readonly name: string
  readonly lon: number
  readonly lat: number
}

/**
 * Where the EV journey runs.
 *
 * Only cities the platform is actually live in. The obvious route would add
 * Hyderabad, Sukkur and Multan, which are the real stops on that corridor and
 * where nothing is listed — drawing charging stations in three cities with no
 * coverage would be a claim the database does not support, on the first screen
 * of the site.
 *
 * Karachi and Lahore are stations, Islamabad is the destination. Step 4 draws
 * the route through them in this order.
 */
export const JOURNEY = {
  stations: [
    { name: 'Karachi', lon: 67.01, lat: 24.86 },
    { name: 'Lahore', lon: 74.33, lat: 31.55 },
  ],
  destination: { name: 'Islamabad', lon: 73.05, lat: 33.68 },
} as const satisfies { stations: readonly Waypoint[]; destination: Waypoint }

// ── Layers ────────────────────────────────────────────────────────────

/** The dotted land. Very light grey, with Pakistan picked out in brand navy. */
function MapVisual() {
  return (
    <g data-layer="map-visual">
      {DOTS.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.pk ? 3.2 : 2.6}
          className={dot.pk ? 'fill-plug-navy-700' : 'fill-slate-300'}
          opacity={dot.pk ? 0.95 : 0.85}
        />
      ))}
    </g>
  )
}

/** A charging stop: halo, white disc, brand core. */
function StationMarker({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={26} fill="url(#worldmap-halo)" />
      <circle cx={x} cy={y} r={5.5} className="fill-white" />
      <circle cx={x} cy={y} r={3.6} className="fill-plug-blue-500" />
    </>
  )
}

export interface WorldMapProps {
  className?: string
  /**
   * Which framing to draw. Defaults to the world.
   *
   * Animating this attribute is how step 4 moves from the world to the journey
   * — see the note at the head of the file for why it is not a transform.
   */
  viewBox?: string
}

export function WorldMap({ className, viewBox = VIEW.world }: WorldMapProps) {
  const destination = project(JOURNEY.destination.lon, JOURNEY.destination.lat)

  return (
    <svg
      viewBox={viewBox}
      // Fixed, so a route computed against MAP_WIDTH/MAP_HEIGHT lands where it
      // was calculated to whatever size the panel happens to be.
      preserveAspectRatio="xMidYMid meet"
      // Decorative. The heading already says the map is of Pakistan; a screen
      // reader gains nothing from a description of the graphic.
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Two stops, not three: a soft edge reads as light, a hard one reads
            as a second ring. */}
        <radialGradient id="worldmap-halo">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <MapVisual />

      {/*
        Empty until step 4. Placed here rather than added later so the stacking
        order is already right: the route sits above the land and below the
        stations, and the car sits above the route it travels.
      */}
      <g data-layer="route" id="route-layer" />
      <g data-layer="car" id="car-layer" />

      <g data-layer="stations">
        {JOURNEY.stations.map((station) => {
          const { x, y } = project(station.lon, station.lat)
          return <StationMarker key={station.name} x={x} y={y} />
        })}
      </g>

      <g data-layer="destination">
        {/* A ring rather than a fourth dot, so the end of the journey is
            distinguishable from the stops along it at a glance. */}
        <circle cx={destination.x} cy={destination.y} r={26} fill="url(#worldmap-halo)" />
        <circle
          cx={destination.x}
          cy={destination.y}
          r={7.5}
          className="fill-white stroke-plug-navy-700"
          strokeWidth={2.5}
        />
        <circle cx={destination.x} cy={destination.y} r={3} className="fill-plug-navy-700" />
      </g>
    </svg>
  )
}
