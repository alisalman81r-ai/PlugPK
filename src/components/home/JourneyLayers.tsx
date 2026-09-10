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

/**
 * Where the charging card sits relative to CHARGER, in user units.
 *
 * Above, not beside. Measured at 1440: with the card to the right the popup
 * box overlapped the car's box at every sampled point of the charging phase
 * — the car is 92 units long and centred on the charger, so its nose reached
 * well into a card starting 22 units to the right.
 *
 * Measured rather than assumed: EVCar is 92 units long and its artwork is
 * re-centred on the road, so its roof reaches about 40 units ABOVE the
 * charger, not 14. A first attempt at dy -104 still failed the overlap check
 * because the tail was reaching down into that roof.
 *
 * -132 then still failed at 820, because MARKER_SCALE grows BOTH boxes about
 * their own centres — at sm:scale-[1.3] the car grows upward as well and the
 * two bounding boxes met again with 1.4 units to spare. -160 clears it at
 * every marker scale: 27 units at 1.3x and 12 at the phone's 1.55x.
 *
 * One constant, used by every part of the card. Do not offset pieces
 * individually.
 */
const CARD = { dx: -46, dy: -160, w: 152, h: 62 } as const

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
          data-route-glow
          d={ROUTE_D}
          pathLength={100}
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

        {/*
          The charger waking up. Hidden until the car arrives; the hook fades
          this group in over the arrival sub-phase. One ring and a soft halo —
          no repeated pulsing, no radar waves.
        */}
        <g id="journey-charger-active" opacity={0} className="pointer-events-none">
          <circle cx={CHARGER.x} cy={CHARGER.y} r={17} className="fill-plug-cyan-400" opacity={0.16} />
          <circle
            cx={CHARGER.x}
            cy={CHARGER.y}
            r={9}
            fill="none"
            className="stroke-plug-blue-500"
            strokeWidth={2}
          />
          <circle cx={CHARGER.x} cy={CHARGER.y} r={4.4} className="fill-plug-blue-600" />
        </g>
      </g>

      {/* ── The far end ────────────────────────────────────────────────── */}
      <g data-layer="destination" id="journey-destination">
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
      {/*
        ── The charging popup ────────────────────────────────────────────

        One card, reused for every state. "Charging" becomes "Ready" and the
        bolt becomes a tick — there is no second popup to keep in sync.

        Everything the hook mutates carries an id: #jc-title, #jc-pct,
        #jc-fill, #jc-bolt, #jc-check. Nothing here computes anything; this
        file is the markup and journey/useEvJourney own the numbers.

        Still SVG, still anchored off CHARGER, so it stays locked to the route
        through every resize.
      */}
      <g
        id="journey-charge-popup"
        data-layer="charge-popup"
        opacity={0}
        className="pointer-events-none"
      >
        <g className={MARKER_SCALE}>
          {/* Tail, pointing down at the charger from the card's underside. */}
          <path
            d={`M ${CHARGER.x + CARD.dx + 60} ${CHARGER.y + CARD.dy + CARD.h - 2}
                L ${CHARGER.x + CARD.dx + 76} ${CHARGER.y + CARD.dy + CARD.h - 2}
                L ${CHARGER.x + CARD.dx + 68} ${CHARGER.y + CARD.dy + CARD.h + 14} Z`}
            className="fill-white"
          />
          <rect
            x={CHARGER.x + CARD.dx}
            y={CHARGER.y + CARD.dy}
            width={CARD.w}
            height={CARD.h}
            rx={11}
            className="fill-white stroke-slate-200"
            strokeWidth={1.4}
            filter="url(#journey-card-shadow)"
          />

          {/* Bolt while charging, tick when ready. Same disc, cross-faded. */}
          <circle cx={CHARGER.x + CARD.dx + 21} cy={CHARGER.y + CARD.dy + 21} r={11} className="fill-plug-blue-50" />
          <path
            id="jc-bolt"
            d={`M ${CHARGER.x + CARD.dx + 22.3} ${CHARGER.y + CARD.dy + 15} L ${CHARGER.x + CARD.dx + 17.2} ${CHARGER.y + CARD.dy + 21.8}
                L ${CHARGER.x + CARD.dx + 20.6} ${CHARGER.y + CARD.dy + 21.8} L ${CHARGER.x + CARD.dx + 19.3} ${CHARGER.y + CARD.dy + 27}
                L ${CHARGER.x + CARD.dx + 24.4} ${CHARGER.y + CARD.dy + 20.2} L ${CHARGER.x + CARD.dx + 21} ${CHARGER.y + CARD.dy + 20.2} Z`}
            className="fill-plug-blue-600"
          />
          <path
            id="jc-check"
            d={`M ${CHARGER.x + CARD.dx + 16.6} ${CHARGER.y + CARD.dy + 20.8} L ${CHARGER.x + CARD.dx + 19.8} ${CHARGER.y + CARD.dy + 24}
                L ${CHARGER.x + CARD.dx + 25.4} ${CHARGER.y + CARD.dy + 17.6}`}
            fill="none"
            className="stroke-plug-blue-600"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0}
          />

          <text
            id="jc-title"
            x={CHARGER.x + CARD.dx + 38}
            y={CHARGER.y + CARD.dy + 20}
            className="fill-plug-navy-900 text-[15px] font-semibold"
          >
            Charging
          </text>
          {/* The percentage is deliberately smaller than the title. */}
          <text
            id="jc-pct"
            x={CHARGER.x + CARD.dx + 144}
            y={CHARGER.y + CARD.dy + 20}
            textAnchor="end"
            className="fill-slate-500 text-[12.5px] font-semibold tabular-nums"
          >
            0%
          </text>

          {/* Track and fill. The hook animates the fill's width only. */}
          <rect
            x={CHARGER.x + CARD.dx + 16}
            y={CHARGER.y + CARD.dy + 32}
            width={128}
            height={5}
            rx={2.5}
            className="fill-slate-200"
          />
          <rect
            id="jc-fill"
            x={CHARGER.x + CARD.dx + 16}
            y={CHARGER.y + CARD.dy + 32}
            width={0}
            height={5}
            rx={2.5}
            className="fill-plug-blue-600"
          />

          <text
            x={CHARGER.x + CARD.dx + 16}
            y={CHARGER.y + CARD.dy + 52}
            className="fill-slate-500 text-[11px] font-medium uppercase tracking-[0.1em]"
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
