// src/components/home/EVCar.tsx

/**
 * A small EV, drawn rather than photographed.
 *
 * ── Why it is an inline SVG and not an image ──────────────────────────
 *
 * It has to sit inside the map's SVG so it shares the coordinate space the
 * route is drawn in — a car positioned in page pixels over an SVG that scales
 * with its container drifts off the road at every width. As a <g> it is
 * transformed in user units and stays on the path by construction.
 *
 * It is also the only way the body can pick up currentColor and the palette's
 * own tokens instead of being a fixed-colour asset that stops matching the day
 * the brand does.
 *
 * ── Drawn facing +x, centred on the road ──────────────────────────────
 *
 * The local artwork is 100 x 46 with the wheels at the bottom. The component
 * re-centres it so the origin sits between the wheels at road level, which is
 * the point that should be on the path: anchoring by the artwork's bounding-box
 * centre instead floats the car half a body above the line.
 *
 * Facing +x so a rotation taken from the path's tangent needs no offset.
 */

export interface EVCarProps {
  /**
   * Length of the car in SVG user units — not pixels.
   *
   * User units on purpose. The map scales with its container, so a car fixed in
   * pixels would grow relative to the route as the panel narrows and shrink as
   * it widens; in user units it holds its proportion to the road at every
   * width, which is what "responsive" means for something travelling a path.
   *
   * The default is measured, not chosen. At the hero's framing the whole route
   * is 36.6 units, so a car of 11 is 30% of the journey it is on — already
   * generous for a vehicle on a road, and the largest that still leaves the
   * route readable underneath it. See the note in PakistanMap about what this
   * means for the 60-90px figure.
   */
  length?: number
  className?: string
}

/** The artwork's own box, before scaling. */
const ART_W = 100
const ART_H = 46
/** Road level within that box — the bottom of the wheels. */
const ART_BASELINE = 43

export function EVCar({ length = 11, className }: EVCarProps) {
  const scale = length / ART_W

  return (
    <g
      className={className}
      // Scale first, then shift so the origin lands between the wheels at road
      // level rather than at the artwork's top-left.
      transform={`scale(${scale}) translate(${-ART_W / 2} ${-ART_BASELINE})`}
    >
      {/* Contact shadow. Under the body, so the car sits on the route rather
          than hovering over it. */}
      <ellipse cx={ART_W / 2} cy={ART_BASELINE + 1.5} rx={44} ry={3.5} fill="#0F172A" opacity={0.14} />

      {/* Body. White through silver, lit from above. */}
      <path
        d="M 5 31 C 5 26 8 23 14 22 L 27 21 C 32 13 40 9 50 9 C 61 9 69 13 74 21 L 88 23 C 93 24 95 26 95 31 L 95 34 C 95 36 93 37 91 37 L 9 37 C 7 37 5 36 5 34 Z"
        fill="url(#evcar-body)"
        stroke="#CBD5E1"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />

      {/* Glass, split by the B-pillar so it reads as a cabin rather than a
          single tinted panel. */}
      <path d="M 32 21 C 36 15 42 12 48 12 L 48 21 Z" fill="#1E293B" opacity={0.82} />
      <path d="M 52 12 C 59 12 65 15 69 21 L 52 21 Z" fill="#1E293B" opacity={0.82} />

      {/* A charge-port glow instead of a badge — it is the one detail that says
          this is electric at a size where nothing else can. */}
      <circle cx={16} cy={27} r={2.2} className="fill-plug-cyan-300" />
      <circle cx={16} cy={27} r={3.6} className="fill-plug-cyan-300" opacity={0.35} />

      {/* Wheels. */}
      {[30, 70].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={36} r={8} fill="#0F172A" />
          <circle cx={cx} cy={36} r={3.4} fill="#E2E8F0" />
        </g>
      ))}
    </g>
  )
}

/**
 * The body gradient, mounted once by whoever renders the car.
 *
 * Separate from the component because SVG gradient ids are document-global: a
 * <defs> inside EVCar would collide with itself the moment a second car is on
 * the map, and both would take whichever definition rendered last.
 */
export function EVCarDefs() {
  return (
    <linearGradient id="evcar-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="55%" stopColor="#F1F5F9" />
      <stop offset="100%" stopColor="#DBE3EC" />
    </linearGradient>
  )
}
