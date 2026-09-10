// src/components/home/JourneyLayers.tsx

import { EVCar, EVCarDefs } from './EVCar'
import { CAR, CHARGER, END, ROUTE_D, START } from './journey'

/**
 * The EV journey, drawn over the Pakistan canvas.
 *
 * Static. No animation, no scroll, no GSAP — this step is composition only.
 * Every position comes from journey.ts; there is not a single coordinate
 * literal here, so nothing can drift off the route it belongs on.
 *
 * ── What is deliberately absent ───────────────────────────────────────
 *
 * No city names, no START, no DESTINATION, no visible charger label. The
 * previous pass had five text labels competing with each other over a dotted
 * map; the country is named by the headline, and the route reads as a journey
 * without being told it is one.
 *
 * ── Layer order ───────────────────────────────────────────────────────
 *
 *   route        the road
 *   stations     the start marker and the charging point
 *   destination  the far end
 *   car          above everything it travels over
 *
 * ── Why sizes are CSS classes and not attributes ──────────────────────
 *
 * The map renders about 340px wide on a phone and 800px at 1920 — the same
 * graphic at 2.4x the scale — so a marker fixed in user units is 2.4x smaller
 * on the phone. `scale` with `transform-box: fill-box` scales each group about
 * its own centre rather than the SVG origin; without fill-box, scaling a
 * marker also moves it.
 */

/** Shared by the markers so they scale together across breakpoints. */
const MARKER_SCALE =
  '[transform-box:fill-box] origin-center scale-[1.55] sm:scale-[1.3] lg:scale-100'

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
        {/* The popup's shadow. Restrained — a map status card, not a modal. */}
        <filter id="journey-card-shadow" x="-25%" y="-40%" width="150%" height="190%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>

      {/*
        ── The route ─────────────────────────────────────────────────────
        Two strokes of ONE path string. Sharing ROUTE_D is what stops the glow
        drifting off the line it lights, and `pathLength={100}` on the
        authoritative copy normalises the geometry so the next step's
        dashoffset animation works in percentages and needs no retiming if a
        waypoint moves.
      */}
      <g data-layer="route">
        <path
          d={ROUTE_D}
          fill="none"
          className="stroke-plug-blue-500"
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
          filter="url(#journey-glow)"
        />
        <path
          id="route-path"
          className="route-path stroke-plug-blue-600"
          d={ROUTE_D}
          pathLength={100}
          fill="none"
          strokeWidth={4.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ── Start, and the charging point ──────────────────────────────── */}
      <g data-layer="stations">
        {/* The origin. A filled core in a white collar so it holds against the
            dotted ground without a card behind it. */}
        <g className={MARKER_SCALE}>
          <circle cx={START.x} cy={START.y} r={13} className="fill-plug-blue-500" opacity={0.18} />
          <circle cx={START.x} cy={START.y} r={7.5} className="fill-white" />
          <circle cx={START.x} cy={START.y} r={4.6} className="fill-plug-blue-600" />
        </g>

        {/*
          The charging point, at CHARGE_PROGRESS of the route's arc length.

          A bare 3-unit dot and nothing else. The brief's preference is that
          the charger is hidden entirely until the car arrives; a mark this
          quiet reads as part of the road rather than as a labelled place, and
          it means the popup has something to grow out of rather than
          appearing over blank map. Everything that announces a charger —
          ring, bolt, card — is in the hidden group below.
        */}
        <circle cx={CHARGER.x} cy={CHARGER.y} r={3} className="fill-plug-blue-600" opacity={0.5} />
      </g>

      {/* ── The far end ────────────────────────────────────────────────── */}
      <g data-layer="destination">
        {/*
          An outlined ring, quieter than the start. It should not already look
          arrived at — the animation step fills it when the car gets there.
        */}
        <g className={MARKER_SCALE}>
          <circle cx={END.x} cy={END.y} r={11} className="fill-plug-blue-500" opacity={0.1} />
          <circle
            cx={END.x}
            cy={END.y}
            r={7}
            className="fill-white stroke-plug-navy-700"
            strokeWidth={2.4}
            opacity={0.85}
          />
        </g>
      </g>

      {/*
        ── The charging popup, built and hidden ──────────────────────────

        `opacity={0}` and `pointer-events: none`, so it is present in the DOM
        and absent from the page. The next step fades and scales it in when
        the car stops, and out when charging completes — it needs no new
        markup, only a tween.

        Anchored off CHARGER, the same point the marker and the car's stop
        use, and offset to the RIGHT of the road so the car is never behind
        it. The pointer at the left edge is what ties the card to the point
        rather than leaving it floating.

        Drawn in SVG rather than HTML on purpose: it has to stay locked to the
        route through every resize, and the route lives in this coordinate
        space. A positioned HTML card would need the SVG's letterboxing
        recomputed on every breakpoint to stay put.
      */}
      <g
        id="journey-charge-popup"
        data-layer="charge-popup"
        opacity={0}
        className="pointer-events-none"
      >
        <g className={MARKER_SCALE}>
          {/* The pointer, behind the card so its seam is covered. */}
          <path
            d={`M ${CHARGER.x + 14} ${CHARGER.y} L ${CHARGER.x + 22} ${CHARGER.y - 6}
                L ${CHARGER.x + 22} ${CHARGER.y + 6} Z`}
            className="fill-white"
          />
          <rect
            x={CHARGER.x + 21}
            y={CHARGER.y - 26}
            width={132}
            height={52}
            rx={10}
            className="fill-white stroke-slate-200"
            strokeWidth={1.4}
            filter="url(#journey-card-shadow)"
          />
          {/* Bolt, drawn not typed: no font dependency, no translation. */}
          <circle cx={CHARGER.x + 42} cy={CHARGER.y} r={12} className="fill-plug-blue-50" />
          <path
            d={`M ${CHARGER.x + 43.4} ${CHARGER.y - 6.5} L ${CHARGER.x + 38} ${CHARGER.y + 0.8}
                L ${CHARGER.x + 41.6} ${CHARGER.y + 0.8} L ${CHARGER.x + 40.2} ${CHARGER.y + 6.5}
                L ${CHARGER.x + 45.6} ${CHARGER.y - 0.8} L ${CHARGER.x + 42} ${CHARGER.y - 0.8} Z`}
            className="fill-plug-blue-600"
          />
          <text
            x={CHARGER.x + 60}
            y={CHARGER.y - 2}
            className="fill-plug-navy-900 text-[15px] font-semibold"
          >
            Charging
          </text>
          <text
            x={CHARGER.x + 60}
            y={CHARGER.y + 13}
            className="fill-slate-500 text-[12px] font-medium"
          >
            Fast charger
          </text>
        </g>
      </g>

      {/*
        ── The car ───────────────────────────────────────────────────────
        Parked at CAR_PROGRESS for this composition.

        Upright, NOT rotated to the path's heading. EVCar is a side elevation,
        and a side elevation turned to a steep heading is a dark vertical
        capsule — measured at 31x63px on the previous route, and it read as a
        blob rather than a vehicle. A plan-view car would rotate correctly but
        means redrawing EVCar, which these steps were told to reuse.

        CAR.angle is still computed and exported, so the animation step can
        damp it or swap the artwork without touching this geometry.
      */}
      <g data-layer="car" id="car-layer" transform={`translate(${CAR.x} ${CAR.y})`}>
        <g className={MARKER_SCALE}>
          <EVCar length={92} />
        </g>
      </g>
    </>
  )
}
