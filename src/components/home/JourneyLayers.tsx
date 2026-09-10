// src/components/home/JourneyLayers.tsx

import { EVCar, EVCarDefs } from './EVCar'
import { CAR, CHARGER, DESTINATION, GEO, ORIGIN, ROUTE_D } from './journey'

/**
 * The Faisalabad -> Islamabad journey, drawn over the Pakistan canvas.
 *
 * Static. No animation, no scroll, no GSAP — this step is composition only.
 * Every position comes from journey.ts; there is not a single coordinate
 * literal in this file, so the charger and the car cannot drift off the route
 * they are supposed to be on.
 *
 * ── Layer order ───────────────────────────────────────────────────────
 *
 *   route        the road
 *   stations     the origin and the charging stop
 *   destination  Islamabad
 *   car          on top of everything it travels over
 *
 * ── Why sizes are CSS classes and not attributes ──────────────────────
 *
 * The map is about 340px wide on a phone and 800px at 1920 — the same graphic
 * rendered at 2.4x the scale. A label sized in user units is therefore 2.4x
 * smaller on the phone, and the value that reads well on a desktop is
 * unreadable there.
 *
 * Font sizes are set with Tailwind's arbitrary values, which land as CSS
 * `font-size` in px — and inside an SVG a CSS px IS a user unit. So the
 * breakpoint prefixes work normally, and the numbers go DOWN as the screen
 * goes up: bigger user-unit type on a phone renders at roughly the same
 * physical size as smaller user-unit type on a desktop.
 *
 * The markers use the same trick through `scale`, with `transform-box:
 * fill-box` so each group scales about its own centre rather than the SVG
 * origin — without that, scaling a marker also moves it.
 */

/** Shared by every marker group, so they all scale together across breakpoints. */
const MARKER_SCALE = '[transform-box:fill-box] origin-center scale-[1.55] sm:scale-[1.3] lg:scale-100'

/** City labels. Larger in user units on small screens — see the note above. */
const CITY_LABEL =
  'fill-plug-navy-900 font-semibold tracking-wide text-[32px] sm:text-[27px] lg:text-[22px] xl:text-[19px]'

const MICRO_LABEL =
  'fill-slate-500 font-semibold uppercase tracking-[0.18em] text-[21px] sm:text-[18px] lg:text-[14px] xl:text-[12.5px]'

const CHARGER_LABEL =
  'fill-plug-blue-600 font-semibold uppercase tracking-[0.16em] text-[21px] sm:text-[18px] lg:text-[14px] xl:text-[12.5px]'

export function JourneyLayers() {
  return (
    <>
      <defs>
        <EVCarDefs />
        {/* A soft light under the route, so the line separates from the dots
            without needing a heavier stroke. */}
        <filter id="journey-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/*
        ── The route ─────────────────────────────────────────────────────
        Three strokes of ONE path string. Sharing `ROUTE_D` is what stops the
        glow drifting off the line it is lighting, and `pathLength={100}` on
        the authoritative copy normalises the geometry so the next step's
        dashoffset animation works in percentages and needs no retiming when a
        waypoint moves.
      */}
      <g data-layer="route">
        <path
          d={ROUTE_D}
          fill="none"
          className="stroke-plug-blue-500"
          strokeWidth={13}
          strokeLinecap="round"
          opacity={0.16}
          filter="url(#journey-glow)"
        />
        <path
          id="route-path"
          className="route-path stroke-plug-blue-600"
          d={ROUTE_D}
          pathLength={100}
          fill="none"
          strokeWidth={4.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ── Origin and the charging stop ───────────────────────────────── */}
      <g data-layer="stations">
        {/* Faisalabad. A filled dot in a white collar, so it holds against the
            dotted ground without a card behind it. */}
        <g className={MARKER_SCALE}>
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r={13} className="fill-plug-blue-500" opacity={0.16} />
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r={7.5} className="fill-white" />
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r={4.6} className="fill-plug-blue-600" />
        </g>
        <text x={ORIGIN.x - 20} y={ORIGIN.y + 5} textAnchor="end" className={CITY_LABEL}>
          {GEO.origin.name}
        </text>
        <text x={ORIGIN.x - 20} y={ORIGIN.y + 31} textAnchor="end" className={MICRO_LABEL}>
          Start
        </text>

        {/* The charging stop. Its position is CHARGER, read off the route at
            50% of its arc length — not a coordinate written down here. */}
        <g className={MARKER_SCALE}>
          <circle cx={CHARGER.x} cy={CHARGER.y} r={15} className="fill-plug-cyan-400" opacity={0.18} />
          <circle
            cx={CHARGER.x}
            cy={CHARGER.y}
            r={9.5}
            className="fill-white stroke-plug-blue-500"
            strokeWidth={2}
          />
          {/* A bolt, drawn rather than typed: no font dependency, no
              translation, and it stays crisp at any scale. */}
          <path
            d={`M ${CHARGER.x + 1.6} ${CHARGER.y - 6} L ${CHARGER.x - 3.6} ${CHARGER.y + 0.8}
                L ${CHARGER.x - 0.3} ${CHARGER.y + 0.8} L ${CHARGER.x - 1.6} ${CHARGER.y + 6}
                L ${CHARGER.x + 3.6} ${CHARGER.y - 0.8} L ${CHARGER.x + 0.3} ${CHARGER.y - 0.8} Z`}
            className="fill-plug-blue-600"
          />
        </g>
        <text x={CHARGER.x + 24} y={CHARGER.y + 4} textAnchor="start" className={CHARGER_LABEL}>
          Fast charger
        </text>
      </g>

      {/* ── Islamabad ──────────────────────────────────────────────────── */}
      <g data-layer="destination">
        {/*
          A ring rather than a filled dot. It reads as a distinct kind of
          place from the origin at a glance, and it stays quiet — the next
          step fills it on arrival, so the initial state should not already
          look like it has been reached.
        */}
        <g className={MARKER_SCALE}>
          <circle cx={DESTINATION.x} cy={DESTINATION.y} r={13} className="fill-plug-blue-500" opacity={0.14} />
          <circle
            cx={DESTINATION.x}
            cy={DESTINATION.y}
            r={7.5}
            className="fill-white stroke-plug-navy-800"
            strokeWidth={2.6}
          />
        </g>
        <text x={DESTINATION.x + 22} y={DESTINATION.y + 5} textAnchor="start" className={CITY_LABEL}>
          {GEO.destination.name}
        </text>
        <text x={DESTINATION.x + 22} y={DESTINATION.y - 30} textAnchor="start" className={MICRO_LABEL}>
          Destination
        </text>
      </g>

      {/*
        ── The car ───────────────────────────────────────────────────────
        Parked at 24% of the route for this composition.

        Upright, NOT rotated to the path's heading — and that is deliberate.
        Faisalabad to Islamabad is a north-south journey, so the route's
        tangent here is about -88 degrees. EVCar is drawn in side elevation,
        and a side-elevation car turned on its end is a dark vertical capsule:
        rendered that way it measured 31 x 63px and read as a blob, not a
        vehicle. The brief's own test is "it should read as CAR, not DOT".

        A top-down vehicle would rotate correctly, but that means redrawing
        EVCar, which this step was told to reuse. Upright keeps the silhouette
        legible, and a vehicle icon held level while it travels a route is the
        ordinary convention on a map anyway.

        CAR.angle is still computed and exported — the animation step can
        damp it, or swap to a plan-view car, without touching this geometry.
      */}
      <g
        data-layer="car"
        id="car-layer"
        transform={`translate(${CAR.x} ${CAR.y})`}
      >
        <g className={MARKER_SCALE}>
          <EVCar length={92} />
        </g>
      </g>
    </>
  )
}
