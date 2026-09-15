// src/components/home/MapHighway.tsx

/**
 * The highway corridor, drawn on the silhouette and held still.
 *
 * Three passes of one path: a wide soft wash that separates the line from the
 * land without needing a heavier stroke, the road itself, and small hollow
 * junction rings at the cities it runs through.
 *
 * Drawn BEFORE the stations so a station dot is never hidden under the road.
 * The road is the background the network sits on, not a thing competing with
 * it.
 */

import { HIGHWAY_D, HIGHWAY_JUNCTIONS } from './highway'

export function MapHighway() {
  if (!HIGHWAY_D) return null

  return (
    <g data-layer="highway" className="pointer-events-none">
      {/*
        The wash. Blurring a wide stroke gives light falling away from the road
        rather than a second visible line beside it.
      */}
      <defs>
        <filter id="hw-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      <path
        d={HIGHWAY_D}
        fill="none"
        className="stroke-plug-blue-500"
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.2}
        filter="url(#hw-glow)"
      />

      <path
        d={HIGHWAY_D}
        fill="none"
        className="stroke-plug-blue-600"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/*
        Junctions. Hollow and in the road's colour — a filled dot here would be
        indistinguishable from a station, and there is no charger at any of
        these.
      */}
      {HIGHWAY_JUNCTIONS.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.9}
          className="fill-white stroke-plug-blue-600"
          strokeWidth={1.8}
          opacity={0.75}
        />
      ))}
    </g>
  )
}
