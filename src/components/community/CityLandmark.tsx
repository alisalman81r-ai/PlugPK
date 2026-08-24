// src/components/community/CityLandmark.tsx
import * as React from 'react'

/**
 * A city, drawn as a scene.
 *
 * These are the covers on the club cards. They were a flat gradient with the
 * city's landmark stamped on it, which read as an icon on a colour swatch — the
 * shape of a placeholder, not of artwork. What follows is the same buildings in
 * a composed picture: a dusk sky with the sun in it, hills behind, haze on the
 * horizon, the landmark, then trees and a road in front.
 *
 * The depth is the point. An icon has one layer and reads as a symbol; five
 * layers at falling contrast read as distance, and distance is what makes a
 * picture. Every layer is on the same 400×200 stage at 2:1, which is the cover's
 * aspect, so nothing is cropped and every card's horizon sits on the same line.
 *
 * These are drawings, and they are the fallback. A photograph of the city wins
 * whenever the project has one — drop a file into public/images/cities and see
 * lib/city-photos. What a drawing gives that a photograph cannot is certainty:
 * the Multan card cannot end up showing Lahore, and it costs no bytes.
 *
 * Each city is the landmark it is known by:
 *
 *   Lahore       Badshahi Mosque, at sunset over the old city
 *   Islamabad    Faisal Mosque against the Margalla foothills
 *   Karachi      Mazar-e-Quaid, coastal haze and palms
 *   Rawalpindi   Jamia Masjid over the Raja Bazaar rooftops
 *   Faisalabad   the Clock Tower and two of its eight bazaars
 *   Peshawar     Bala Hisar Fort
 *   Multan       the shrine of Shah Rukn-e-Alam in the heat
 *   Quetta       the Chiltan and Takatu ranges under snow
 */

/**
 * One palette per city, and each one is doing a job.
 *
 * Not decoration: the light is how a place looks. Lahore is a dust-warm sunset,
 * Islamabad is green and rain-washed, Karachi is coastal glare, Quetta is cold
 * altitude. A single shared gradient with the buildings swapped would make eight
 * cards of the same afternoon.
 */
interface Palette {
  /** Sky, top to horizon. */
  sky: [string, string, string]
  /** The sun or moon, and its glow. */
  sun: string
  /** Hills and haze behind the landmark. */
  far: string
  haze: string
  /** The landmark itself, and its shaded faces. */
  build: string
  shade: string
  /** Trees and road in front. */
  fore: string
  /** Where the sun sits, as a fraction of the stage. */
  sunAt: [number, number]
}

const PALETTES: Record<string, Palette> = {
  Lahore: {
    sky: ['#f9a03f', '#f2713f', '#c9366b'],
    sun: '#ffe6b0',
    far: '#c04a6e',
    haze: '#e07a63',
    build: '#fff3e2',
    shade: '#e8b79c',
    fore: '#7a2748',
    sunAt: [0.28, 0.62],
  },
  Islamabad: {
    sky: ['#7fd9c3', '#3fa9a0', '#1d6f86'],
    sun: '#f2ffe9',
    far: '#2a7a72',
    haze: '#61b8ab',
    build: '#f4fffb',
    shade: '#bfe4dc',
    fore: '#14453f',
    sunAt: [0.74, 0.5],
  },
  Karachi: {
    sky: ['#8ed2f5', '#4b9fdb', '#2b5ea8'],
    sun: '#fdfbe8',
    far: '#3f74a8',
    haze: '#8fb9de',
    build: '#fbfdff',
    shade: '#c3d6ea',
    fore: '#123458',
    sunAt: [0.79, 0.56],
  },
  Rawalpindi: {
    sky: ['#b39bef', '#8a6fd8', '#4b3a97'],
    sun: '#fff0d8',
    far: '#5f4aa8',
    haze: '#9b86dd',
    build: '#f9f6ff',
    shade: '#cfc2ea',
    fore: '#2c1f5e',
    sunAt: [0.25, 0.6],
  },
  Faisalabad: {
    sky: ['#f9a8c8', '#e56f9e', '#a83c86'],
    sun: '#fff1e0',
    far: '#b84a8c',
    haze: '#e089b8',
    build: '#fff7fb',
    shade: '#edc3d8',
    fore: '#651f52',
    sunAt: [0.7, 0.58],
  },
  Peshawar: {
    sky: ['#cfe08a', '#8cbf5c', '#3f8a55'],
    sun: '#fffbe0',
    far: '#4f8f52',
    haze: '#a8cd83',
    build: '#fbfff2',
    shade: '#d3e5bd',
    fore: '#204a2c',
    sunAt: [0.24, 0.6],
  },
  Multan: {
    sky: ['#ffd07a', '#f2a03c', '#d96a24'],
    sun: '#fff6d4',
    far: '#cf7a2a',
    haze: '#f0b167',
    build: '#fffaef',
    shade: '#f0d0a4',
    fore: '#8a3f12',
    sunAt: [0.76, 0.52],
  },
  Quetta: {
    sky: ['#b9cde0', '#7e9cbc', '#3f5e85'],
    sun: '#ffffff',
    far: '#6d87a8',
    haze: '#a9c0d6',
    build: '#ffffff',
    shade: '#cfdceb',
    fore: '#22384f',
    sunAt: [0.72, 0.44],
  },
}

/** For a city with no palette of its own. Stable per name, never random. */
const FALLBACK_PALETTE: Palette = {
  sky: ['#9ec8f5', '#5b90d6', '#2f4f96'],
  sun: '#fdfbe8',
  far: '#3f6aa8',
  haze: '#8fb0de',
  build: '#fbfdff',
  shade: '#c3d3ea',
  fore: '#152f56',
  sunAt: [0.74, 0.55],
}

function paletteFor(city: string): Palette {
  return PALETTES[city] ?? FALLBACK_PALETTE
}

/**
 * The Tailwind gradient for the compact thumbnail, which has no room for a
 * scene and gets a flat sky with the silhouette on it instead.
 */
const COMPACT_SKY: Record<string, string> = {
  Lahore: 'from-amber-400 via-orange-500 to-rose-500',
  Islamabad: 'from-emerald-400 via-teal-500 to-cyan-600',
  Karachi: 'from-sky-400 via-blue-500 to-indigo-600',
  Rawalpindi: 'from-violet-400 via-purple-500 to-indigo-600',
  Faisalabad: 'from-rose-400 via-pink-500 to-fuchsia-600',
  Peshawar: 'from-lime-400 via-green-500 to-emerald-600',
  Multan: 'from-orange-400 via-amber-500 to-yellow-500',
  Quetta: 'from-slate-400 via-slate-500 to-blue-700',
}

const FALLBACK_SKIES = [
  'from-blue-400 via-blue-500 to-indigo-600',
  'from-teal-400 via-cyan-500 to-blue-600',
  'from-purple-400 via-violet-500 to-indigo-600',
  'from-amber-400 via-orange-500 to-red-500',
]

export function citySky(city: string): string {
  const named = COMPACT_SKY[city]
  if (named) return named

  let hash = 0
  for (let index = 0; index < city.length; index += 1) {
    hash = (hash + city.charCodeAt(index)) % FALLBACK_SKIES.length
  }
  return FALLBACK_SKIES[hash] ?? FALLBACK_SKIES[0]!
}

/**
 * What each landmark is called, for the alternative text.
 *
 * A reader who cannot see the picture loses the one detail it carries that the
 * card's own text does not — which building it is.
 */
const CITY_LANDMARK: Record<string, string> = {
  Lahore: 'Badshahi Mosque, Lahore',
  Islamabad: 'Faisal Mosque, Islamabad',
  Karachi: 'Mazar-e-Quaid, Karachi',
  Rawalpindi: 'Jamia Masjid and Raja Bazaar, Rawalpindi',
  Faisalabad: 'The Clock Tower, Faisalabad',
  Peshawar: 'Bala Hisar Fort, Peshawar',
  Multan: 'Shrine of Shah Rukn-e-Alam, Multan',
  Quetta: 'The mountains around Quetta',
}

export function cityLandmarkLabel(city: string): string {
  return CITY_LANDMARK[city] ?? `${city} skyline`
}

/**
 * The buildings.
 *
 * One 200×110 box each, ground at y=110, so every landmark sits on the same
 * horizon. Drawn in flat whites and placed on the scene's stage by CityScene,
 * which washes the city's own light over them — so a building is drawn once and
 * lit eight different ways.
 */
const BACK = 'rgba(255,255,255,0.5)'
const FRONT = 'rgba(255,255,255,0.92)'
const INSET = 'rgba(255,255,255,0.62)'
/**
 * Openings — arches, doorways, a clock face, an arrow slit.
 *
 * Dark rather than a fourth shade of white: a recess drawn in white-on-white
 * disappears at the size these covers actually render, and every one of these
 * shapes is a hole in the building rather than another surface of it.
 */
const HOLE = 'rgba(15,23,42,0.2)'
/**
 * The ground, and only the ground. Opaque, where everything above it is 92%.
 *
 * Each landmark draws its own plinth over this band, and two 92% whites stacked
 * come out brighter than one, which put a visible seam where the plinth ended
 * and the pavement carried on. Against an opaque base the stack is flat.
 */
const GROUND = 'rgb(255,255,255)'

const CITY_ART: Record<string, React.ReactNode> = {
  // Three onion domes over the prayer hall, four corner minarets.
  Lahore: (
    <>
      {/* The four corner minarets, in front rather than behind: Badshahi is as
          much its minarets as its domes, and at half opacity they read as two
          faint sticks instead. Each gets a balcony ring and a capped kiosk. */}
      <g fill={FRONT}>
        <rect x="24" y="34" width="9" height="68" />
        <rect x="21" y="52" width="15" height="4" />
        <path d="M28.5 22c4 0 7 5 7 12H21.5c0-7 3-12 7-12Z" />
        <rect x="27" y="14" width="3" height="9" />
        <rect x="167" y="34" width="9" height="68" />
        <rect x="164" y="52" width="15" height="4" />
        <path d="M171.5 22c4 0 7 5 7 12h-14c0-7 3-12 7-12Z" />
        <rect x="170" y="14" width="3" height="9" />
      </g>
      <g fill={FRONT}>
        <path d="M100 38c11 0 19 12 19 26v14H81V64c0-14 8-26 19-26Z" />
        <rect x="98.5" y="28" width="3" height="10" />
        <path d="M68 54c8 0 14 9 14 18v6H54v-6c0-9 6-18 14-18Z" />
        <path d="M132 54c8 0 14 9 14 18v6h-28v-6c0-9 6-18 14-18Z" />
        <rect x="46" y="78" width="108" height="24" />
      </g>
      {/* The three arched openings of the facade. */}
      <g fill={HOLE}>
        <path d="M100 84c4 0 7 3 7 8v10H93V92c0-5 3-8 7-8Z" />
        <path d="M72 88c3 0 5 2 5 6v8H67v-8c0-4 2-6 5-6Z" />
        <path d="M128 88c3 0 5 2 5 6v8h-10v-8c0-4 2-6 5-6Z" />
      </g>
      <rect x="38" y="102" width="124" height="8" fill={FRONT} />
    </>
  ),

  // The folded tent roof, with the tall pair of minarets in front.
  Islamabad: (
    <>
      {/* All four minarets, all capped. The back pair were bare rectangles
          running off the top of the box, which read as a rendering fault
          rather than as the two minarets standing behind the tent. */}
      <g fill={BACK}>
        <rect x="57" y="30" width="6" height="70" />
        <path d="M60 21l3.5 10h-7L60 21Z" />
        <rect x="137" y="30" width="6" height="70" />
        <path d="M140 21l3.5 10h-7l3.5-10Z" />
      </g>
      <g fill={FRONT}>
        <path d="M100 26l38 70H62l38-70Z" />
        <rect x="34" y="16" width="7" height="84" />
        <path d="M37.5 5l4.5 11h-9l4.5-11Z" />
        <rect x="159" y="16" width="7" height="84" />
        <path d="M162.5 5l4.5 11h-9l4.5-11Z" />
        <rect x="28" y="100" width="144" height="10" />
      </g>
      {/* The near fold of the tent, a shade back so the roof reads as folded
          rather than flat. */}
      <path d="M100 26l13 70H87l13-70Z" fill={INSET} />
    </>
  ),

  // A domed cube on its terrace.
  Karachi: (
    <>
      <g fill={FRONT}>
        <path d="M100 20c14 0 24 14 24 32H76c0-18 10-32 24-32Z" />
        <rect x="98.5" y="12" width="3" height="9" />
        <rect x="64" y="52" width="72" height="48" />
        <rect x="50" y="100" width="100" height="10" />
      </g>
      {/* The four arches, recessed. */}
      <g fill={HOLE}>
        <path d="M82 66c4 0 8 4 8 9v25H74V75c0-5 4-9 8-9Z" />
        <path d="M118 66c4 0 8 4 8 9v25h-16V75c0-5 4-9 8-9Z" />
      </g>
    </>
  ),

  // The mosque dome and minaret over the bazaar rooftops.
  Rawalpindi: (
    <>
      <g fill={BACK}>
        <rect x="18" y="72" width="34" height="30" />
        <rect x="150" y="66" width="36" height="36" />
        <rect x="132" y="80" width="20" height="22" />
      </g>
      <g fill={FRONT}>
        <path d="M96 44c11 0 18 11 18 24H78c0-13 7-24 18-24Z" />
        <rect x="94.5" y="36" width="3" height="9" />
        <rect x="72" y="68" width="48" height="34" />
        <rect x="124" y="42" width="8" height="60" />
        <rect x="121" y="58" width="14" height="4" />
        <path d="M128 28c4 0 7 5 7 12h-14c0-7 3-12 7-12Z" />
        <rect x="126.5" y="20" width="3" height="9" />
        <rect x="52" y="76" width="20" height="26" />
        <rect x="14" y="102" width="172" height="8" />
      </g>
      <g fill={HOLE}>
        <path d="M96 78c4 0 7 3 7 7v17H89V85c0-4 3-7 7-7Z" />
        <rect x="58" y="84" width="8" height="18" />
      </g>
    </>
  ),

  // Ghanta Ghar, with two of the eight bazaars running off it.
  Faisalabad: (
    <>
      <g fill={BACK}>
        <rect x="20" y="74" width="52" height="28" />
        <rect x="128" y="78" width="54" height="24" />
      </g>
      <g fill={FRONT}>
        <path d="M100 14c7 0 11 7 11 14H89c0-7 4-14 11-14Z" />
        <rect x="98.5" y="6" width="3" height="9" />
        <rect x="88" y="28" width="24" height="6" />
        <path d="M90 34h20l5 68H85l5-68Z" />
        <rect x="78" y="102" width="44" height="8" />
        <rect x="16" y="102" width="170" height="8" />
      </g>
      {/* The clock face, which is the whole reason anybody draws this tower.
          Dark, so it still reads as a dial at 200px wide. */}
      <circle cx="100" cy="50" r="8" fill={HOLE} />
      <circle cx="100" cy="50" r="5.5" fill={FRONT} />
      <g fill={HOLE}>
        <rect x="99.25" y="45" width="1.5" height="6" />
        <rect x="100" y="49.25" width="5" height="1.5" />
      </g>
    </>
  ),

  // Crenellated curtain wall between two bastions.
  Peshawar: (
    <>
      <g fill={BACK}>
        <rect x="14" y="82" width="24" height="20" />
        <rect x="162" y="86" width="24" height="16" />
      </g>
      <g fill={FRONT}>
        <rect x="52" y="66" width="96" height="36" />
        <rect x="32" y="50" width="26" height="52" />
        <rect x="142" y="50" width="26" height="52" />
        {/* Merlons: the wall's, then a taller pair on each bastion. */}
        <rect x="56" y="58" width="10" height="8" />
        <rect x="74" y="58" width="10" height="8" />
        <rect x="92" y="58" width="10" height="8" />
        <rect x="110" y="58" width="10" height="8" />
        <rect x="128" y="58" width="10" height="8" />
        <rect x="32" y="42" width="10" height="8" />
        <rect x="48" y="42" width="10" height="8" />
        <rect x="142" y="42" width="10" height="8" />
        <rect x="158" y="42" width="10" height="8" />
        <rect x="10" y="102" width="180" height="8" />
      </g>
      {/* The gate, and one arrow slit per bastion. */}
      <g fill={HOLE}>
        <path d="M100 76c6 0 10 5 10 11v15H90V87c0-6 4-11 10-11Z" />
        <rect x="42" y="62" width="6" height="14" />
        <rect x="152" y="62" width="6" height="14" />
      </g>
    </>
  ),

  // The octagonal tomb, stepping in twice before the dome.
  Multan: (
    <>
      <g fill={BACK}>
        <rect x="54" y="80" width="12" height="22" />
        <rect x="134" y="80" width="12" height="22" />
      </g>
      <g fill={FRONT}>
        <path d="M100 12c12 0 20 13 20 28H80c0-15 8-28 20-28Z" />
        <rect x="98.5" y="4" width="3" height="9" />
        <path d="M78 40h44l4 22H74l4-22Z" />
        <path d="M70 62h60l6 40H64l6-40Z" />
        <rect x="50" y="102" width="100" height="8" />
      </g>
      <g fill={HOLE}>
        <path d="M100 74c5 0 9 4 9 10v18H91V84c0-6 4-10 9-10Z" />
        <rect x="80" y="46" width="7" height="16" />
        <rect x="113" y="46" width="7" height="16" />
      </g>
    </>
  ),

  // Two ranges and the plain between them.
  Quetta: (
    <>
      <path d="M0 102l36-54 26 28 30-40 34 44 30-30 44 52H0Z" fill={BACK} />
      <path d="M0 102l30-30 26 22 28-28 32 30 30-20 34 26v0H0Z" fill={INSET} />
      <g fill={FRONT}>
        <rect x="0" y="100" width="200" height="10" />
        <rect x="46" y="88" width="16" height="12" />
        <rect x="70" y="82" width="20" height="18" />
        <rect x="98" y="86" width="14" height="14" />
        <rect x="120" y="80" width="18" height="20" />
        <rect x="128" y="70" width="4" height="12" />
      </g>
    </>
  ),
}

/** Blocks of different heights. Enough to read as a city, not as any city. */
const GENERIC_SKYLINE = (
  <>
    <g fill={BACK}>
      <rect x="18" y="66" width="30" height="36" />
      <rect x="152" y="70" width="32" height="32" />
    </g>
    <g fill={FRONT}>
      <rect x="52" y="52" width="28" height="50" />
      <rect x="86" y="38" width="30" height="64" />
      <rect x="122" y="60" width="26" height="42" />
      <rect x="99" y="26" width="4" height="12" />
      <rect x="14" y="102" width="172" height="8" />
    </g>
    <g fill={HOLE}>
      <rect x="94" y="52" width="6" height="10" />
      <rect x="104" y="52" width="6" height="10" />
      <rect x="60" y="66" width="6" height="10" />
      <rect x="130" y="72" width="6" height="10" />
    </g>
  </>
)

/** Where the landmark sits on the 400×200 stage. */
const HORIZON = 150
const ART_SCALE = 1.1
const ART_WIDTH = 200 * ART_SCALE
const ART_HEIGHT = 110 * ART_SCALE

/**
 * Distant hills, per city.
 *
 * Islamabad has the Margallas behind it and Quetta is ringed by mountains, so
 * those two get real ridgelines. Everywhere else gets a low, soft swell: the
 * plains are flat, and inventing a mountain range behind Faisalabad would be
 * the same kind of lie as inventing a member count.
 */
const FAR_RIDGE: Record<string, string> = {
  Islamabad: `M0 ${HORIZON} L54 96 L104 124 L150 82 L214 122 L268 90 L330 126 L400 100 V${HORIZON} Z`,
  Quetta: `M0 ${HORIZON} L48 74 L96 116 L146 62 L206 118 L258 78 L318 120 L400 86 V${HORIZON} Z`,
  Peshawar: `M0 ${HORIZON} L70 118 L138 132 L212 112 L290 130 L400 116 V${HORIZON} Z`,
}

const SOFT_SWELL = `M0 ${HORIZON} C70 132 150 140 210 134 C280 127 340 137 400 130 V${HORIZON} Z`

/**
 * The land in front, with a vegetated top edge.
 *
 * One path, not a band plus decoration. The first version drew a flat road and
 * scattered ellipses above it, and because the ellipses did not touch the road
 * they read as dark smudges hanging in the air. Bumps built into the landmass's
 * own top edge read as scrub on a ridge, which is what they are.
 *
 * It also does the clipping. Everything above is drawn first, so this covers
 * whatever hangs below the horizon — which is how each landmark's plinth gets
 * trimmed to the ground line without a clipPath.
 */
const LAND_EDGE = (() => {
  let d = `M0 ${HORIZON}`
  // Eight bumps across the stage, alternating height so the ridge is not a
  // row of identical humps.
  for (let index = 0; index < 8; index += 1) {
    d += ` q 25 ${index % 2 === 0 ? -9 : -5} 50 0`
  }
  return `${d} V200 H0 Z`
})()

/**
 * What grows in front, per city.
 *
 * Two palms for Karachi, pines for the two hill cities, broadleaf for the
 * plains — enough to place the scene without pretending to detail nobody can
 * see at 280px wide.
 */
function Foreground({ city, fill }: { city: string; fill: string }) {
  const land = <path d={LAND_EDGE} fill={fill} />

  if (city === 'Karachi') {
    return (
      <g fill={fill}>
        {land}
        {/* Palms: a bare trunk and a crown of fronds, which is all a palm is
            from this distance. */}
        {[46, 358].map((x) => (
          <g key={x}>
            <path d={`M${x} ${HORIZON + 22} C${x - 3} ${HORIZON - 2} ${x + 2} ${HORIZON - 18} ${x} ${HORIZON - 30} l5 1 c1 12 -1 28 1 51 Z`} />
            {[-1, 1].map((side) => (
              <g key={side}>
                <path d={`M${x + 2} ${HORIZON - 30} c${side * 20} -6 ${side * 30} 2 ${side * 34} 10 c${side * -12} -4 ${side * 22} -2 ${side * -34} -6 Z`} />
                <path d={`M${x + 2} ${HORIZON - 30} c${side * 16} -14 ${side * 28} -14 ${side * 34} -8 c${side * -14} 0 ${side * -20} 4 ${side * -34} 12 Z`} />
              </g>
            ))}
          </g>
        ))}
      </g>
    )
  }

  if (city === 'Islamabad' || city === 'Quetta') {
    return (
      <g fill={fill}>
        {land}
        {/* Pines, alternating height so the row is not a comb. */}
        {[26, 52, 74, 330, 356, 380].map((x, index) => {
          const height = index % 2 === 0 ? 44 : 32
          return (
            <path
              key={x}
              d={`M${x} ${HORIZON - height} l11 ${height} h-22 Z M${x} ${HORIZON - height + 14} l15 ${height - 14} h-30 Z`}
            />
          )
        })}
      </g>
    )
  }

  return (
    <g fill={fill}>
      {land}
      {/* One broadleaf either side, rooted below the ridge so the trunk meets
          the land rather than stopping above it. */}
      {[30, 370].map((x) => (
        <g key={x}>
          <rect x={x - 2} y={HORIZON - 18} width="4" height="26" />
          <ellipse cx={x} cy={HORIZON - 24} rx="16" ry="12" />
          <ellipse cx={x - 9} cy={HORIZON - 18} rx="10" ry="8" />
          <ellipse cx={x + 9} cy={HORIZON - 18} rx="10" ry="8" />
        </g>
      ))}
    </g>
  )
}

export interface CitySceneProps {
  city: string
  className?: string
}

/**
 * The full cover scene, at the cover's own 2:1.
 *
 * `preserveAspectRatio="xMidYMid slice"` rather than `meet`: a scene has no
 * margins to spare, and letterboxing it would put bands of nothing at the sides
 * of a card that is never exactly 2:1. Slice fills the box and trims the
 * overflow, which for a picture is the right trade.
 */
export function CityScene({ city, className }: CitySceneProps) {
  const palette = paletteFor(city)
  const ridge = FAR_RIDGE[city] ?? SOFT_SWELL
  const [sunX, sunY] = palette.sunAt
  // Ids have to be unique per city or two scenes on one page share a gradient.
  const key = city.replace(/[^A-Za-z0-9]/g, '') || 'city'

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={`sky-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.sky[0]} />
          <stop offset="0.55" stopColor={palette.sky[1]} />
          <stop offset="1" stopColor={palette.sky[2]} />
        </linearGradient>
        <radialGradient id={`glow-${key}`}>
          <stop offset="0" stopColor={palette.sun} stopOpacity="0.85" />
          <stop offset="1" stopColor={palette.sun} stopOpacity="0" />
        </radialGradient>
        {/*
          Haze pools along the horizon, and it has to stay thin.

          At 0.9 it swallowed the landmark on every warm-palette card — the
          building and the air behind it came out the same value, so the subject
          of the picture vanished into its own atmosphere. 0.45 still separates
          the hills from the foreground, which is the only job it has.
        */}
        <linearGradient id={`haze-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.haze} stopOpacity="0" />
          <stop offset="1" stopColor={palette.haze} stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Sky, then the sun sitting in it. */}
      <rect width="400" height="200" fill={`url(#sky-${key})`} />
      <circle cx={400 * sunX} cy={200 * sunY} r="86" fill={`url(#glow-${key})`} />
      <circle cx={400 * sunX} cy={200 * sunY} r="17" fill={palette.sun} opacity="0.95" />

      {/* Hills, then haze pooling along the horizon in front of them. */}
      <path d={ridge} fill={palette.far} opacity="0.55" />
      <rect y={HORIZON - 46} width="400" height="46" fill={`url(#haze-${key})`} />

      {/* The landmark, dropped onto the stage: centred, and scaled so its own
          ground line lands exactly on the scene's horizon. */}
      <g transform={`translate(${(400 - ART_WIDTH) / 2} ${HORIZON - ART_HEIGHT}) scale(${ART_SCALE})`}>
        {/*
          No ground band here, unlike the compact silhouette.

          A full-bleed white bar at the horizon is right when the landmark is
          the whole image — it is the pavement it stands on. In a scene the land
          below the horizon supplies that, and the white bar came out as a bright
          stripe running edge to edge across every card: the one thing in the
          picture at full brightness, and not the subject. Each landmark's own
          plinth is enough of a terrace.
        */}
        {CITY_ART[city] ?? GENERIC_SKYLINE}
      </g>

      {/* The city's light, washed over everything above the horizon.

          This is what stops the buildings reading as white cut-outs pasted onto
          a coloured sky: at 18% it barely registers as a layer, but it puts the
          same tint on the stone as on the air around it, which is the whole
          difference between a photograph and a sticker. */}
      <rect
        y={HORIZON - ART_HEIGHT}
        width="400"
        height={ART_HEIGHT}
        fill={palette.shade}
        opacity="0.1"
      />

      {/* A shadow pooling at the base of the landmark. Without it the building
          floats: nothing else in the picture says it is standing on the ground
          rather than pasted in front of it. */}
      <ellipse cx="200" cy={HORIZON + 1} rx="130" ry="8" fill="#0b1220" opacity="0.16" />

      <Foreground city={city} fill={palette.fore} />

      {/* Vignette: the corners fall off, which is what stops a flat fill from
          reading as a flat fill. */}
      <rect width="400" height="200" fill={`url(#vig-${key})`} />
      <defs>
        <radialGradient id={`vig-${key}`} cx="0.5" cy="0.45" r="0.78">
          <stop offset="0.6" stopColor="#0b1220" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export interface CityLandmarkProps {
  city: string
  className?: string
}

/**
 * The bare silhouette, for the compact rows in the community sidebar.
 *
 * A 44px thumbnail has no room for a scene — sun, haze and foreground all land
 * inside two pixels of each other — so it gets the landmark alone on the flat
 * `citySky` gradient.
 */
export function CityLandmark({ city, className }: CityLandmarkProps) {
  return (
    <svg
      viewBox="0 0 200 110"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="-120" y="103" width="440" height="12" fill={GROUND} />
      {CITY_ART[city] ?? GENERIC_SKYLINE}
    </svg>
  )
}
