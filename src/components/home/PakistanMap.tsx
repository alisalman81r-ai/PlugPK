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
 * Natural Earth 1:50m cultural vectors, the `Pakistan` admin-0 polygon,
 * simplified at build-authoring time and pasted in as literal coordinates —
 * there is no dataset in the bundle and no fetch at runtime.
 *
 * Natural Earth is in the public domain: no permission needed, no attribution
 * required. The note here is a courtesy and a record of where to go to redraw
 * it, not a licence obligation.
 *
 * This replaced a hand-drawn ~90-point sketch at roughly 40km of detail, which
 * was recognisable but visibly wrong along the Makran coast and the Afghan
 * border. It is still a simplification and should never be used to answer a
 * question about where a border actually runs.
 * * ── The projection ────────────────────────────────────────────────────
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
 * The boundary, clockwise on screen from the northern tip.
 *
 * Natural Earth 1:50m admin-0, simplified to 230 points (Douglas-Peucker at
 * 0.0275 degrees, about 3km) with longitude scaled by cos(30.35) first so the
 * tolerance means the same distance on the ground in both axes. The ring is
 * rotated to begin at its northernmost vertex and wound clockwise in screen
 * space.
 *
 * It reads north tip -> Gilgit-Baltistan and Kashmir -> the Indian border
 * south through Punjab and Sindh -> Sir Creek -> the Makran coast west -> the
 * Iranian border north -> the Afghan border along Balochistan and KP -> back
 * to the north.
 */
const BOUNDARY: ReadonlyArray<readonly [number, number]> = [
  [74.541, 37.022], [74.039, 36.826], [73.769, 36.888], [73.117, 36.869], [72.623, 36.830],
  [72.250, 36.735], [71.773, 36.432], [71.621, 36.436], [71.233, 36.122], [71.185, 36.042],
  [71.398, 35.880], [71.572, 35.547], [71.601, 35.408], [71.546, 35.289], [71.621, 35.183],
  [71.455, 34.967], [71.294, 34.868], [70.966, 34.530], [71.096, 34.369], [71.052, 34.050],
  [70.654, 33.952], [70.326, 33.961], [69.995, 34.052], [69.890, 34.007], [69.868, 33.898],
  [70.134, 33.621], [70.284, 33.369], [70.261, 33.289], [69.920, 33.112], [69.704, 33.095],
  [69.502, 33.020], [69.405, 32.683], [69.241, 32.434], [69.279, 31.937], [69.083, 31.738],
  [68.869, 31.634], [68.782, 31.646], [68.598, 31.803], [68.443, 31.754], [68.161, 31.803],
  [68.017, 31.678], [67.578, 31.506], [67.738, 31.344], [67.453, 31.235], [67.287, 31.218],
  [66.924, 31.306], [66.829, 31.264], [66.596, 31.020], [66.397, 30.912], [66.347, 30.803],
  [66.287, 30.608], [66.305, 30.321], [66.238, 30.110], [66.313, 29.969], [66.177, 29.836],
  [65.096, 29.559], [64.394, 29.544], [64.099, 29.392], [63.568, 29.498], [62.477, 29.408],
  [60.843, 29.859], [61.318, 29.373], [61.338, 29.265], [61.623, 28.792], [61.890, 28.547],
  [62.353, 28.415], [62.565, 28.235], [62.758, 28.244], [62.740, 28.002], [62.812, 27.497],
  [62.763, 27.250], [62.915, 27.218], [63.167, 27.252], [63.302, 27.151], [63.242, 27.078],
  [63.250, 26.879], [63.186, 26.838], [63.158, 26.650], [62.787, 26.644], [62.439, 26.561],
  [62.312, 26.491], [62.239, 26.357], [62.126, 26.369], [62.089, 26.318], [61.842, 26.226],
  [61.754, 25.843], [61.662, 25.751], [61.567, 25.186], [61.908, 25.131], [62.089, 25.155],
  [62.199, 25.225], [62.315, 25.135], [62.665, 25.265], [63.491, 25.211], [63.496, 25.298],
  [63.557, 25.353], [63.721, 25.386], [63.936, 25.343], [64.059, 25.403], [64.152, 25.333],
  [64.659, 25.184], [64.777, 25.307], [65.406, 25.374], [65.680, 25.355], [66.235, 25.464],
  [66.468, 25.445], [66.356, 25.507], [66.131, 25.493], [66.219, 25.590], [66.324, 25.602],
  [66.534, 25.484], [66.699, 25.226], [66.703, 24.861], [67.171, 24.756], [67.309, 24.175],
  [67.504, 23.940], [67.563, 23.882], [67.646, 23.920], [67.668, 23.811], [67.819, 23.828],
  [67.860, 23.903], [67.951, 23.829], [68.037, 23.848], [68.116, 23.753], [68.165, 23.857],
  [68.283, 23.928], [68.724, 23.965], [68.728, 24.266], [68.781, 24.314], [68.828, 24.264],
  [69.559, 24.273], [69.716, 24.173], [69.805, 24.165], [70.021, 24.192], [70.098, 24.288],
  [70.489, 24.412], [70.547, 24.418], [70.579, 24.279], [70.716, 24.238], [71.044, 24.400],
  [70.970, 24.572], [71.048, 24.688], [70.652, 25.423], [70.648, 25.667], [70.570, 25.706],
  [70.265, 25.707], [70.100, 25.910], [70.078, 26.072], [70.148, 26.506], [70.059, 26.579],
  [69.736, 26.627], [69.507, 26.743], [69.470, 26.804], [69.537, 27.123], [69.896, 27.474],
  [70.145, 27.849], [70.404, 28.025], [70.489, 28.023], [70.629, 27.937], [70.692, 27.769],
  [70.798, 27.710], [71.185, 27.832], [71.543, 27.870], [71.870, 27.962], [71.948, 28.177],
  [72.129, 28.346], [72.342, 28.752], [72.903, 29.029], [73.231, 29.551], [73.382, 29.934],
  [73.809, 30.093], [73.933, 30.222], [73.899, 30.435], [74.339, 30.894], [74.633, 31.035],
  [74.518, 31.186], [74.594, 31.465], [74.510, 31.713], [74.556, 31.819], [74.739, 31.949],
  [75.254, 32.140], [75.333, 32.279], [75.234, 32.372], [74.987, 32.462], [74.686, 32.494],
  [74.643, 32.608], [74.663, 32.758], [74.355, 32.769], [74.305, 32.810], [74.304, 32.992],
  [74.004, 33.189], [74.150, 33.507], [74.004, 33.632], [73.976, 33.721], [74.001, 33.788],
  [74.216, 33.887], [74.251, 33.946], [74.246, 33.990], [73.950, 34.019], [73.904, 34.076],
  [73.972, 34.237], [73.810, 34.325], [73.795, 34.378], [73.961, 34.653], [74.300, 34.765],
  [75.188, 34.639], [75.453, 34.537], [75.709, 34.503], [76.041, 34.670], [76.172, 34.668],
  [76.457, 34.756], [76.594, 34.736], [76.783, 34.900], [77.001, 34.992], [77.049, 35.110],
  [76.767, 35.662], [76.563, 35.773], [76.551, 35.887], [76.178, 35.811], [76.071, 35.983],
  [75.912, 36.049], [75.969, 36.169], [75.974, 36.382], [75.840, 36.650], [75.667, 36.742],
  [75.424, 36.738], [75.347, 36.913], [75.054, 36.987], [74.889, 36.952], [74.601, 37.037],
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

/*
  ── On the internal contour texture that is not here ──────────────────

  The brief allows an abstract topographic texture, and one was built and
  looked at: the boundary polygon scaled toward a point in the northern
  interior, five rings, clipped to the coast, at 0.05 opacity.

  It was removed after seeing it rendered. The boundary is a polygon with hard
  vertices, so every scaled copy keeps those angles, and what appears on the
  surface is a smaller Pakistan drawn inside Pakistan — the nested outline
  reads as a stray artefact rather than as terrain. Softening it further only
  made a faint artefact rather than an invisible one.

  The premium here comes from the light and the depth instead: a two-part
  shadow, a sheen across the face, and a lit lip just inside the coast. The
  brief asked for only the detailing that genuinely improves the map, and this
  particular one did not.
*/

/**
 * The extruded side wall, as offset copies of the same outline.
 *
 * ── Why a stack and not one translated copy ───────────────────────────
 *
 * A single silhouette shifted down and drawn behind the top face only shows
 * a wall where the shape happens to be convex. Pakistan is not: the Wakhan
 * notch, the Kutch inlet and the bays along the Makran coast are all
 * concave, and there the offset copy hides BEHIND the top face and the wall
 * vanishes. Stacking short steps builds the wall out of many thin slices, so
 * every edge gets one regardless of which way it faces.
 *
 * 24 steps at 1.35 down and 0.4 across is about 32 units of depth — roughly
 * 24px at the hero's scale. 16 steps at 1.15 was tried first and read as a
 * drop shadow rather than a slab. They are static paths: no animation touches
 * them, so the cost is paid once at render.
 *
 * The lean is down and slightly right because the surface gradient is already
 * lit from the top-left; the wall has to fall away from the same light or the
 * slab reads as two objects.
 */
const DEPTH_STEPS = 24
const DEPTH_DX = 0.4
const DEPTH_DY = 1.35

/**
 * Darkest in the crease where the wall meets the top face, lightening toward
 * its outer edge.
 *
 * This was the other way round, and it was why the silhouette read as a smear
 * rather than as a solid with a side to it. Sampled across the south-east
 * coast, the wall ran 194 at the face down to 143 at its outer edge and then
 * cut straight to the 238 background — a 95-level cliff with nothing between,
 * so the darkest part of the map was its outermost pixel. A wall lit from the
 * top-left does the opposite: the crease under the lid is occluded and the
 * outer edge catches bounce light, which also lands the wall much nearer the
 * background where it ends.
 */
function wallColour(i: number): string {
  const t = i / (DEPTH_STEPS - 1)
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${mix(203, 146)} ${mix(216, 165)} ${mix(233, 193)})`
}

export interface PakistanMapProps {
  className?: string
  /**
   * The network and the roads, drawn on top of the land.
   *
   * A slot rather than an import, so this file stays the geography and knows
   * nothing about roads or stations. highway.ts and MapStations import
   * `project` from here; if this component imported them back, it would be a
   * cycle.
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
          The land's surface: a pale cool blue, lightest at the top-left where
          the light comes from.

          It used to open on white and stay within a few levels of the band's
          own #EEF2F8, because the band was that colour and the shape only had
          to read as a change of LEVEL. The band is white now, so a near-white
          land on a white page is a silhouette with nothing in it. The stops
          carry the blue instead — it is the one place on the page still
          holding colour, which is the point.
        */}
        <linearGradient id="pk-surface" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FBFDFF" />
          <stop offset="38%" stopColor="#EDF4FC" />
          <stop offset="72%" stopColor="#DCE8F7" />
          <stop offset="100%" stopColor="#C6D9F0" />
        </linearGradient>

        {/*
          The shadow side.

          The gradient above runs corner to corner, which tilts the surface but
          does not model it — a plane lit from one end still reads as a plane.
          This is the falloff a solid gets away from its light: deepest in the
          south-east, gone by the time it reaches the lit north-west, and shaped
          by distance rather than by the outline.

          Navy rather than grey, and never past 0.14. The land is the one place
          on the page still holding colour, and a neutral shadow would grey it
          out at exactly the point the eye reads as depth.
        */}
        <radialGradient id="pk-shade" cx="0.74" cy="0.86" r="0.95">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.14" />
          <stop offset="45%" stopColor="#1E3A8A" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
        </radialGradient>

        {/*
          The shadow that does the lifting.

          Two of them now, which is what a real object casts: a tight contact
          shadow that says where the slab meets the ground, and the wide
          ambient one that gives it height. A single soft shadow floats —
          there is nothing anchoring the bottom edge — and a single tight one
          reads as a sticker, which the brief rules out by name. Both are kept
          under a tenth opacity so the effect is depth rather than darkness.
        */}
        <filter id="pk-lift" x="-14%" y="-14%" width="128%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#1E3A8A" floodOpacity="0.09" />
          <feDropShadow dx="0" dy="14" stdDeviation="20" floodColor="#1E3A8A" floodOpacity="0.09" />
        </filter>

        {/*
          A soft light across the surface, from the same top-left the wall
          already falls away from. Painted as the silhouette filled with a
          radial gradient rather than as a rectangle over it, so there is still
          no box anywhere in this file.
        */}
        <radialGradient id="pk-sheen" cx="0.3" cy="0.2" r="0.85">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#C7D6EC" stopOpacity="0.16" />
        </radialGradient>

        {/*
          ── The land has a surface now, not just a colour ────────────────

          The note further up records a texture that was built and thrown away:
          the boundary polygon scaled inward, which kept the outline's hard
          vertices and read as a smaller Pakistan drawn inside Pakistan. The
          fault was in the source, not the idea — anything derived from that
          polygon inherits its shape.

          This is generated instead. feTurbulence owes nothing to the boundary,
          so there is no second outline to find: it is a field of noise, and
          feDiffuseLighting reads that field as height and lights it. What lands
          on the surface is relief — faint high ground and faint hollows — not a
          drawing of anything.

          Lit from azimuth 315, which is the top-left the wall already falls away
          from and the sheen already opens at. Three light sources disagreeing
          about where the sun is would undo the solidity the wall was built to
          create.

          baseFrequency is deliberately low. Higher values give a fine sand
          grain that looks like noise on a screen; this size reads as terrain at
          the scale a country is drawn.
        */}
        <filter id="pk-relief" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves={5} seed={11} result="field" />
          <feDiffuseLighting in="field" lightingColor="#FFFFFF" surfaceScale={3.6} diffuseConstant={1} result="relief">
            <feDistantLight azimuth={315} elevation={58} />
          </feDiffuseLighting>
        </filter>
        {/* Keeps the contour texture and the lit lip inside the coastline. */}
        <clipPath id="pk-clip">
          <path d={PATH_D} />
        </clipPath>

        {/*
          Softens the inner shade below into a gradient rather than a band.

          A wide stroke clipped to the landmass gives a hard-edged ring; blurred,
          the same stroke becomes light falling away from the rim, which is what
          the eye reads as a surface sitting inside a raised edge.
        */}
        <filter id="pk-inner-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
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
        {/*
          The side wall. Drawn first so the top face lands on it and hides
          all but the offset sliver along each edge. The drop shadow moves
          here — it belongs to the bottom of the slab, not to its lid.
        */}
        <g filter="url(#pk-lift)">
          {Array.from({ length: DEPTH_STEPS }, (_, i) => {
            const step = DEPTH_STEPS - i
            return (
              <path
                key={i}
                d={PATH_D}
                fill={wallColour(i)}
                transform={`translate(${(DEPTH_DX * step).toFixed(2)} ${(DEPTH_DY * step).toFixed(2)})`}
              />
            )
          })}
        </g>

        <path d={PATH_D} fill="url(#pk-surface)" />

        {/* The shadow side, over the fill and under everything else. */}
        <path d={PATH_D} fill="url(#pk-shade)" />

        {/*
          The relief, laid over the fill and inside the coast.

          Clipped rather than painted to shape: a lighting filter fills its whole
          region, and that region is a rectangle. The clip is what keeps this
          file's rule that no rectangle is ever visible in it.

          soft-light at a fifth strength. The blend modulates the gradient
          underneath rather than covering it, so the pale blue still runs
          top-left to bottom-right and the relief only decides where that blue
          is a shade lighter or deeper. At full strength it stops being a
          surface and becomes a texture sample.
        */}
        <g clipPath="url(#pk-clip)">
          <path
            d={PATH_D}
            filter="url(#pk-relief)"
            opacity={0.26}
            style={{ mixBlendMode: 'multiply' }}
          />
        </g>

        {/*
          A lit lip just inside the coast.

          The coast path drawn in white and clipped to the landmass, so only
          its inner half survives — the outer half is cut away by the clip.
          That is what gives the edge a catch of light without putting a second
          visible line outside the navy one.
        */}
        <g clipPath="url(#pk-clip)">
          {/*
            ── The inner shade ───────────────────────────────────────────

            A wide navy stroke, blurred, clipped so only the half inside the
            coast survives. It is the shadow a raised rim casts onto the
            surface it surrounds, and it is what was missing: the land had a
            lit edge and a drop shadow beneath it, so it read as a flat sheet
            with a highlight rather than as a face set into a border.

            Very low — six percent. At any strength the eye can name, a country
            with a dark ring inside its coast stops being a map and becomes a
            button.
          */}
          <path
            d={PATH_D}
            fill="none"
            stroke="#1E3A8A"
            strokeWidth={16}
            strokeLinejoin="round"
            opacity={0.06}
            filter="url(#pk-inner-blur)"
          />

          <path
            d={PATH_D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinejoin="round"
            opacity={0.5}
          />
        </g>

        {/* The light across the face, over the texture so it softens it. */}
        <path d={PATH_D} fill="url(#pk-sheen)" style={{ mixBlendMode: 'soft-light' }} />

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
        Everything above the land. Each layer owns its own internal order; this
        is only where all of them sit relative to the geography.
      */}
      {children}
    </svg>
  )
}
