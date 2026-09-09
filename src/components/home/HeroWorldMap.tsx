// src/components/home/HeroWorldMap.tsx

/**
 * The dotted world behind the hero.
 *
 * ── Why the landmasses are ranges rather than an SVG path ─────────────
 *
 * A dotted map is a grid sampled against a land mask, so the mask is the only
 * real content here. Written as coastline `<path>` data it would be several
 * kilobytes of coordinates nobody can read or correct; written as column ranges
 * per latitude row it is about forty lines, and moving a coastline is editing
 * two numbers.
 *
 * The grid is 5° — 72 columns of longitude by 36 rows of latitude, equirect-
 * angular. That is coarse enough to stay decorative and fine enough that the
 * continents are recognisable, which is the whole job.
 *
 * ── What is deliberately missing ──────────────────────────────────────
 *
 * Antarctica. At this projection it is a band across the entire bottom of the
 * frame, which reads as a rule under the map rather than as land, and it is the
 * one continent with no bearing on an EV charging network.
 *
 * ── Room for what comes next ──────────────────────────────────────────
 *
 * `route-layer` is empty and marked. The route line and the car that follows it
 * are the next step, and they want to sit above the dots and below the city
 * markers — so the group exists now, in the right place in the stacking order,
 * rather than being wedged in later.
 */

/**
 * Land, as inclusive column ranges per row.
 *
 * Row 0 is 87.5°N and row 35 is −87.5°S; column 0 is 180°W and column 71 is
 * 175°E. So `col = (lon + 180) / 5` and `row = (90 − lat) / 5`, which is also
 * how the city markers below are placed.
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

/** 5° per cell, 14 user units per cell. */
const STEP = 14
const COLS = 72
const ROWS = 36

/**
 * The rows the viewBox actually shows.
 *
 * Land runs from row 1 to row 28, so a full-height 36-row viewBox is a fifth of
 * empty space along the bottom and a row of it on top. Centred in the panel
 * that empty space reads as the map sitting too high rather than as margin, so
 * the frame is cropped to the content and the panel does the centring.
 */
const FIRST_ROW = 1
const LAST_ROW = 28
const VIEW_TOP = FIRST_ROW * STEP - STEP
const VIEW_HEIGHT = (LAST_ROW - FIRST_ROW + 3) * STEP

/** Pakistan, as the same row/column ranges — roughly 61-77°E, 24-37°N. */
const PAKISTAN: ReadonlyArray<readonly [number, number, number]> = [
  // [row, colStart, colEnd]
  [10, 48, 51],
  [11, 48, 51],
  [12, 48, 51],
  [13, 49, 51],
]

/** lon/lat -> user units, the same mapping the grid uses. */
function project(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon + 180) / 5) * STEP, y: ((90 - lat) / 5) * STEP }
}

/** The three cities the platform is actually live in. */
const CITIES = [
  { name: 'Karachi', lon: 67.0, lat: 24.9 },
  { name: 'Lahore', lon: 74.3, lat: 31.5 },
  { name: 'Islamabad', lon: 73.0, lat: 33.7 },
] as const

function isPakistan(row: number, col: number): boolean {
  return PAKISTAN.some(([r, from, to]) => r === row && col >= from && col <= to)
}

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
        // Ranges overlap where two landmasses meet in one row; without this the
        // shared columns draw twice and read as a denser seam.
        const key = row * COLS + col
        if (seen.has(key)) continue
        seen.add(key)

        dots.push({ cx: col * STEP, cy: row * STEP, pk: isPakistan(row, col) })
      }
    }
  }

  return dots
}

const DOTS = buildDots()

export interface HeroWorldMapProps {
  className?: string
}

export function HeroWorldMap({ className }: HeroWorldMapProps) {
  return (
    <svg
      viewBox={`0 ${VIEW_TOP} ${COLS * STEP} ${VIEW_HEIGHT}`}
      // Decorative. The heading already says the map is of Pakistan, so a
      // screen reader gains nothing from a description of the graphic and
      // loses the time spent reading it.
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* The halo under a city marker. Two stops rather than three: a soft
            edge is what makes it read as light rather than as a second ring. */}
        <radialGradient id="hero-map-halo">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── The land ─────────────────────────────────────────────────── */}
      <g>
        {DOTS.map((dot) => (
          <circle
            key={`${dot.cx}-${dot.cy}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.pk ? 3.2 : 2.6}
            className={dot.pk ? 'fill-plug-navy-700' : 'fill-slate-400'}
            opacity={dot.pk ? 0.95 : 0.75}
          />
        ))}
      </g>

      {/*
        ── Route layer, deliberately empty ─────────────────────────────
        The animated route and the car that follows it go here. Above the dots
        so the line is not lost in them, below the markers so a city is never
        covered by the route passing through it.
      */}
      <g id="route-layer" />

      {/* ── The three live cities ───────────────────────────────────── */}
      <g>
        {CITIES.map((city) => {
          const { x, y } = project(city.lon, city.lat)
          return (
            <g key={city.name}>
              <circle cx={x} cy={y} r={26} fill="url(#hero-map-halo)" />
              <circle cx={x} cy={y} r={5.5} className="fill-white" />
              <circle cx={x} cy={y} r={3.6} className="fill-plug-blue-500" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
